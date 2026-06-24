"""Checkout endpoint and the admin dashboard metrics endpoint."""

from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Sum
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.products.permissions import IsAdminUserRole

from .models import Order, OrderItem
from .serializers import OrderSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/orders/ — list the caller's orders or place a new one."""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users only ever see their own order history.
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items")
            .all()
        )

    @transaction.atomic
    def perform_create(self, serializer):
        items = serializer.validated_data["items_input"]

        # Acquire the write lock UP FRONT by making the order INSERT the first
        # statement of the transaction. On SQLite, a transaction that starts
        # with a read (SELECT ... FOR UPDATE) and later upgrades to a write can
        # hit "database is locked" *immediately* under concurrency — the busy
        # timeout doesn't apply to lock upgrades because waiting could deadlock.
        # Starting with a write makes concurrent checkouts queue on the busy
        # timeout instead, eliminating those 500s. (Harmless on Postgres/MySQL,
        # which lock the rows via the SELECT ... FOR UPDATE below regardless.)
        order = Order(
            user=self.request.user,
            delivery_address=serializer.validated_data["delivery_address"],
            payment_method=serializer.validated_data.get("payment_method", "cod"),
        )
        order.save()

        # Lock the involved product rows so stock validation + decrement is
        # race-free under concurrent checkouts.
        product_ids = [entry["product"].pk for entry in items]
        locked = {
            p.pk: p
            for p in Product.objects.select_for_update().filter(pk__in=product_ids)
        }

        line_items = []
        for entry in items:
            product = locked[entry["product"].pk]
            quantity = entry["quantity"]

            if quantity > product.stock_quantity:
                # Raises a 400 and rolls back the whole atomic block.
                raise serializers.ValidationError(
                    {
                        "items_input": (
                            f"Insufficient stock for '{product.name}'. "
                            f"Available: {product.stock_quantity}, requested: {quantity}."
                        )
                    }
                )

            line_items.append(
                OrderItem(
                    order=order,
                    product=product,
                    product_name=product.name,
                    unit_price=product.price,
                    quantity=quantity,
                )
            )
            product.stock_quantity -= quantity

        OrderItem.objects.bulk_create(line_items)
        Product.objects.bulk_update(locked.values(), ["stock_quantity"])

        order.recalculate_total()
        # Expose the persisted order so the response serializes the full record.
        serializer.instance = order


class DashboardMetricsView(APIView):
    """GET /api/admin/dashboard-metrics/ — admin-only system metrics.

    Bound exclusively to ``IsAdminUserRole``: regular clients get 403 Forbidden.
    """

    permission_classes = [IsAdminUserRole]

    def get(self, request, *args, **kwargs):
        revenue_states = [
            Order.Status.PLACED,
            Order.Status.CONFIRMED,
            Order.Status.OUT_FOR_DELIVERY,
            Order.Status.DELIVERED,
        ]
        revenue = (
            Order.objects.filter(status__in=revenue_states).aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        orders_by_status = {
            row["status"]: row["count"]
            for row in Order.objects.values("status").annotate(count=Count("id"))
        }

        metrics = {
            "total_orders": Order.objects.count(),
            "total_revenue": revenue,
            "total_products": Product.objects.count(),
            "active_products": Product.objects.filter(is_active=True).count(),
            "low_stock_products": Product.objects.filter(
                is_active=True, stock_quantity__lt=20
            ).count(),
            "out_of_stock_products": Product.objects.filter(
                stock_quantity=0
            ).count(),
            "orders_by_status": orders_by_status,
        }
        return Response(metrics, status=status.HTTP_200_OK)
