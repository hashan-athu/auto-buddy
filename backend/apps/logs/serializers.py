from rest_framework import serializers

from apps.vehicles.scoping import VehicleOwnedSerializerMixin

from .models import FuelEntry, RunningLog


class RunningLogSerializer(VehicleOwnedSerializerMixin):
    class Meta:
        model = RunningLog
        fields = ["id", "vehicle", "date", "odometer", "note", "created_at"]
        read_only_fields = ["id", "created_at"]


class FuelEntrySerializer(VehicleOwnedSerializerMixin):
    price_per_litre = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = FuelEntry
        fields = [
            "id",
            "vehicle",
            "date",
            "odometer",
            "litres",
            "total_cost",
            "price_per_litre",
            "full_tank",
            "station",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "price_per_litre", "created_at"]
