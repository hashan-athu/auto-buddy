import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.components.models import Component
from apps.logs.models import FuelEntry, RunningLog
from apps.maintenance.models import MaintenanceRecord
from apps.vehicles.models import Vehicle

User = get_user_model()
D = datetime.date(2026, 3, 1)


class AnalyticsTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678")
        self.v = Vehicle.objects.create(
            owner=self.alice, make="Nissan", model="GT-R", purchase_price=Decimal("20000")
        )
        RunningLog.objects.create(vehicle=self.v, date=D, odometer=1000)
        RunningLog.objects.create(vehicle=self.v, date=D, odometer=2000)
        FuelEntry.objects.create(vehicle=self.v, date=D, odometer=1000, litres=Decimal("50"), total_cost=Decimal("100"))
        FuelEntry.objects.create(vehicle=self.v, date=D, odometer=1500, litres=Decimal("40"), total_cost=Decimal("80"))
        MaintenanceRecord.objects.create(vehicle=self.v, date=D, title="Service", parts_cost=Decimal("100"), labor_cost=Decimal("50"))
        for i, h in enumerate(["good", "warning", "critical"]):
            Component.objects.create(vehicle=self.v, hotspot_key=f"h{i}", label=h, category="other", health=h)

    def test_cost_of_ownership(self):
        self.client.force_authenticate(self.alice)
        coo = self.client.get(f"/api/vehicles/{self.v.id}/analytics/").data["cost_of_ownership"]
        self.assertEqual(float(coo["fuel_cost"]), 180.0)
        self.assertEqual(float(coo["maintenance_cost"]), 150.0)
        self.assertEqual(float(coo["total_spend"]), 330.0)
        self.assertEqual(int(coo["total_distance"]), 1000)
        self.assertEqual(float(coo["total_with_purchase"]), 20330.0)
        self.assertAlmostEqual(float(coo["cost_per_km"]), 0.33, places=2)

    def test_monthly_spend_window_and_total(self):
        self.client.force_authenticate(self.alice)
        months = self.client.get(f"/api/vehicles/{self.v.id}/analytics/").data["monthly_spend"]
        self.assertEqual(len(months), 12)
        self.assertEqual(sum(float(m["total"]) for m in months), 330.0)

    def test_economy_series(self):
        self.client.force_authenticate(self.alice)
        econ = self.client.get(f"/api/vehicles/{self.v.id}/analytics/").data["economy_series"]
        self.assertEqual(len(econ), 1)  # one interval between two fills
        self.assertAlmostEqual(float(econ[0]["kmpl"]), 12.5, places=2)  # 500 km / 40 L

    def test_health_score_and_status(self):
        self.client.force_authenticate(self.alice)
        health = self.client.get(f"/api/vehicles/{self.v.id}/analytics/").data["health"]
        self.assertEqual(health["counts"], {"good": 1, "warning": 1, "critical": 1})
        self.assertEqual(health["status"], "critical")  # any critical -> critical
        self.assertEqual(health["score"], 57)  # round((100+55+15)/3)

    def test_requires_ownership(self):
        bob = User.objects.create_user("bob", password="pw12345678")
        self.client.force_authenticate(bob)
        self.assertEqual(self.client.get(f"/api/vehicles/{self.v.id}/analytics/").status_code, 404)
