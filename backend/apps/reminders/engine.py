"""The reminder engine: refresh auto-generated reminders and email due ones.

Shared by the `run_reminders` management command (all vehicles, for cron) and the
`POST /api/reminders/run/` endpoint (scoped to the requesting user's vehicles, so
the app can trigger a check without the terminal — there is no cron on localhost).
"""
from datetime import date

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from apps.reminders.models import Reminder

LOOKAHEAD_DAYS = getattr(settings, "REMINDER_LOOKAHEAD_DAYS", 30)
LOOKAHEAD_KM = getattr(settings, "REMINDER_LOOKAHEAD_KM", 1000)


def _upsert(vehicle, key, **fields):
    """Create or update the reminder identified by ``key`` for this vehicle,
    without resurrecting one the user has dismissed. Returns (created, updated)."""
    existing = Reminder.objects.filter(vehicle=vehicle, dedupe_key=key).first()
    if existing:
        if existing.status == Reminder.Status.DISMISSED:
            return 0, 0  # respect the user's dismissal
        for attr, value in fields.items():
            setattr(existing, attr, value)
        existing.save()
        return 0, 1
    Reminder.objects.create(vehicle=vehicle, dedupe_key=key, **fields)
    return 1, 0


def _sync_vehicle(vehicle):
    created = updated = 0

    for doc in vehicle.documents.exclude(expiry_date__isnull=True):
        c, u = _upsert(
            vehicle,
            key=f"document:{doc.id}:expiry",
            title=f"{doc.get_type_display()} expires: {doc.title}",
            source=Reminder.Source.DOCUMENT_EXPIRY,
            trigger_type=Reminder.Trigger.DATE,
            due_date=doc.expiry_date,
            due_odometer=None,
        )
        created += c
        updated += u

    for rec in vehicle.maintenance_records.all():
        if not rec.next_due_date and rec.next_due_odometer is None:
            continue
        by_date = rec.next_due_date is not None
        c, u = _upsert(
            vehicle,
            key=f"maintenance:{rec.id}:next_due",
            title=f"Service due: {rec.title}",
            source=Reminder.Source.SERVICE_DUE,
            trigger_type=Reminder.Trigger.DATE if by_date else Reminder.Trigger.ODOMETER,
            due_date=rec.next_due_date,
            due_odometer=rec.next_due_odometer,
        )
        created += c
        updated += u

    return created, updated


def _is_due_soon(reminder, vehicle):
    if reminder.due_date is not None:
        if (reminder.due_date - date.today()).days <= LOOKAHEAD_DAYS:
            return True
    if reminder.due_odometer is not None:
        if (reminder.due_odometer - vehicle.current_odometer) <= LOOKAHEAD_KM:
            return True
    return False


def _due_text(reminder, vehicle):
    if reminder.due_date is not None:
        days = (reminder.due_date - date.today()).days
        return f"due {reminder.due_date}, {days} days"
    km = reminder.due_odometer - vehicle.current_odometer
    return f"due at {reminder.due_odometer} km, in {km} km"


def _notify_vehicle(vehicle):
    owner = vehicle.owner
    if not owner.email:
        return 0

    due = [
        r
        for r in vehicle.reminders.filter(
            status=Reminder.Status.OPEN, notified_at__isnull=True
        )
        if _is_due_soon(r, vehicle)
    ]
    if not due:
        return 0

    lines = [f"- {r.title} ({_due_text(r, vehicle)})" for r in due]
    send_mail(
        subject=f"Auto Buddy: {len(due)} reminder(s) for your {vehicle}",
        message="Coming up:\n\n" + "\n".join(lines),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "reminders@auto-buddy.local"),
        recipient_list=[owner.email],
        fail_silently=False,
    )
    now = timezone.now()
    for r in due:
        r.notified_at = now
        r.save(update_fields=["notified_at"])
    return len(due)


def run(vehicles):
    """Sync + notify across the given vehicles queryset. Returns a stats dict."""
    created = updated = notified = 0
    for vehicle in vehicles.select_related("owner"):
        c, u = _sync_vehicle(vehicle)
        created += c
        updated += u
        notified += _notify_vehicle(vehicle)
    return {"created": created, "updated": updated, "notified": notified}
