# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Auto Buddy — a virtual-garage personal auto-management platform. A 3D garage (React + React Three Fiber)
is the front door; a Django + DRF API is the record-keeping system behind it. The long-term product covers
vehicles, running logs, fuel, maintenance, documents, reminders, and analytics. See `application_summary.md`
for the 3D experience spec and the published architecture plan for the full roadmap.

**Monorepo** (restructured from the original flat Vite prototype):

```
auto-buddy/
├── backend/    # Django 6 + DRF API (Python 3.14, venv at backend/.venv)
└── frontend/   # React + Vite SPA (React Three Fiber)
```

The frontend is a pure client; the backend is an API plus the Django admin. They deploy independently.

### Build status: Phases 0–4 done (roadmap complete)
Phase 0 (foundations): custom `User`, owner-scoped `Vehicle`, session auth, frontend data layer.
Phase 1 (core records): `logs` (RunningLog, FuelEntry) and `maintenance` (MaintenanceRecord) apps, a vehicle
`summary` endpoint, and a 2D Records panel.
Phase 2 (documents & reminders): `documents` (private Document + owner-checked download) and `reminders`
(Reminder + `run_reminders` engine that emails soon-due items) apps, plus Documents/Reminders tabs.
Phase 3 (living garage): `components` app (Component with health) drives the 3D hotspots; multi-vehicle
active-vehicle switching; skippable intro.
Phase 4 (analytics & hardening): `analytics` app (view-only aggregation) + an `AnalyticsPanel` with SVG
charts; lint is green project-wide; `MOCK_DATA`/`const.js` deleted.
The old hardcoded login (`admin`/`password123`) is gone — auth hits the API, HUD totals come from the
summary endpoint, and the 3D hotspots come from Component records. `MOCK_DATA` in
`frontend/src/constants/const.js` is now vestigial (only a vehicle-name fallback) — safe to remove later.

## Commands

**Backend** (from `backend/`, with `source .venv/bin/activate`):
- `python manage.py runserver` — API on http://127.0.0.1:8000 (`/api`, admin at `/admin`)
- `python manage.py migrate` / `makemigrations`
- `python manage.py seed_demo` — creates demo user + the GT-R as real data (idempotent)
- `python manage.py createsuperuser` — for admin access
- `python manage.py test` — backend test suite (28 tests; owner-scoping, reminder engine, analytics/summary
  math, document privacy). Run a subset with e.g. `python manage.py test apps.reminders`.
- Demo login: `demo` / `demo12345`

**Frontend** (from `frontend/`):
- `npm run dev` — Vite dev server (proxies `/api`, `/admin`, `/static` to Django — see `vite.config.js`)
- `npm run build` / `npm run preview`
- `npm run lint` — ESLint (flat config); currently green across the whole project. The config includes
  `eslint-plugin-react`'s `jsx-uses-vars` so member-expression JSX like `<motion.div>` isn't false-flagged.

Run both dev servers together; the browser sees a single origin via the Vite proxy, so session + CSRF
cookies work without CORS friction. Backend tests exist (`python manage.py test`); the frontend has none yet.

## Backend architecture

Django project is `config/`; apps live under `backend/apps/` with dotted names (`apps.accounts`,
`apps.vehicles`) and explicit `label`s in each `apps.py`.

- **Settings** (`config/settings.py`) are env-driven via `python-dotenv` (`backend/.env`, see `.env.example`).
  Database defaults to SQLite; set `DATABASE_URL` (via `dj-database-url`) to a `postgres://` URL for Postgres.
- **Custom user** — `AUTH_USER_MODEL = "accounts.User"` set from day one (extends `AbstractUser`); swapping
  it later is a painful migration, so it's already custom even though currently empty.
- **Owner scoping is the core rule.** Every `Vehicle` has an `owner` FK, and `VehicleViewSet.get_queryset`
  filters to `request.user`; `perform_create` forces `owner=request.user`. All future record models must
  hang off `Vehicle` (or carry their own owner) and scope the same way — this is what makes the "personal
  now, SaaS-ready" plan real. Never expose a queryset that isn't owner-scoped.
- **Auth is session + CSRF** (DRF `SessionAuthentication`, `IsAuthenticated` default). Endpoints under
  `/api/auth/`: `csrf/` (GET, sets cookie), `login/`, `logout/`, `me/`. `me/` returns 403 when anonymous —
  the frontend treats that as "logged out".
- **API routing**: `config/urls.py` mounts `/api/auth/` (accounts) and `/api/` (each app contributes a DRF
  router: `vehicles`, `running-logs`, `fuel-entries`, `maintenance-records`). Add new domains as new apps
  under `apps/`, each with its own router included into `/api/`.
