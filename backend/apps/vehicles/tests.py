import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.logs.models import FuelEntry, RunningLog
from apps.maintenance.models import MaintenanceRecord
from apps.vehicles.models import Vehicle

User = get_user_model()


class VehicleScopingTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678")
        self.bob = User.objects.create_user("bob", password="pw12345678")
        self.av = Vehicle.objects.create(owner=self.alice, make="Nissan", model="GT-R")
        self.bv = Vehicle.objects.create(owner=self.bob, make="Mazda", model="MX-5")

    def test_list_returns_only_own_vehicles(self):
        self.client.force_authenticate(self.alice)
        r = self.client.get("/api/vehicles/")
        self.assertEqual(r.data["count"], 1)
        self.assertEqual(r.data["results"][0]["make"], "Nissan")

    def test_cannot_read_update_or_delete_others_vehicle(self):
        self.client.force_authenticate(self.alice)
        self.assertEqual(self.client.get(f"/api/vehicles/{self.bv.id}/").status_code, 404)
        self.assertEqual(
            self.client.patch(f"/api/vehicles/{self.bv.id}/", {"colour": "x"}, format="json").status_code,
            404,
        )
        self.assertEqual(self.client.delete(f"/api/vehicles/{self.bv.id}/").status_code, 404)
        self.bv.refresh_from_db()
        self.assertEqual(self.bv.colour, "")  # untouched

    def test_create_forces_owner_to_request_user(self):
        self.client.force_authenticate(self.alice)
        r = self.client.post("/api/vehicles/", {"make": "Honda", "model": "Civic"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Vehicle.objects.get(id=r.data["id"]).owner, self.alice)

    def test_requires_authentication(self):
        self.assertEqual(self.client.get("/api/vehicles/").status_code, 403)


class VehicleSummaryTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678")
        self.v = Vehicle.objects.create(owner=self.alice, make="Nissan", model="GT-R")
        d = datetime.date(2026, 1, 1)
        RunningLog.objects.create(vehicle=self.v, date=d, odometer=1000)
        RunningLog.objects.create(vehicle=self.v, date=d, odometer=2000)
        FuelEntry.objects.create(vehicle=self.v, date=d, odometer=1000, litres=Decimal("50"), total_cost=Decimal("100"))
        FuelEntry.objects.create(vehicle=self.v, date=d, odometer=1500, litres=Decimal("40"), total_cost=Decimal("80"))
        MaintenanceRecord.objects.create(vehicle=self.v, date=d, title="Service", parts_cost=Decimal("100"), labor_cost=Decimal("50"))

    def test_summary_totals(self):
        self.client.force_authenticate(self.alice)
        r = self.client.get(f"/api/vehicles/{self.v.id}/summary/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(int(r.data["total_distance"]), 1000)  # 2000 - 1000
        self.assertEqual(float(r.data["fuel_cost"]), 180.0)
        self.assertEqual(float(r.data["maintenance_cost"]), 150.0)
        self.assertEqual(float(r.data["total_spend"]), 330.0)
        # economy = distance after first fill / litres after first fill = 500 / 40
        self.assertAlmostEqual(float(r.data["economy_kmpl"]), 12.5, places=2)
