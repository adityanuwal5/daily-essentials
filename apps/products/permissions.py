"""Custom role-based access control permissions."""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminUserRole(BasePermission):
    """Server-side RBAC gate for administrator-only operations.

    Grants access only to authenticated users whose ``role`` is ``admin``
    (or Django superusers). Any other caller receives a hard 403 Forbidden.
    """

    message = "Administrator privileges are required to perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and getattr(user, "is_admin_role", False)
        )


class IsAdminOrReadOnly(BasePermission):
    """Public, read-only access for everyone; writes restricted to admins.

    Used by the product catalog: anyone may browse (GET/HEAD/OPTIONS), but
    POST/PUT/PATCH/DELETE require the admin role and otherwise return 403.
    """

    message = "Only administrators may modify the product catalog."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user and user.is_authenticated and getattr(user, "is_admin_role", False)
        )
