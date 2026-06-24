"""Global URL blueprint for the DailyEssentials API.

Endpoint map
------------
    POST   /api/auth/login/                  Credentials -> JWT session
    POST   /api/auth/refresh/                Refresh access token from cookie
    POST   /api/auth/logout/                 Clear auth cookies
    POST   /api/auth/change-password/        Authenticated password update
    GET    /api/auth/me/                      Current user profile

    GET    /api/products/                     Public catalog feed (+filters)
    GET    /api/products/{id}/                Product detail

    POST   /api/admin/products/               Admin: create product   (RBAC)
    PUT    /api/admin/products/{id}/          Admin: replace product  (RBAC)
    PATCH  /api/admin/products/{id}/          Admin: update product   (RBAC)
    DELETE /api/admin/products/{id}/          Admin: delete product   (RBAC)
    GET    /api/admin/dashboard-metrics/      Admin: system metrics    (RBAC)

    GET    /api/orders/                       Authenticated: own order history
    POST   /api/orders/                       Authenticated: checkout
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.orders.views import DashboardMetricsView, OrderListCreateView
from apps.products.views import AdminProductViewSet


def health_check(request):
    """Lightweight root endpoint (HTTP 200 JSON).

    Returning a fast 200 at `/` is friendlier to uptime monitors and Vercel
    than a redirect, and confirms the service is alive without touching the DB.
    """
    return JsonResponse(
        {
            "status": "ok",
            "service": "DailyEssentials API",
            "docs": "/api/products/",
        }
    )


# Admin-only product management router (RBAC enforced on the viewset).
admin_router = DefaultRouter()
admin_router.register(r"products", AdminProductViewSet, basename="admin-product")

api_admin_patterns = [
    path(
        "dashboard-metrics/",
        DashboardMetricsView.as_view(),
        name="dashboard-metrics",
    ),
    path("", include(admin_router.urls)),
]

urlpatterns = [
    path("", health_check, name="health-check"),
    path("django-admin/", admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/orders/", OrderListCreateView.as_view(), name="orders"),
    path("api/admin/", include((api_admin_patterns, "admin-api"))),
]
