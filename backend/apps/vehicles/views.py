from rest_framework import viewsets

from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    """CRUD for the current user's vehicles.

    The queryset is owner-scoped so a user can never see or touch another
    user's garage — the single rule that makes this multi-user-safe.
    """

    serializer_class = VehicleSerializer

    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
