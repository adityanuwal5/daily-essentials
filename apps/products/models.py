"""Product catalog schema, expressed purely through the Django ORM."""

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Product(models.Model):
    """A single sellable item in the DailyEssentials catalog.

    Categories are modelled as text choices so the set can be extended later by
    simply appending a new member — existing rows and queries are unaffected.
    """

    class Category(models.TextChoices):
        DAIRY = "dairy", "Dairy"
        SNACKS = "snacks", "Snacks"
        HYGIENE = "hygiene", "Hygiene"
        EVERYDAY = "everyday", "Everyday Needs"
        # Append further categories here as the catalog grows, e.g.:
        # BEVERAGES = "beverages", "Beverages"

    # --- Core descriptive fields ---
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=32,
        choices=Category.choices,
        default=Category.EVERYDAY,
        db_index=True,
    )

    # --- Commerce fields ---
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Current selling price.",
    )
    mrp = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Maximum retail price; used to show a discount badge.",
    )
    stock_quantity = models.PositiveIntegerField(default=0)

    # --- Presentation / merchandising ---
    brand = models.CharField(max_length=120, blank=True)
    unit = models.CharField(
        max_length=50, blank=True, help_text="e.g. '500 ml', '1 kg', '100 g'."
    )
    image_emoji = models.CharField(
        max_length=8, blank=True, help_text="Emoji used as a lightweight thumbnail."
    )
    is_veg = models.BooleanField(default=True)
    deal_badge = models.CharField(
        max_length=60,
        null=True,
        blank=True,
        help_text="Optional promotional label, e.g. 'Buy 1 Get 1'.",
    )
    estimated_delivery_time = models.PositiveIntegerField(
        default=15, help_text="Estimated delivery time in minutes."
    )
    is_active = models.BooleanField(
        default=True, help_text="Soft on/off switch for marketplace visibility."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["category", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    @property
    def in_stock(self):
        return self.stock_quantity > 0
