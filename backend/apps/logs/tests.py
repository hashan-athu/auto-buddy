import datetime

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.logs.models import RunningLog
from apps.vehicles.models import Vehicle

User = get_user_model()
TODAY = datetime.date(2026, 1, 1)


class RunningLogTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678")
        self.bob = User.objects.create_user("bob", password="pw12345678")
        self.av = Vehicle.objects.create(owner=self.alice, make="Nissan", model="GT-R", current_odometer=1000)
        self.bv = Vehicle.objects.create(owner=self.bob, make="Mazda", model="MX-5")

    def test_new_reading_bumps_vehicle_odometer(self):
        self.client.force_authenticate(self.alice)
        r = self.client.post(
            "/api/running-logs/",
            {"vehicle": self.av.id, "date": "2026-01-02", "odometer": 1500},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.av.refresh_from_db()
        self.assertEqual(self.av.current_odometer, 1500)

    def test_lower_reading_does_not_lower_odometer(self):
        self.client.force_authenticate(self.alice)
        self.client.post(
            "/api/running-logs/",
            {"vehicle": self.av.id, "date": "2026-01-02", "odometer": 500},
            format="json",
        )
        self.av.refresh_from_db()
        self.assertEqual(self.av.current_odometer, 1000)  # unchanged

    def test_cannot_log_against_another_users_vehicle(self):
        self.client.force_authenticate(self.alice)
        r = self.client.post(
            "/api/running-logs/",
            {"vehicle": self.bv.id, "date": "2026-01-02", "odometer": 100},
            format="json",
        )
        self.assertEqual(r.status_code, 400)
        self.assertEqual(RunningLog.objects.filter(vehicle=self.bv).count(), 0)

    def test_list_is_owner_and_vehicle_scoped(self):
        RunningLog.objects.create(vehicle=self.av, date=TODAY, odometer=1100)
        RunningLog.objects.create(vehicle=self.bv, date=TODAY, odometer=2200)
        self.client.force_authenticate(self.alice)
        r = self.client.get(f"/api/running-logs/?vehicle={self.av.id}")
        self.assertEqual(r.data["count"], 1)
        self.assertEqual(r.data["results"][0]["odometer"], 1100)

    def test_edit_and_delete(self):
        self.client.force_authenticate(self.alice)
        log = RunningLog.objects.create(vehicle=self.av, date=TODAY, odometer=1100)
        self.assertEqual(
            self.client.patch(f"/api/running-logs/{log.id}/", {"note": "hi"}, format="json").status_code, 200
        )
        log.refresh_from_db()
        self.assertEqual(log.note, "hi")
        self.assertEqual(self.client.delete(f"/api/running-logs/{log.id}/").status_code, 204)
        self.assertFalse(RunningLog.objects.filter(id=log.id).exists())
