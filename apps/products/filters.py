"""Query-parameter filters for the public product feed."""

import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    """Supports ?category=&min_price=&max_price=&food_type=&is_veg=.

    ``food_type`` accepts 'veg' or 'nonveg' and maps onto the ``is_veg``
    boolean column, matching the contract the React client expects.
    """

    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    food_type = django_filters.CharFilter(method="filter_food_type")

    class Meta:
        model = Product
        fields = ["category", "is_veg", "min_price", "max_price", "food_type"]

    def filter_food_type(self, queryset, name, value):
        value = value.strip().lower()
        if value == "veg":
            return queryset.filter(is_veg=True)
        if value in {"nonveg", "non-veg"}:
            return queryset.filter(is_veg=False)
        return queryset
