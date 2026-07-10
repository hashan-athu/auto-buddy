from rest_framework import serializers

from apps.vehicles.scoping import VehicleOwnedSerializerMixin

from .models import Document


class DocumentSerializer(VehicleOwnedSerializerMixin):
    # The raw file is write-only (upload); reads get an owner-checked download URL.
    file = serializers.FileField(write_only=True)
    file_url = serializers.SerializerMethodField()
    filename = serializers.CharField(read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "vehicle",
            "type",
            "title",
            "file",
            "file_url",
            "filename",
            "issuer",
            "issued_date",
            "expiry_date",
            "policy_number",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "file_url", "filename", "created_at"]

    def get_file_url(self, obj):
        # Relative on purpose: works same-origin in production and through the
        # Vite dev proxy (an absolute backend host would drop the session cookie).
        return f"/api/documents/{obj.id}/download/"
