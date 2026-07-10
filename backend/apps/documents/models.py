import os

from django.db import models


def document_upload_path(instance, filename):
    # Namespaced by vehicle so files are easy to find and never collide.
    return f"documents/vehicle_{instance.vehicle_id}/{filename}"


class Document(models.Model):
    """A stored file with compliance metadata (insurance, registration, etc.).

    Files are served only through an owner-checked download endpoint, never via
    a public media URL — see documents.views.DocumentDownloadView.
    """

    class Type(models.TextChoices):
        INSURANCE = "insurance", "Insurance"
        REGISTRATION = "registration", "Registration"
        LICENSE = "license", "License"
        WARRANTY = "warranty", "Warranty"
        INSPECTION = "inspection", "Inspection"
        INVOICE = "invoice", "Invoice"
        MANUAL = "manual", "Manual"
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.CASCADE, related_name="documents"
    )
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.OTHER)
    title = models.CharField(max_length=160)
    file = models.FileField(upload_to=document_upload_path)
    issuer = models.CharField(max_length=120, blank=True)
    issued_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    policy_number = models.CharField(max_length=80, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.vehicle} — {self.get_type_display()}: {self.title}"

    @property
    def filename(self):
        return os.path.basename(self.file.name) if self.file else ""
