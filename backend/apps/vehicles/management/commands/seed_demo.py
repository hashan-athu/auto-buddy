"""Seed a demo user and vehicle so the app has real data to render.

This replaces the frontend's hardcoded MOCK_DATA: the GT-R that used to live in
const.js now comes from the database, owned by a real user.

    python manage.py seed_demo

Idempotent — safe to run repeatedly.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.vehicles.models import Vehicle

User = get_user_model()

DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo12345"


class Command(BaseCommand):
    help = "Create a demo user and the sample GT-R vehicle."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            username=DEMO_USERNAME,
            defaults={"email": "demo@auto-buddy.local", "first_name": "Demo"},
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created user '{DEMO_USERNAME}'."))
        else:
            self.stdout.write(f"User '{DEMO_USERNAME}' already exists.")

        vehicle, created = Vehicle.objects.get_or_create(
            owner=user,
            make="Nissan",
            model="GT-R R35",
            defaults={
                "year": 2015,
                "trim": "Premium",
                "colour": "Gunmetal",
                "fuel_type": Vehicle.FuelType.PETROL,
                "current_odometer": 12450,
                "model_3d": "nissan_gtr_r35",
                "status": Vehicle.Status.ACTIVE,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created vehicle '{vehicle}'."))
        else:
            self.stdout.write(f"Vehicle '{vehicle}' already exists.")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDemo ready. Log in with  {DEMO_USERNAME} / {DEMO_PASSWORD}"
            )
        )
