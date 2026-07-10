# FosterConnect

A local platform that connects **private foster families** with **approved animal
shelters and rescue organizations**, so shelters can quickly find temporary foster
homes for dogs and cats. Focus is **fostering, not adoption**.

- **Backend:** FastAPI + SQLAlchemy + Postgres (JWT auth, role-based access)
- **Frontend:** React (Vite)
- Everything runs locally.

## User types

| Role | Can do |
| --- | --- |
| **Foster** | Register, fill/edit foster profile, update availability, pause or delete profile |
| **Organization** | Register, wait for admin approval, then search & filter foster families |
| **Admin** | Review organizations; approve / reject / suspend them |

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL** running locally (this project was set up against Postgres 18 on port 5432)

---

## 1. Database

Create a database (any name; default expected is `fosterconnect`). Using the
Postgres `psql` shell or pgAdmin:

```sql
CREATE DATABASE fosterconnect;
```

> On Windows the Postgres tools live in e.g. `C:\Program Files\PostgreSQL\18\bin`.
> Example: `& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres fosterconnect`

---

## 2. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# Configure environment
cp .env.example .env          # then edit .env with your DATABASE_URL / password
```

Edit `backend/.env` so `DATABASE_URL` points at your Postgres, e.g.:

```
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/fosterconnect
```

Create the initial **admin** account (also creates the tables):

```bash
python -m app.seed
```

Run the API:

```bash
uvicorn app.main:app --reload
```

- API root: http://localhost:8000
- Interactive API docs (Swagger): http://localhost:8000/docs

By default (`AUTO_CREATE_TABLES=true`) tables are auto-created on startup. To manage
the schema with migrations instead, set `AUTO_CREATE_TABLES=false` and run:

```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
```

### Default admin login

Set in `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), defaults:

```
admin@fosterconnect.local / admin123
```

---

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173

---

## Typical flow

1. A **foster** registers at `/register/foster` and fills their profile.
2. An **organization** registers at `/register/organization` (starts as `pending`).
3. The **admin** logs in, opens the admin dashboard, and approves the organization.
4. The approved **organization** searches foster families with filters (city, dogs/cats,
   dog weight, availability, emergency, car, experience).

---

## API overview

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register/foster` | public | Create foster account + profile |
| POST | `/auth/register/organization` | public | Create organization account (pending) |
| POST | `/auth/login` | public | Get JWT (form: `username`, `password`) |
| GET | `/auth/me` | any | Current user + role |
| GET/PUT | `/fosters/me` | foster | Read / update own profile |
| PATCH | `/fosters/me/availability` | foster | Toggle availability / pause |
| DELETE | `/fosters/me` | foster | Soft-delete own profile |
| GET | `/fosters` | approved org / admin | Search fosters (filters) |
| GET/PUT | `/organizations/me` | organization | Read / update own org |
| GET | `/admin/organizations?status=` | admin | List orgs by status |
| PATCH | `/admin/organizations/{id}/status` | admin | Approve / reject / suspend |

---

## Project structure

```
foster-connect/
  backend/
    app/
      config.py database.py enums.py main.py seed.py
      models/     user, foster_profile, organization
      schemas/    auth, foster, organization
      core/       security (bcrypt + JWT), deps (auth guards)
      routers/    auth, fosters, organizations, admin
    alembic/      migrations
    requirements.txt  .env.example
  frontend/
    src/
      api/client.js         axios + JWT interceptor
      auth/AuthContext.jsx  login state
      components/           NavBar, ProtectedRoute, FosterFields
      pages/               Home, Login, FosterRegister, FosterProfile,
                           OrgRegister, OrgDashboard, AdminDashboard
    package.json  vite.config.js  .env.example
```

## Not in this version

Email verification / password reset, search pagination, photo uploads, in-app
messaging, and deployment/Docker are intentionally out of scope for v1.
