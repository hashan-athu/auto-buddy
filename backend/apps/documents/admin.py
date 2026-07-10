from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "type", "title", "expiry_date")
    list_filter = ("type", "expiry_date")
    search_fields = ("vehicle__make", "vehicle__model", "title", "issuer", "policy_number")
    autocomplete_fields = ("vehicle",)
