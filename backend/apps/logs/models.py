from django.db import models


class RunningLog(models.Model):
    """A daily running record — an odometer reading on a date.

    Distance travelled is derived from the delta between consecutive readings,
    so the source of truth stays a single, un-ambiguous number.
    """

    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.CASCADE, related_name="running_logs"
    )
    date = models.DateField()
    odometer = models.PositiveIntegerField(help_text="Kilometres")
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-odometer"]

    def __str__(self):
        return f"{self.vehicle} — {self.odometer} km on {self.date}"


class FuelEntry(models.Model):
    """A fuel fill-up. Economy is computed at read time from the odometer
    delta and litres since the previous entry, so nothing derived is stored."""

    vehicle = models.ForeignKey(
        "vehicles.Vehicle", on_delete=models.CASCADE, related_name="fuel_entries"
    )
    date = models.DateField()
    odometer = models.PositiveIntegerField(help_text="Kilometres")
    litres = models.DecimalField(max_digits=7, decimal_places=2)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    full_tank = models.BooleanField(default=True)
    station = models.CharField(max_length=120, blank=True)
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-odometer"]
        verbose_name_plural = "fuel entries"

    def __str__(self):
        return f"{self.vehicle} — {self.litres} L on {self.date}"

    @property
    def price_per_litre(self):
        if self.litres:
            return round(self.total_cost / self.litres, 2)
        return None
