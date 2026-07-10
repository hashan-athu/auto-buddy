from django.contrib import admin

from .models import MaintenanceRecord


@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "date", "category", "title", "total_cost")
    list_filter = ("category", "date")
    search_fields = ("vehicle__make", "vehicle__model", "title", "vendor", "note")
    autocomplete_fields = ("vehicle",)
