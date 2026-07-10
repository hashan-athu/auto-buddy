from decimal import Decimal

from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        """Headline totals for a vehicle: distance, fuel, maintenance, economy.

        Deliberately simple ("basic totals" for Phase 1) — richer analytics
        come in Phase 4.
        """
        vehicle = self.get_object()
        logs = list(vehicle.running_logs.all())
        fuel = list(vehicle.fuel_entries.order_by("odometer"))
        maint = vehicle.maintenance_records.all()

        # Distance from the span of odometer readings we have on record.
        odos = [l.odometer for l in logs] + [f.odometer for f in fuel]
        total_distance = (max(odos) - min(odos)) if len(odos) >= 2 else 0

        fuel_litres = sum((f.litres for f in fuel), Decimal("0"))
        fuel_cost = sum((f.total_cost for f in fuel), Decimal("0"))
        maintenance_cost = maint.aggregate(
            t=Sum("parts_cost") + Sum("labor_cost")
        )["t"] or Decimal("0")

        # Average economy: distance covered after the first fill divided by the
        # litres burned to cover it (standard fill-to-fill method).
        economy_kmpl = None
        if len(fuel) >= 2:
            distance_between = fuel[-1].odometer - fuel[0].odometer
            litres_after_first = sum((f.litres for f in fuel[1:]), Decimal("0"))
            if distance_between > 0 and litres_after_first > 0:
                economy_kmpl = round(distance_between / litres_after_first, 2)

        return Response(
            {
                "vehicle": vehicle.id,
                "current_odometer": vehicle.current_odometer,
                "total_distance": total_distance,
                "running_log_count": len(logs),
                "fuel_entry_count": len(fuel),
                "fuel_litres": fuel_litres,
                "fuel_cost": fuel_cost,
                "maintenance_record_count": maint.count(),
                "maintenance_cost": maintenance_cost,
                "total_spend": fuel_cost + maintenance_cost,
                "economy_kmpl": economy_kmpl,
            }
        )
