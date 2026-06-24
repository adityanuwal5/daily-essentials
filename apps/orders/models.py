"""Order domain models linking users to the products they purchase."""

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.products.models import Product


class Order(models.Model):
    """A single customer checkout.

    Money fields store snapshots computed at checkout time so historical orders
    remain accurate even if product prices later change.
    """

    class Status(models.TextChoices):
        PLACED = "placed", "Placed"
        CONFIRMED = "confirmed", "Confirmed"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for delivery"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLACED, db_index=True
    )
    delivery_address = models.TextField()
    payment_method = models.CharField(max_length=40, default="cod")

    # Monetary snapshot of the whole order.
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} by {self.user} ({self.status})"

    def recalculate_total(self, save=True):
        """Sum the line-item snapshots into the order total."""
        total = sum(
            (item.line_total for item in self.items.all()), Decimal("0.00")
        )
        self.total_amount = total
        if save:
            self.save(update_fields=["total_amount", "updated_at"])
        return total


class OrderItem(models.Model):
    """A line item: one product within an order, with a price snapshot.

    ``product`` is nullable with ``SET_NULL`` so deleting a catalog product
    never erases purchase history; ``product_name`` and ``unit_price`` preserve
    what was actually bought and at what price.
    """

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )

    # Historical snapshots — frozen at the moment of purchase.
    product_name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity
