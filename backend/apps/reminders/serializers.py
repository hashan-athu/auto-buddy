from datetime import date

from rest_framework import serializers

from apps.vehicles.scoping import VehicleOwnedSerializerMixin

from .models import Reminder


class ReminderSerializer(VehicleOwnedSerializerMixin):
    days_until_due = serializers.SerializerMethodField()
    km_until_due = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Reminder
        fields = [
            "id",
            "vehicle",
            "title",
            "source",
            "trigger_type",
            "due_date",
            "due_odometer",
            "status",
            "note",
            "days_until_due",
            "km_until_due",
            "is_overdue",
            "created_at",
        ]
        # source/dedupe are engine-managed; clients only create manual reminders.
        read_only_fields = ["id", "source", "created_at"]

    def get_days_until_due(self, obj):
        if obj.due_date:
            return (obj.due_date - date.today()).days
        return None

    def get_km_until_due(self, obj):
        if obj.due_odometer is not None:
            return obj.due_odometer - obj.vehicle.current_odometer
        return None

    def get_is_overdue(self, obj):
        days = self.get_days_until_due(obj)
        km = self.get_km_until_due(obj)
        return (days is not None and days < 0) or (km is not None and km < 0)