- **Per-vehicle records reuse `apps/vehicles/scoping.py`**: `VehicleScopedViewSet` (queryset filtered to
  `vehicle__owner=request.user`, `?vehicle=` filter) + `VehicleOwnedSerializerMixin` (validates the vehicle
  is owned on write). Every per-vehicle record model uses both (logs, maintenance, documents, reminders,
  components).
- **Documents are private**: files upload under `MEDIA_ROOT` but are served ONLY through
  `documents/<pk>/download/` (owner-checked `FileResponse`), never the public `MEDIA_URL`. The serializer's
  `file_url` is a relative path on purpose (works same-origin in prod and through the Vite dev proxy; an
  absolute backend host would drop the session cookie). Swap to S3/signed URLs later without touching callers.
- **Reminders engine**: logic lives in `apps/reminders/engine.py` (`engine.run(vehicles_qs)`), shared by two
  callers — `python manage.py run_reminders` (all vehicles, cron-able) and `POST /api/reminders/run/`
  (scoped to `request.user`'s vehicles, since there's no cron on localhost; the dashboard fires it on entry
  and the Reminders tab has a "Check now" button). It auto-seeds reminders from document expiry + maintenance
  next-due via a `dedupe_key` (update-in-place, never resurrects a dismissed one) and emails soon-due items.
  Email uses the console backend in dev; lookahead windows are `REMINDER_LOOKAHEAD_DAYS`/`_KM` in settings.

## Frontend architecture

Everything below lives under `frontend/src/`.

### Data layer (added in Phase 0)
- **Server state = TanStack Query; client state = Zustand.** Do not put API data in the Zustand store.
  Query hooks live in `src/api/` (`auth.js`, `vehicles.js`) over a shared axios instance in `src/api/client.js`.
- `client.js` sets `baseURL: '/api'`, `withCredentials`, and maps Django's CSRF cookie/header
  (`csrftoken` → `X-CSRFToken`) so axios attaches the token automatically. `ensureCsrf()` is called once in
  `main.jsx` before any POST.
- `main.jsx` wraps `<App>` in `QueryClientProvider`.
- **Records surface**: `components/records/RecordsPanel.jsx` is a tabbed slide-in (Overview/Running/Fuel/
  Maintenance/Documents/Reminders) opened from the Dashboard "Open Records" button; hooks in `api/logs.js`,
  `api/maintenance.js`, `api/documents.js`, `api/reminders.js`. Each tab now does full CRUD: an `editing`
  state prefills the add-form for edits, and `DataTable` rows carry edit/delete actions (delete uses a
  `window.confirm`). Document edits are metadata-only (PATCH, no re-upload).
- **Vehicle management**: `components/vehicles/VehiclesPanel.jsx` (Dashboard "Garage" button) does
  vehicle add/edit/delete + active-vehicle select; write hooks in `api/vehicles.js`. The 3D-model picker is
  sourced from `HOTSPOT_LAYOUTS` keys.
- **Component editing lives in the sidebar**: `DashboardSidebar` reads the *live* component list (not the
  click-time snapshot) so edits reflect immediately, and can create a component for a hotspot that has none.
  Editing health re-colours the 3D dot. Hooks in `api/components.js`.
  Add-forms are plain controlled `useState` (matching the existing style — not React Hook Form yet).
  Mutations invalidate the relevant list plus `['vehicle-summary', id]` so totals refresh.
- **Analytics**: `components/analytics/AnalyticsPanel.jsx` (opened from the HUD "Analytics" button) reads
  `GET /api/vehicles/{id}/analytics/` via `api/analytics.js` and renders self-contained SVG charts (stacked
  monthly-spend bars, health-score ring, economy sparkline). The categorical chart palette
  (fuel `#3392d0` / maintenance `#c96a1c`) was validated with the dataviz skill — keep both in the lightness
  band and CVD-separated if you change them.

Note: the ESLint flat config lacks `eslint-plugin-react`, so `jsx-uses-vars` doesn't fire — lowercase
identifiers used only as member-expression JSX (e.g. `motion` in `<motion.div>`) are false-flagged as unused
by `no-unused-vars`. Every framer-motion file carries this; it's a config gap, not a real error.

### State-driven "scene" routing
A single Zustand store (`src/store/useAppStore.js`) drives the experience. `appState` is the top-level
router, switched in `src/App.jsx`:
- `loading` → `LoadingAwakening` (CSS/Framer "eyes opening" overlay) + `Landing`
- `exterior` → `Landing` (garage exterior + login/unlock flow)
- `interior` → `Dashboard` (garage interior + vehicle + interactive nodes)

