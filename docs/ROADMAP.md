# Auto Buddy — Roadmap & Architecture Plan

The durable, in-repo copy of the plan. The rendered version lives as a Claude Artifact:
<https://claude.ai/code/artifact/142d566e-7175-4240-9545-f0c9cb16140a>. If the two ever disagree,
**this file wins** — update it as the plan evolves.

## Vision

A virtual-garage personal auto-management platform. The 3D garage is the front door (an NFS-lobby feel,
not a traditional dashboard); every record, log, document, and cost lives behind the car it belongs to.
The 3D world is the lobby; data-heavy work happens in focused 2D panels over it.

**Scope:** personal now, structured to become multi-user (SaaS) without a rewrite.
**Surface:** web, desktop-first.
**Model:** hybrid — 3D lobby + 2D detail.

## Stack

| Layer | Choice |
| :-- | :-- |
| Backend | Django + DRF, PostgreSQL (SQLite in dev via `DATABASE_URL`) |
| Auth | Session cookies + CSRF, abstracted so JWT can be added for mobile later |
| Async | Celery + Redis (start with a nightly management command) |
| Files | django-storages → private S3, signed URLs |
| Frontend | React + Vite, React Three Fiber + drei, Tailwind v4 |
| Data layer | TanStack Query (server state) + Zustand (scene/UI state only) |
| Forms/tables/charts | React Hook Form + Zod, TanStack Table, Recharts |
| Routing | React Router for 2D pages; `appState` store for the 3D lobby |

## Data model (target)

Everything hangs off `Vehicle`, which hangs off `owner` — data isolation at the root of the tree.

- **User** (custom, day one) → **Vehicle** (owner FK)
- Vehicle → **Component** (tyres/brakes/battery/oil; health + `hotspot_key` for 3D)
- Vehicle → **RunningLog** (daily odometer/distance) · **FuelEntry** (fill-ups, economy)
- Vehicle → **MaintenanceRecord** (service history, parts/labour cost, next-due)
- Vehicle → **Document** (insurance/registration/license/warranty/inspection; expiry)
- Vehicle → **Reminder** (date OR odometer trigger; auto-seeded + manual)

## Phases

- [x] **Phase 0 — Foundations** *(done — branch `phase-0-foundations`, commit 64b13da)*
  - Monorepo (`backend/` + `frontend/`), Django+DRF, custom User, owner-scoped Vehicle, session auth,
    `seed_demo`, frontend data layer (TanStack Query + axios), real login, Vite proxy. Verified e2e.
- [x] **Phase 1 — Core records (MVP)** *(done)*
  - Backend: `logs` app (RunningLog, FuelEntry) + `maintenance` app (MaintenanceRecord), all owner/vehicle
    -scoped via `apps.vehicles.scoping`, with `?vehicle=` filtering and admin. `GET /api/vehicles/{id}/summary/`
    returns distance / fuel / maintenance totals + fuel economy. `seed_demo` now seeds sample records.
  - Frontend: query/mutation hooks (`api/logs.js`, `api/maintenance.js`, `useVehicleSummary`) and a tabbed
    Records panel (Overview / Running / Fuel / Maintenance) with lists + add forms, opened from the Dashboard
    HUD ("Open Records"). HUD totals now come from the summary endpoint. Verified end-to-end.
  - Deferred to later: Vehicle *edit/create* UI (API exists; admin covers it for now), React Router pages
    (still an overlay), React Hook Form/Zod (plain controlled forms for now).
- [x] **Phase 2 — Documents & reminders** *(done)*
  - Backend: `documents` app (Document + owner-checked download endpoint — files never served via public
    MEDIA) and `reminders` app (Reminder with date/odometer triggers, dedupe key, status). `run_reminders`
    management command auto-seeds reminders from document expiry + maintenance next-due, respects dismissal,
    and emails soon-due items (console backend in dev). `seed_demo` adds a near-expiry insurance doc.
  - Frontend: `api/documents.js` (list/upload/download) + `api/reminders.js` (list/add/done/dismiss), and
    Documents + Reminders tabs in the Records panel (upload form, download links, overdue highlighting,
    done/dismiss). Verified end-to-end incl. private download through the proxy.
  - Deferred: S3 storage (still local FileSystemStorage; download view is storage-agnostic), Celery
    (still a cron-able command), in-file preview/thumbnails.
- [ ] **Phase 3 — The living garage**
  - Real 3D lobby: multi-vehicle select, camera choreography. Data-driven hotspots + health colours
    wired to components/services. Panels open from hotspots. Gate/skip the cinematic for daily use.
- [ ] **Phase 4 — Analytics & hardening**
  - Dashboards (cost of ownership, health scoring, trends). Performance pass, responsive/PWA groundwork.
    SaaS-readiness (onboarding, per-user hardening, billing hooks) when/if going multi-user.

## Key decisions (hold the line on these)

- Server state → TanStack Query; Zustand only for ephemeral scene/UI state.
- Owner-scope **every** queryset from day one (`owner == request.user`).
- Store canonical units (metric, litres); format in the UI. Currency field per vehicle.
- 3D hotspot layout is frontend config (model-specific, hand-tuned); hotspot *state* comes from the API.
- Reminders have two clocks: date-based and odometer-based (reads latest RunningLog).
- Documents are always private — signed, short-lived URLs, never a public bucket.

## Open questions (revisit as phases land)

- Notification channels beyond email (browser/PWA push? SMS for critical expiries?).
- 3D model sourcing for arbitrary user cars if going SaaS (curated library + generic fallback for now).
- One garage scene with multiple cars staged vs. one-at-a-time + select carousel (leaning one-at-a-time).
- How aggressive to be with automation (suggest service intervals from make/model/mileage, or track-only?).
