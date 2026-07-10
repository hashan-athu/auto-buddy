"""Scan every garage, refresh auto-generated reminders, and email due ones.

    python manage.py run_reminders

Cron this nightly. The logic lives in apps.reminders.engine (shared with the
POST /api/reminders/run/ endpoint); it graduates to a Celery beat task later
without changing the logic.
"""
from django.core.management.base import BaseCommand

from apps.reminders import engine
from apps.vehicles.models import Vehicle


class Command(BaseCommand):
    help = "Refresh auto-generated reminders and email due ones (all vehicles)."

    def handle(self, *args, **options):
        stats = engine.run(Vehicle.objects.all())
        self.stdout.write(
            self.style.SUCCESS(
                f"Reminders synced: {stats['created']} created, "
                f"{stats['updated']} updated, {stats['notified']} notified."
            )
        )
