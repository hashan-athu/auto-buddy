from apps.vehicles.scoping import VehicleScopedViewSet

from .serializers import MaintenanceRecordSerializer


class MaintenanceRecordViewSet(VehicleScopedViewSet):
    serializer_class = MaintenanceRecordSerializer
