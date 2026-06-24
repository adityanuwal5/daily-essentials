"""Admin registration for the CustomUser model."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "phone_number", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "phone_number")

    # Append the custom profile fields to Django's default fieldsets.
    fieldsets = UserAdmin.fieldsets + (
        (
            "DailyEssentials profile",
            {"fields": ("phone_number", "delivery_address", "role")},
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "DailyEssentials profile",
            {"fields": ("email", "phone_number", "delivery_address", "role")},
        ),
    )
