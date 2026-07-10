from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reminders import engine
from apps.vehicles.models import Vehicle
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


class RunRemindersView(APIView):
    """Run the reminder engine on demand, scoped to the current user's vehicles.

    There is no cron on localhost, so the app triggers this (a button, and once
    on entering the garage) to keep reminders fresh and send any due emails.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        stats = engine.run(Vehicle.objects.filter(owner=request.user))
        return Response(stats)
