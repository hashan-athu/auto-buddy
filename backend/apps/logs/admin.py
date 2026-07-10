from django.contrib import admin

from .models import FuelEntry, RunningLog


@admin.register(RunningLog)
class RunningLogAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "date", "odometer")
    list_filter = ("date",)
    search_fields = ("vehicle__make", "vehicle__model", "note")
    autocomplete_fields = ("vehicle",)


@admin.register(FuelEntry)
class FuelEntryAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "date", "odometer", "litres", "total_cost", "full_tank")
    list_filter = ("date", "full_tank")
    search_fields = ("vehicle__make", "vehicle__model", "station", "note")
    autocomplete_fields = ("vehicle",)
