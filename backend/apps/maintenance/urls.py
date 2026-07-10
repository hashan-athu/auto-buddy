from rest_framework.routers import DefaultRouter

from .views import MaintenanceRecordViewSet

router = DefaultRouter()
router.register("maintenance-records", MaintenanceRecordViewSet, basename="maintenance-record")

urlpatterns = router.urls
