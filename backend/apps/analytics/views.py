"""Read-only analytics aggregated across a vehicle's records.

No models of its own — it reads logs, maintenance, components, and reminders and
returns the shapes the frontend dashboard charts consume.
"""
from collections import defaultdict
from datetime import date
from decimal import Decimal

from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.components.models import Component
from apps.vehicles.models import Vehicle

# Health status -> score contribution (0-100).
HEALTH_SCORES = {
    Component.Health.GOOD: 100,
    Component.Health.WARNING: 55,
    Component.Health.CRITICAL: 15,
}


def _months_between(start, end):
    return (end.year - start.year) * 12 + (end.month - start.month) + 1


def _month_key(d):
    return f"{d.year:04d}-{d.month:02d}"


def _last_12_month_keys(today):
    keys = []
    y, m = today.year, today.month
    for _ in range(12):
        keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(keys))


class VehicleAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        vehicle = get_object_or_404(Vehicle, pk=pk, owner=request.user)
        today = date.today()

        running = list(vehicle.running_logs.all())
        fuel = list(vehicle.fuel_entries.order_by("odometer"))
        maint = list(vehicle.maintenance_records.all())
        components = list(vehicle.components.all())

        fuel_cost = sum((f.total_cost for f in fuel), Decimal("0"))
        maintenance_cost = sum(
            ((m.parts_cost + m.labor_cost) for m in maint), Decimal("0")
        )
        total_spend = fuel_cost + maintenance_cost

        odos = [x.odometer for x in running] + [f.odometer for f in fuel]
        total_distance = (max(odos) - min(odos)) if len(odos) >= 2 else 0

        # Months owned: from purchase date if known, else earliest recorded date.
        start = vehicle.purchase_date
        record_dates = [x.date for x in running] + [f.date for f in fuel] + [m.date for m in maint]
        if not start and record_dates:
            start = min(record_dates)
        months_owned = _months_between(start, today) if start else None

        cost_of_ownership = {
            "purchase_price": vehicle.purchase_price,
            "fuel_cost": fuel_cost,
            "maintenance_cost": maintenance_cost,
            "total_spend": total_spend,
            "total_with_purchase": total_spend + (vehicle.purchase_price or Decimal("0")),
            "total_distance": total_distance,
            "cost_per_km": round(total_spend / total_distance, 2) if total_distance else None,
            "months_owned": months_owned,
            "cost_per_month": round(total_spend / months_owned, 2)
            if months_owned
            else None,
        }

        # Monthly spend (last 12 months), fuel vs maintenance.
        buckets = defaultdict(lambda: {"fuel": Decimal("0"), "maintenance": Decimal("0")})
        for f in fuel:
            buckets[_month_key(f.date)]["fuel"] += f.total_cost
        for m in maint:
            buckets[_month_key(m.date)]["maintenance"] += m.parts_cost + m.labor_cost
        monthly_spend = [
            {
                "month": key,
                "fuel": buckets[key]["fuel"],
                "maintenance": buckets[key]["maintenance"],
                "total": buckets[key]["fuel"] + buckets[key]["maintenance"],
            }
            for key in _last_12_month_keys(today)
        ]

        # Fuel economy per fill (distance since previous fill / this fill's litres).
        economy_series = []
        for prev, cur in zip(fuel, fuel[1:]):
            dist = cur.odometer - prev.odometer
            if dist > 0 and cur.litres > 0:
                economy_series.append(
                    {"date": cur.date, "kmpl": round(Decimal(dist) / cur.litres, 2)}
                )

        # Health score from components.
        counts = {"good": 0, "warning": 0, "critical": 0}
        for c in components:
            counts[c.health] = counts.get(c.health, 0) + 1
        if components:
            score = round(
                sum(HEALTH_SCORES.get(c.health, 0) for c in components) / len(components)
            )
            if counts["critical"]:
                status = "critical"
            elif counts["warning"]:
                status = "warning"
            else:
                status = "good"
        else:
            score = None
            status = "unknown"

        open_reminders = vehicle.reminders.filter(status="open")
        overdue = sum(
            1
            for r in open_reminders
            if (r.due_date and r.due_date < today)
            or (r.due_odometer is not None and r.due_odometer < vehicle.current_odometer)
        )

        return Response(
            {
                "vehicle": vehicle.id,
                "cost_of_ownership": cost_of_ownership,
                "monthly_spend": monthly_spend,
                "economy_series": economy_series,
                "health": {
                    "score": score,
                    "status": status,
                    "counts": counts,
                    "components": [
                        {"label": c.label, "health": c.health} for c in components
                    ],
                },
                "reminders": {"open": open_reminders.count(), "overdue": overdue},
            }
        )
