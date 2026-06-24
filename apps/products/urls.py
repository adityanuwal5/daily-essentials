"""Routes for the public product feed (mounted under /api/products/)."""

from rest_framework.routers import DefaultRouter

from .views import ProductViewSet

app_name = "products"

router = DefaultRouter()
router.register(r"", ProductViewSet, basename="product")

urlpatterns = router.urls
