from apps.vehicles.scoping import VehicleOwnedSerializerMixin

from .models import Component


class ComponentSerializer(VehicleOwnedSerializerMixin):
    class Meta:
        model = Component
        fields = [
            "id",
            "vehicle",
            "hotspot_key",
            "label",
            "category",
            "health",
            "last_serviced_date",
            "last_serviced_odometer",
            "expected_life_km",
            "note",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]
