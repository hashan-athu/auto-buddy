import datetime

from django.contrib.auth import get_user_model
from django.core import mail
from rest_framework.test import APITestCase

from apps.documents.models import Document
from apps.maintenance.models import MaintenanceRecord
from apps.reminders import engine
from apps.reminders.models import Reminder
from apps.vehicles.models import Vehicle

User = get_user_model()


def in_days(n):
    return datetime.date.today() + datetime.timedelta(days=n)


class ReminderEngineTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678", email="alice@example.com")
        self.v = Vehicle.objects.create(owner=self.alice, make="Nissan", model="GT-R")

    def _run(self):
        return engine.run(Vehicle.objects.filter(owner=self.alice))

    def test_seeds_reminder_from_document_expiry(self):
        doc = Document.objects.create(vehicle=self.v, type="insurance", title="Policy", expiry_date=in_days(10))
        self._run()
        r = Reminder.objects.get(vehicle=self.v, dedupe_key=f"document:{doc.id}:expiry")
        self.assertEqual(r.source, Reminder.Source.DOCUMENT_EXPIRY)
        self.assertEqual(r.due_date, in_days(10))

    def test_seeds_reminder_from_maintenance_next_due(self):
        rec = MaintenanceRecord.objects.create(vehicle=self.v, date=in_days(-1), title="Oil", next_due_date=in_days(15))
        self._run()
        r = Reminder.objects.get(vehicle=self.v, dedupe_key=f"maintenance:{rec.id}:next_due")
        self.assertEqual(r.source, Reminder.Source.SERVICE_DUE)

    def test_dedupe_updates_in_place(self):
        Document.objects.create(vehicle=self.v, type="insurance", title="Policy", expiry_date=in_days(10))
        self._run()
        self._run()
        self.assertEqual(Reminder.objects.filter(vehicle=self.v).count(), 1)

    def test_does_not_resurrect_dismissed(self):
        Document.objects.create(vehicle=self.v, type="insurance", title="Policy", expiry_date=in_days(10))
        self._run()
        r = Reminder.objects.get(vehicle=self.v)
        r.status = Reminder.Status.DISMISSED
        r.save()
        self._run()
        r.refresh_from_db()
        self.assertEqual(r.status, Reminder.Status.DISMISSED)
        self.assertEqual(Reminder.objects.filter(vehicle=self.v).count(), 1)

    def test_notifies_once_and_stamps_notified_at(self):
        Document.objects.create(vehicle=self.v, type="insurance", title="Policy", expiry_date=in_days(10))
        stats = self._run()
        self.assertEqual(stats["notified"], 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIsNotNone(Reminder.objects.get(vehicle=self.v).notified_at)

        # A second run must not re-email an already-notified reminder.
        self._run()
        self.assertEqual(len(mail.outbox), 1)

    def test_far_future_reminder_is_not_notified(self):
        # Beyond the 30-day lookahead → seeded but not emailed.
        Document.objects.create(vehicle=self.v, type="insurance", title="Policy", expiry_date=in_days(200))
        stats = self._run()
        self.assertEqual(stats["notified"], 0)
        self.assertEqual(len(mail.outbox), 0)


class RunEndpointScopingTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", password="pw12345678", email="a@x.com")
        self.bob = User.objects.create_user("bob", password="pw12345678", email="b@x.com")
        self.av = Vehicle.objects.create(owner=self.alice, make="Nissan", model="GT-R")
        self.bv = Vehicle.objects.create(owner=self.bob, make="Mazda", model="MX-5")
        Document.objects.create(vehicle=self.av, type="insurance", title="A", expiry_date=in_days(10))
        Document.objects.create(vehicle=self.bv, type="insurance", title="B", expiry_date=in_days(10))

    def test_run_endpoint_only_touches_own_vehicles(self):
        self.client.force_authenticate(self.alice)
        r = self.client.post("/api/reminders/run/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["created"], 1)
        self.assertEqual(Reminder.objects.filter(vehicle__owner=self.alice).count(), 1)
        self.assertEqual(Reminder.objects.filter(vehicle__owner=self.bob).count(), 0)