`Landing` and `Dashboard` are `React.lazy` (dynamic import) in `App.jsx`, wrapped in `<Suspense fallback={null}>`
— this splits three.js/R3F into an async chunk (~955 kB) that loads during the eager intro instead of blocking
first paint. Keep them lazy; `LoadingAwakening` stays eager (it's framer-only, no three). `build.chunkSizeWarningLimit`
is raised to 1000 in `vite.config.js` because that three chunk is a deliberate, expected async vendor bundle.

`react-router-dom` is installed but not yet used; the plan is to introduce it for 2D detail pages while
`appState` keeps driving the 3D lobby. Other store fields: `isLoggedIn`/`logIn`, `logOut` (full reset to
the exterior, used on logout), `isUnlocked` (`unlockGarage`), `selectedNode` (`setSelectedNode`),
`activeVehicleId`.

**Session skip-login**: `App.jsx` calls `useMe()`; a valid Django session (me != null) with `!isUnlocked`
jumps straight to `interior`, bypassing the intro + padlock. The `!isUnlocked` guard is load-bearing — it
keeps the fresh-login door-opening cinematic (which sets `isUnlocked` first) from being short-circuited.
Logout is a top-right dashboard button: `useLogout` (server) + store `logOut` (reset to exterior).

### Scripted transition sequence
A chain of timers and state flips spread across components — trace all of these when touching timing:
1. `LoadingAwakening` runs a blink sequence, then `setAppState('exterior')` after ~5s. It's skipped on return visits (localStorage `ab_intro_seen`) and has a Skip button.
2. `GarageExterior`: local `hasEntered` gates the "Awaiting Command" button; entering lerps the camera via the `CameraRig`/`useFrame` rig.
3. Clicking the padlock opens `LoginModal`, which now calls the real login (`useLogin` mutation); on success it calls `unlockGarage()`.
4. On `isUnlocked`, the garage door mesh animates up in `GarageModel`'s `useFrame`, which fires `setAppState('interior')` once the door clears a height threshold. **Note:** `Landing.jsx` *also* independently schedules `setAppState('interior')` on a 3s timeout — two paths trigger the same transition, so verify both when changing it.

### 3D layer (React Three Fiber)
Canvas components live in `src/components/canvas/`. Each `<Canvas>` scene owns its own lights, camera, and models.
- **Models are Vite URL imports**: `import x from '.../model.glb?url'` then `useGLTF(url)`. `vite.config.js` sets `assetsInclude: ['**/*.glb']`. Assets under `src/assets/models/{buildings,objects,terrain,vehicles}/`.
- **Mesh mutation by name traversal**: components `scene.traverse(...)` in a `useEffect` to set shadows and locate meshes by fuzzy name match (door detection matches `door`/`gate`/`roller`). Brittle to model swaps — re-check on any model change.
- **Animation via `useFrame`** using `THREE.MathUtils.lerp` / manual velocity integration. No 3D animation library.
- **2D-in-3D overlays** use drei's `<Html>` (tooltips, pulsing interactive dots).

### Interactive hotspot system (API-backed as of Phase 3)
The clickable hotspots are the intersection of two sources, joined by `hotspot_key`:
- **Position** (presentation) — `frontend/src/scene/hotspots.js` maps `model_3d` → `[{ hotspot_key, position,
  title }]`, hand-tuned per `.glb`. Changing the vehicle model/scale means re-tuning these coordinates.
- **State** (data) — `Component` records from `/api/components/?vehicle=<id>` supply `health`
  (good/warning/critical) and service metadata.

`VehicleModel` merges them, renders `<Html>` dots coloured by `healthColor(health)`, and on click sets
`selectedNode = { hotspot_key, title, component }`, which `DashboardSidebar` renders. Editing a component's
health (admin or API) recolours the dot — the world reflects the records. Active vehicle comes from
`useActiveVehicle()` (store `activeVehicleId`, falling back to the first vehicle).

### 2D UI
Tailwind CSS v4 (via `@tailwindcss/vite`, configured through `@theme` in `src/index.css` — no
`tailwind.config.js`). Lucide-React for icons, Framer Motion for 2D UI/overlay animation. UI components in
`src/components/ui/`.

## Reference

`application_summary.md` is a maintained design/spec document covering exact model filenames, scales,
positions, lighting intensities, and colours per scene. Consult and update it when changing 3D assets,
lighting, or the transition choreography — treat drift between it and the code as a bug.
