"""Reusable owner-scoping for records that belong to a Vehicle.

Every per-vehicle record (running logs, fuel, maintenance, later documents and
reminders) must only ever be visible to the owner of its vehicle. These helpers
centralise that rule so each app doesn't reinvent it.
"""
from rest_framework import serializers, viewsets


class VehicleScopedViewSet(viewsets.ModelViewSet):
    """ModelViewSet whose queryset is limited to records on vehicles the
    requesting user owns. Supports ``?vehicle=<id>`` filtering.

    Subclasses must set ``serializer_class`` (its ``Meta.model`` is the record
    model).
    """

    def get_queryset(self):
        model = self.serializer_class.Meta.model
        qs = model.objects.filter(vehicle__owner=self.request.user)
        vehicle_id = self.request.query_params.get("vehicle")
        if vehicle_id:
            qs = qs.filter(vehicle_id=vehicle_id)
        return qs


class VehicleOwnedSerializerMixin(serializers.ModelSerializer):
    """Validates that the ``vehicle`` a record is attached to belongs to the
    requesting user — so you can't create a record against someone else's car."""

    def validate_vehicle(self, vehicle):
        request = self.context.get("request")
        if request is not None and vehicle.owner_id != request.user.id:
            raise serializers.ValidationError("You do not own that vehicle.")
        return vehicle
