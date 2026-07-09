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

### Build status: Phase 0 (foundations) is done
Custom `User`, owner-scoped `Vehicle`, session auth, and a wired-up frontend data layer exist and are
verified end-to-end. The old hardcoded login (`admin`/`password123`) is gone — auth now hits the API.
`MOCK_DATA` in `frontend/src/constants/const.js` still supplies the 3D `interactiveNodes` and the
maintenance/fuel HUD numbers (those domains land in later phases); the vehicle name and odometer in the
HUD, and all auth, come from the API.

## Commands

**Backend** (from `backend/`, with `source .venv/bin/activate`):
- `python manage.py runserver` — API on http://127.0.0.1:8000 (`/api`, admin at `/admin`)
- `python manage.py migrate` / `makemigrations`
- `python manage.py seed_demo` — creates demo user + the GT-R as real data (idempotent)
- `python manage.py createsuperuser` — for admin access
- Demo login: `demo` / `demo12345`

**Frontend** (from `frontend/`):
- `npm run dev` — Vite dev server (proxies `/api`, `/admin`, `/static` to Django — see `vite.config.js`)
- `npm run build` / `npm run preview`
- `npm run lint` — ESLint (flat config). Note: the 3D prototype files carry pre-existing lint errors
  (unused `motion`/`useRef` imports); don't assume a red lint is your change.

Run both dev servers together; the browser sees a single origin via the Vite proxy, so session + CSRF
cookies work without CORS friction. No automated tests are configured yet.

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
- **API routing**: `config/urls.py` mounts `/api/auth/` (accounts) and `/api/` (a DRF `DefaultRouter` with
  `vehicles`). Add new domains as new apps under `apps/`, each with its own router included into `/api/`.

## Frontend architecture

Everything below lives under `frontend/src/`.

### Data layer (added in Phase 0)
- **Server state = TanStack Query; client state = Zustand.** Do not put API data in the Zustand store.
  Query hooks live in `src/api/` (`auth.js`, `vehicles.js`) over a shared axios instance in `src/api/client.js`.
- `client.js` sets `baseURL: '/api'`, `withCredentials`, and maps Django's CSRF cookie/header
  (`csrftoken` → `X-CSRFToken`) so axios attaches the token automatically. `ensureCsrf()` is called once in
  `main.jsx` before any POST.
- `main.jsx` wraps `<App>` in `QueryClientProvider`.

### State-driven "scene" routing
A single Zustand store (`src/store/useAppStore.js`) drives the experience. `appState` is the top-level
router, switched in `src/App.jsx`:
- `loading` → `LoadingAwakening` (CSS/Framer "eyes opening" overlay) + `Landing`
- `exterior` → `Landing` (garage exterior + login/unlock flow)
- `interior` → `Dashboard` (garage interior + vehicle + interactive nodes)

`react-router-dom` is installed but not yet used; the plan is to introduce it for 2D detail pages while
`appState` keeps driving the 3D lobby. Other store fields: `isLoggedIn`, `isUnlocked` (`unlockGarage`),
`selectedNode` (`setSelectedNode`, drives the sidebar).

### Scripted transition sequence
A chain of timers and state flips spread across components — trace all of these when touching timing:
1. `LoadingAwakening` runs a blink sequence, then `setAppState('exterior')` after ~5s.
2. `GarageExterior`: local `hasEntered` gates the "Awaiting Command" button; entering lerps the camera via the `CameraRig`/`useFrame` rig.
3. Clicking the padlock opens `LoginModal`, which now calls the real login (`useLogin` mutation); on success it calls `unlockGarage()`.
4. On `isUnlocked`, the garage door mesh animates up in `GarageModel`'s `useFrame`, which fires `setAppState('interior')` once the door clears a height threshold. **Note:** `Landing.jsx` *also* independently schedules `setAppState('interior')` on a 3s timeout — two paths trigger the same transition, so verify both when changing it.

### 3D layer (React Three Fiber)
Canvas components live in `src/components/canvas/`. Each `<Canvas>` scene owns its own lights, camera, and models.
- **Models are Vite URL imports**: `import x from '.../model.glb?url'` then `useGLTF(url)`. `vite.config.js` sets `assetsInclude: ['**/*.glb']`. Assets under `src/assets/models/{buildings,objects,terrain,vehicles}/`.
- **Mesh mutation by name traversal**: components `scene.traverse(...)` in a `useEffect` to set shadows and locate meshes by fuzzy name match (door detection matches `door`/`gate`/`roller`). Brittle to model swaps — re-check on any model change.
- **Animation via `useFrame`** using `THREE.MathUtils.lerp` / manual velocity integration. No 3D animation library.
- **2D-in-3D overlays** use drei's `<Html>` (tooltips, pulsing interactive dots).

### Interactive node system
`MOCK_DATA.vehicle.interactiveNodes` defines clickable hotspots as world-space `[x,y,z]` positions relative
to the vehicle. Rendered as `<Html>` dots in the interior scene; clicking sets `selectedNode`, which opens
`DashboardSidebar`. Positions are hand-tuned to the current GT-R model and scale — changing the vehicle model
or its transform requires re-tuning. (Planned: these become API-backed `Component` records with health colours.)

### 2D UI
Tailwind CSS v4 (via `@tailwindcss/vite`, configured through `@theme` in `src/index.css` — no
`tailwind.config.js`). Lucide-React for icons, Framer Motion for 2D UI/overlay animation. UI components in
`src/components/ui/`.

## Reference

`application_summary.md` is a maintained design/spec document covering exact model filenames, scales,
positions, lighting intensities, and colours per scene. Consult and update it when changing 3D assets,
lighting, or the transition choreography — treat drift between it and the code as a bug.
