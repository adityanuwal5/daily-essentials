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
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.orders.views import DashboardMetricsView, OrderListCreateView
from apps.products.views import AdminProductViewSet

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
    path("django-admin/", admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/orders/", OrderListCreateView.as_view(), name="orders"),
    path("api/admin/", include((api_admin_patterns, "admin-api"))),
]
