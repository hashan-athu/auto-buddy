from django.db import models


class Reminder(models.Model):
    """Something to act on, triggered by a date or an odometer reading.

    Auto-generated reminders (document expiry, service due) carry a
    ``dedupe_key`` so the engine can update-in-place instead of duplicating;
    manual reminders leave it null.
    """

    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        DOCUMENT_EXPIRY = "document_expiry", "Document expiry"
        SERVICE_DUE = "service_due", "Service due"

    class Trigger(models.TextChoices):
        DATE = "date", "Date"
        ODOMETER = "odometer", "Odometer"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        DONE = "done", "Done"
        DISMISSED = "dismissed", "Dismissed"

    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.CASCADE, related_name="reminders"
    )
    title = models.CharField(max_length=200)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.MANUAL)
    trigger_type = models.CharField(
        max_length=10, choices=Trigger.choices, default=Trigger.DATE
    )
    due_date = models.DateField(null=True, blank=True)
    due_odometer = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    note = models.TextField(blank=True)
    # Stable identity for auto-seeded reminders; null for manual ones.
    dedupe_key = models.CharField(max_length=120, null=True, blank=True)
    notified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date", "due_odometer", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["vehicle", "dedupe_key"], name="unique_vehicle_dedupe_key"
            )
        ]

    def __str__(self):
        return f"{self.vehicle} — {self.title}"
