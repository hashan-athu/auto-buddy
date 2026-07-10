from django.contrib import admin

from .models import Reminder


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "title", "source", "due_date", "due_odometer", "status")
    list_filter = ("status", "source", "trigger_type")
    search_fields = ("vehicle__make", "vehicle__model", "title")
    autocomplete_fields = ("vehicle",)
