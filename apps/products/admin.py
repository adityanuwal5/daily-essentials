"""Django admin configuration for products."""

from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "price",
        "stock_quantity",
        "is_veg",
        "deal_badge",
        "is_active",
    )
    list_filter = ("category", "is_veg", "is_active")
    search_fields = ("name", "brand", "description")
    list_editable = ("price", "stock_quantity", "is_active")
