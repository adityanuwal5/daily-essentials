"""User domain model for DailyEssentials."""

from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import CustomUserManager


class CustomUser(AbstractUser):
    """Application user, extending Django's battle-tested auth model.

    Inheriting from ``AbstractUser`` keeps password hashing, permissions and
    session handling intact, while adding the quick-commerce specific profile
    fields and a coarse role used for server-side RBAC.
    """

    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        ADMIN = "admin", "Admin"

    phone_number = models.CharField(max_length=20, blank=True)
    delivery_address = models.TextField(blank=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        help_text="Coarse access tier used by the IsAdminUserRole permission.",
    )

    objects = CustomUserManager()

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_admin_role(self):
        """True for platform administrators (role flag or Django superuser)."""
        return self.role == self.Role.ADMIN or self.is_superuser
