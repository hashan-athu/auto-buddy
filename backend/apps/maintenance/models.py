from django.db import models


class MaintenanceRecord(models.Model):
    """A service / repair event: what was done, what it cost, and when the next
    one is due (by date or by odometer)."""

    class Category(models.TextChoices):
        OIL_CHANGE = "oil_change", "Oil change"
        TYRES = "tyres", "Tyres"
        BRAKES = "brakes", "Brakes"
        BATTERY = "battery", "Battery"
        SERVICE = "service", "General service"
        REPAIR = "repair", "Repair"
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.CASCADE, related_name="maintenance_records"
    )
    date = models.DateField()
    odometer = models.PositiveIntegerField(null=True, blank=True, help_text="Kilometres")
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.SERVICE
    )
    title = models.CharField(max_length=160)
    parts_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vendor = models.CharField(max_length=120, blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    next_due_odometer = models.PositiveIntegerField(null=True, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-odometer"]

    def __str__(self):
        return f"{self.vehicle} — {self.title} ({self.date})"

    @property
    def total_cost(self):
        return self.parts_cost + self.labor_cost
