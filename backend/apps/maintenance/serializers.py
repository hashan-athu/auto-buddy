from rest_framework import serializers

from apps.vehicles.scoping import VehicleOwnedSerializerMixin

from .models import MaintenanceRecord


class MaintenanceRecordSerializer(VehicleOwnedSerializerMixin):
    total_cost = serializers.DecimalField(
        max_digits=11, decimal_places=2, read_only=True
    )

    class Meta:
        model = MaintenanceRecord
        fields = [
            "id",
            "vehicle",
            "date",
            "odometer",
            "category",
            "title",
            "parts_cost",
            "labor_cost",
            "total_cost",
            "vendor",
            "next_due_date",
            "next_due_odometer",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "total_cost", "created_at"]
