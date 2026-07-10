from django.conf import settings
from django.db import models


class Vehicle(models.Model):
    """A single vehicle in an owner's garage.

    Every downstream record (running logs, fuel, maintenance, documents,
    reminders) will hang off this model, and this model hangs off ``owner`` —
    so data isolation is enforced at the root of the tree.
    """

    class FuelType(models.TextChoices):
        PETROL = "petrol", "Petrol"
        DIESEL = "diesel", "Diesel"
        HYBRID = "hybrid", "Hybrid"
        ELECTRIC = "electric", "Electric"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        STORED = "stored", "Stored"
        SOLD = "sold", "Sold"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vehicles",
    )

    make = models.CharField(max_length=80)
    model = models.CharField(max_length=80)
    year = models.PositiveIntegerField(null=True, blank=True)
    trim = models.CharField(max_length=80, blank=True)
    vin = models.CharField("VIN", max_length=32, blank=True)
    plate = models.CharField(max_length=16, blank=True)
    colour = models.CharField(max_length=40, blank=True)
    fuel_type = models.CharField(
        max_length=12, choices=FuelType.choices, default=FuelType.PETROL
    )

    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    current_odometer = models.PositiveIntegerField(default=0, help_text="Kilometres")

    # Key of the .glb model in the frontend's model library (e.g. "nissan_gtr_r35").
    model_3d = models.CharField(max_length=64, blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return " ".join(str(p) for p in [self.year, self.make, self.model] if p)
