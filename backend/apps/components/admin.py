from django.contrib import admin

from .models import Component


@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "label", "category", "health", "hotspot_key")
    list_filter = ("health", "category")
    search_fields = ("vehicle__make", "vehicle__model", "label", "hotspot_key")
    autocomplete_fields = ("vehicle",)
