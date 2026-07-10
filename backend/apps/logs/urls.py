from rest_framework.routers import DefaultRouter

from .views import FuelEntryViewSet, RunningLogViewSet

router = DefaultRouter()
router.register("running-logs", RunningLogViewSet, basename="running-log")
router.register("fuel-entries", FuelEntryViewSet, basename="fuel-entry")

urlpatterns = router.urls
