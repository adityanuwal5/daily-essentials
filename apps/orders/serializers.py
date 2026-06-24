"""Serializers for the checkout workflow."""

from rest_framework import serializers

from apps.products.models import Product

from .models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    """One requested line item in a checkout payload."""

    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class OrderItemSerializer(serializers.ModelSerializer):
    """Read representation of a stored line item (with its price snapshot)."""

    line_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_name",
            "unit_price",
            "quantity",
            "line_total",
        )


class OrderSerializer(serializers.ModelSerializer):
    """Create + read serializer for orders.

    On create, the client sends ``items`` as ``[{product, quantity}, ...]``.
    Prices and the order total are computed *server-side* from the live
    catalog — client-supplied totals are never trusted. Stock is validated and
    decremented atomically by the view.
    """

    items = serializers.SerializerMethodField(read_only=True)
    items_input = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "delivery_address",
            "payment_method",
            "total_amount",
            "items",
            "items_input",
            "created_at",
        )
        read_only_fields = ("id", "status", "total_amount", "created_at")

    def get_items(self, obj):
        return OrderItemSerializer(obj.items.all(), many=True).data

    def validate_items_input(self, value):
        if not value:
            raise serializers.ValidationError("An order must contain at least one item.")
        return value
