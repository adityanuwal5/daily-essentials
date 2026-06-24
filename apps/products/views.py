"""Catalog endpoints: a public read feed and an admin-only management API."""

from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .filters import ProductFilter
from .models import Product
from .permissions import IsAdminUserRole
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Public marketplace feed.

    GET /api/products/        — list (filter via ?category=&food_type=&...)
    GET /api/products/{id}/   — retrieve a single product

    Only active products are exposed to shoppers.
    """

    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filterset_class = ProductFilter
    search_fields = ["name", "brand", "description"]
    ordering_fields = ["price", "name", "estimated_delivery_time"]

    def get_queryset(self):
        return Product.objects.filter(is_active=True)


class AdminProductViewSet(viewsets.ModelViewSet):
    """Administrative catalog management, gated by server-side RBAC.

    Every write operation (POST/PUT/PATCH/DELETE) is protected by
    ``IsAdminUserRole``; non-admin callers receive a hard 403 Forbidden.
    Admins see all products, including inactive ones.
    """

    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUserRole]
    filterset_class = ProductFilter
    search_fields = ["name", "brand", "description"]
