from apps.vehicles.scoping import VehicleScopedViewSet

from .serializers import FuelEntrySerializer, RunningLogSerializer


class RunningLogViewSet(VehicleScopedViewSet):
    serializer_class = RunningLogSerializer

    def perform_create(self, serializer):
        log = serializer.save()
        # Keep the vehicle's headline odometer current when a newer reading lands.
        vehicle = log.vehicle
        if log.odometer > vehicle.current_odometer:
            vehicle.current_odometer = log.odometer
            vehicle.save(update_fields=["current_odometer", "updated_at"])


class FuelEntryViewSet(VehicleScopedViewSet):
    serializer_class = FuelEntrySerializer
