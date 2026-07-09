from django.contrib import admin

from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("__str__", "owner", "plate", "status", "current_odometer")
    list_filter = ("status", "fuel_type")
    search_fields = ("make", "model", "vin", "plate", "owner__username")
    autocomplete_fields = ("owner",)
