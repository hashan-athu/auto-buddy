from apps.vehicles.scoping import VehicleScopedViewSet

from .serializers import ComponentSerializer


class ComponentViewSet(VehicleScopedViewSet):
    serializer_class = ComponentSerializer
