from django.db import models


class Component(models.Model):
    """A serviceable part of a vehicle (a tyre, the engine, the brakes…).

    ``hotspot_key`` ties the component to a position in the 3D scene: the
    frontend keeps the per-model 3D coordinates, and this record supplies the
    live state (``health``, service history) that colours the hotspot. That
    split is deliberate — coordinates are model-specific presentation, health
    is data.
    """

    class Category(models.TextChoices):
        TYRE = "tyre", "Tyre"
        ENGINE = "engine", "Engine"
        BRAKES = "brakes", "Brakes"
        BATTERY = "battery", "Battery"
        OIL = "oil", "Oil"
        OTHER = "other", "Other"

    class Health(models.TextChoices):
        GOOD = "good", "Good"
        WARNING = "warning", "Attention soon"
        CRITICAL = "critical", "Action needed"

    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.CASCADE, related_name="components"
    )
    hotspot_key = models.CharField(
        max_length=40, help_text="Matches a 3D hotspot position in the frontend layout."
    )
    label = models.CharField(max_length=80)
    category = models.CharField(max_length=12, choices=Category.choices, default=Category.OTHER)
    health = models.CharField(max_length=10, choices=Health.choices, default=Health.GOOD)
    last_serviced_date = models.DateField(null=True, blank=True)
    last_serviced_odometer = models.PositiveIntegerField(null=True, blank=True)
    expected_life_km = models.PositiveIntegerField(null=True, blank=True)
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["hotspot_key"]
        constraints = [
            models.UniqueConstraint(
                fields=["vehicle", "hotspot_key"], name="unique_vehicle_hotspot_key"
            )
        ]

    def __str__(self):
        return f"{self.vehicle} — {self.label} ({self.health})"
