from rest_framework import serializers

from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            "id",
            "make",
            "model",
            "year",
            "trim",
            "vin",
            "plate",
            "colour",
            "fuel_type",
            "purchase_date",
            "purchase_price",
            "current_odometer",
            "model_3d",
            "status",
            "created_at",
            "updated_at",
        ]
        # owner is never client-supplied; it is taken from the request user.
        read_only_fields = ["id", "created_at", "updated_at"]
