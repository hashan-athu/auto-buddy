from apps.vehicles.scoping import VehicleScopedViewSet

from .serializers import ReminderSerializer


class ReminderViewSet(VehicleScopedViewSet):
    """Reminders for the user's vehicles.

    Beyond the inherited ``?vehicle=`` filter, supports ``?status=open`` so the
    reminder centre can pull every open item across the whole garage.
    Manual reminders are created here; status is changed via PATCH
    (mark done / dismiss).
    """

    serializer_class = ReminderSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        return qs
