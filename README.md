# Auto Buddy

A virtual-garage personal auto-management platform: a 3D garage lobby (React + Three.js) backed by a
complete record-keeping system (Django + DRF) for vehicles, running logs, fuel, maintenance, documents,
reminders, and analytics.

See [`application_summary.md`](./application_summary.md) for the 3D experience spec and `CLAUDE.md` for
architecture guidance.

## Layout

```
auto-buddy/
├── backend/    # Django + DRF API (Python 3.14)
└── frontend/   # React + Vite + React Three Fiber SPA
```

The frontend is a pure client; the backend is an API plus the Django admin. They deploy independently.

## Backend — quick start

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                 # defaults to SQLite; set DATABASE_URL for Postgres
python manage.py migrate
python manage.py seed_demo            # creates demo user + the GT-R as real data
python manage.py runserver            # http://127.0.0.1:8000  (admin at /admin, API at /api)
```

Demo login: `demo` / `demo12345`.

## Frontend — quick start

```bash
cd frontend
npm install
npm run dev                           # http://localhost:5173, proxies /api to the backend
```

Run both dev servers side by side; the Vite dev server talks to Django over `/api`.
