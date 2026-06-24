"""Serializers for the product catalog."""

from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Full product representation used for both reads and admin writes."""

    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    food_type = serializers.SerializerMethodField()
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "description",
            "category",
            "category_display",
            "price",
            "mrp",
            "stock_quantity",
            "in_stock",
            "brand",
            "unit",
            "image_emoji",
            "is_veg",
            "food_type",
            "deal_badge",
            "estimated_delivery_time",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_food_type(self, obj):
        """Convenience flag mirroring the frontend's veg/non-veg indicator."""
        return "veg" if obj.is_veg else "nonveg"
