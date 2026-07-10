"""Seed a demo user and vehicle so the app has real data to render.

This replaces the frontend's hardcoded MOCK_DATA: the GT-R that used to live in
const.js now comes from the database, owned by a real user.

    python manage.py seed_demo

Idempotent — safe to run repeatedly.
"""
import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from apps.components.models import Component
from apps.documents.models import Document
from apps.logs.models import FuelEntry, RunningLog
from apps.maintenance.models import MaintenanceRecord
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

        self._seed_records(vehicle)

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDemo ready. Log in with  {DEMO_USERNAME} / {DEMO_PASSWORD}"
            )
        )

    def _seed_records(self, vehicle):
        """Add a few running logs, fuel fills, and services — once."""
        today = datetime.date.today()

        if not vehicle.running_logs.exists():
            for weeks_ago, odo in [(8, 11800), (6, 12010), (4, 12190), (2, 12330), (0, 12450)]:
                RunningLog.objects.create(
                    vehicle=vehicle,
                    date=today - datetime.timedelta(weeks=weeks_ago),
                    odometer=odo,
                )
            self.stdout.write(self.style.SUCCESS("  + 5 running logs"))

        if not vehicle.fuel_entries.exists():
            for weeks_ago, odo, litres, cost in [
                (8, 11800, "52.00", "104.00"),
                (5, 12050, "48.50", "99.20"),
                (2, 12330, "55.00", "112.75"),
            ]:
                FuelEntry.objects.create(
                    vehicle=vehicle,
                    date=today - datetime.timedelta(weeks=weeks_ago),
                    odometer=odo,
                    litres=Decimal(litres),
                    total_cost=Decimal(cost),
                    station="Demo Fuel Co.",
                )
            self.stdout.write(self.style.SUCCESS("  + 3 fuel entries"))

        if not vehicle.maintenance_records.exists():
            MaintenanceRecord.objects.create(
                vehicle=vehicle,
                date=today - datetime.timedelta(weeks=6),
                odometer=12010,
                category=MaintenanceRecord.Category.OIL_CHANGE,
                title="Oil & filter change",
                parts_cost=Decimal("85.00"),
                labor_cost=Decimal("60.00"),
                vendor="Demo Garage",
                next_due_odometer=17010,
            )
            MaintenanceRecord.objects.create(
                vehicle=vehicle,
                date=today - datetime.timedelta(weeks=1),
                odometer=12390,
                category=MaintenanceRecord.Category.BRAKES,
                title="Rear brake pads",
                parts_cost=Decimal("220.00"),
                labor_cost=Decimal("140.00"),
                vendor="Demo Garage",
            )
            self.stdout.write(self.style.SUCCESS("  + 2 maintenance records"))

        if not vehicle.documents.exists():
            doc = Document(
                vehicle=vehicle,
                type=Document.Type.INSURANCE,
                title="Comprehensive policy",
                issuer="Demo Insurance Co.",
                issued_date=today - datetime.timedelta(days=345),
                expiry_date=today + datetime.timedelta(days=20),  # soon -> reminder
                policy_number="DEMO-INS-0001",
            )
            doc.file.save(
                "insurance_policy.txt",
                ContentFile(b"Demo insurance policy document."),
                save=True,
            )
            self.stdout.write(self.style.SUCCESS("  + 1 document (insurance)"))

        if not vehicle.components.exists():
            # hotspot_key values match frontend/src/scene/hotspots.js.
            Component.objects.create(
                vehicle=vehicle, hotspot_key="tyre_front_left",
                label="Front-left tyre", category=Component.Category.TYRE,
                health=Component.Health.GOOD,
                last_serviced_date=today - datetime.timedelta(days=180),
                expected_life_km=40000, note="34 psi, good tread",
            )
            Component.objects.create(
                vehicle=vehicle, hotspot_key="engine",
                label="Engine bay", category=Component.Category.ENGINE,
                health=Component.Health.WARNING,
                note="Service due in ~500 km",
            )
            Component.objects.create(
                vehicle=vehicle, hotspot_key="brakes",
                label="Rear brakes", category=Component.Category.BRAKES,
                health=Component.Health.CRITICAL,
                last_serviced_date=today - datetime.timedelta(days=430),
                note="90% wear — replace immediately",
            )
            self.stdout.write(self.style.SUCCESS("  + 3 components"))
