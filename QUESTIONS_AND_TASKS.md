# Questions & Tasks

Running list of things to revisit later. Not fixed yet — just tracked here so we
don't lose them.

---

## 1. `hash_password` silently truncates instead of rejecting long passwords

**File:** [backend/app/core/security.py](backend/app/core/security.py:9-12)

Current code:
```python
def hash_password(password: str) -> str:
    # bcrypt operates on bytes and has a 72-byte input limit.
    pwd = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("utf-8")
```

bcrypt only looks at the first 72 bytes of input, so today anything past byte 72
is silently ignored — a password and that same password with extra characters
appended both hash to the same value and both work at login.

User's suggestion: replace the silent `[:72]` slice with a helper that raises
instead of truncating:
```python
def normalize_password(password: str) -> bytes:
    pwd = password.encode("utf-8")
    if len(pwd) > 72:
        raise ValueError("Password is too long")
    return pwd
```

**Status:** ✅ Fixed. Applied both layers, each for a different reason:
- `security.py` — new `_password_bytes()` helper raises `ValueError` if the
  password exceeds 72 UTF-8 bytes (no more silent truncation). `hash_password`
  lets the error propagate; `verify_password` catches it and returns `False`
  (login just fails, doesn't crash), since `/login` uses
  `OAuth2PasswordRequestForm` and `seed.py` calls `hash_password` directly —
  both bypass Pydantic, so this is the real source of truth.
- `routers/auth.py` — `_create_user` (shared by both registration endpoints)
  catches that `ValueError` and returns a clean `400`.
- `schemas/foster.py` / `schemas/organization.py` — added
  `max_length=72` to the password field as an early-fail 422 nicety. Noted
  caveat: this counts characters, not bytes, so it's only an approximation
  for non-ASCII passwords — the real guarantee is in `security.py`.

---

## 2. Why does `/login` use `OAuth2PasswordRequestForm` instead of JSON?

**File:** [backend/app/routers/auth.py](backend/app/routers/auth.py)

```python
@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
```

Every other endpoint in the API takes/returns JSON, but `/login` takes its body
as `OAuth2PasswordRequestForm`, which is form-encoded
(`application/x-www-form-urlencoded`), not JSON — meaning the frontend can't just
`axios.post('/auth/login', { email, password })` like it does everywhere else.

Is there a specific reason for this, or should it just be a plain JSON schema
(e.g. `LoginRequest` with `email`/`password`) like the rest of the API?

**Status:** question only — not answering yet, user is still reviewing the docs.

---

## 3. TODO: Switch from `Base.metadata.create_all()` to real Alembic migrations

**Files:** [backend/app/main.py](backend/app/main.py), [backend/app/seed.py](backend/app/seed.py), `backend/.env` (`AUTO_CREATE_TABLES`)

Right now `AUTO_CREATE_TABLES=true`, so `main.py`/`seed.py` call
`Base.metadata.create_all()` on startup to build tables straight from the
SQLAlchemy models. Alembic is wired up (`backend/alembic/`) but not actually
being used yet — see the "Note for your setup right now" in the earlier
explanation of the backend.

**TODO / Future improvement:** replace `Base.metadata.create_all()` with
Alembic migrations and set `AUTO_CREATE_TABLES=false` by default, so schema
changes are versioned and applied safely (`alembic revision --autogenerate` +
`alembic upgrade head`) instead of just being derived fresh from the models
every time.

**Status:** not fixed yet — tracked for later, likely worth doing once the
schema starts changing against data you care about keeping.

---

## 4. TODO: Improve `seed.py`

**File:** [backend/app/seed.py](backend/app/seed.py)

Current script only creates a single hardcoded admin (`settings.admin_email` /
`settings.admin_password`), calls `Base.metadata.create_all()` itself (same
issue as #3), and prints the plaintext password to stdout on creation
(`seed.py:25`).

**Future improvement:**
- Support multiple initial admins from environment/config, not just one.
- Avoid printing passwords to stdout/logs.
- Use Alembic instead of `create_all()` for schema setup (ties into #3).

**Status:** not fixed yet — tracked for later.

---

## 5. TODO: Formalize `max_dog_weight_kg` bucket options as an enum

**Files:** [backend/app/models/foster_profile.py](backend/app/models/foster_profile.py), [backend/app/schemas/foster.py](backend/app/schemas/foster.py), [backend/app/enums.py](backend/app/enums.py), [frontend/src/components/FosterFields.jsx](frontend/src/components/FosterFields.jsx)

The "Maximum dog weight" field in the foster registration/profile form is now
a fixed dropdown (5 / 10 / 15 / 20 / 25 / 30 / "מעל 30 ק״ג / ללא הגבלה"), but
on the backend it's still just a free `int | None` column — the frontend is
the only place enforcing that it's one of those specific buckets. Nothing
stops the API from accepting an arbitrary value like 17 if called directly
(e.g. via `/docs` or another client).

**Future improvement:** consider formalizing the allowed values as a proper
enum (like `AvailabilityStatus`/`ProfileStatus` in `enums.py`), so the bucket
list is enforced server-side too, not just in the React dropdown.

**Status:** not fixed yet — tracked for later, explicitly deferred for now.

---

## 6. Note to self: what `config.py` actually loads, and from where

**File:** [backend/app/config.py](backend/app/config.py)

`Settings` declares a hardcoded default for every field (e.g.
`jwt_secret: str = "change-me-to-a-long-random-string"`, `admin_email: str =
"admin@fosterconnect.io"`, etc.), **and** points at the real `.env` file via
`env_file=_ENV_FILE` (anchored to `config.py`'s own location on disk — see
item covered in chat re: the path-resolution bug).

**Precedence, confirmed by direct test** (`Settings().jwt_secret` printed and
compared against the class default):
1. If the variable is set as a real OS environment variable → that wins.
2. Else if it's present in `backend/.env` → that value is used.
3. Else → falls back to the hardcoded default written in `config.py`.

So yes — `JWT_SECRET` (and `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL`,
etc.) are genuinely read from `.env` today; the hardcoded values in
`config.py` only ever kick in if `.env` is missing/unreadable or a specific
line is missing from it — which is exactly the failure mode from the
`.env`-path bug (item covered separately): when that bug was live, `.env`
silently wasn't found at all, so *every* setting quietly fell back to its
code default at once, not just one.

**Status:** ✅ confirmed/documented, not an open question.

---

## 7. TODO: Add rate limiting

**Files:** [backend/app/routers/auth.py](backend/app/routers/auth.py) (mainly
`/auth/login` and the register endpoints), possibly applied globally.

There is currently no rate limiting anywhere in the API. `/auth/login` in
particular has no limit on failed attempts — nothing stops repeated
password-guessing against a known email, and registration/search endpoints
have no throttling either.

**Future improvement:** add rate limiting (e.g. per-IP and/or per-account on
`/auth/login`, and a general limit across the API) before this goes anywhere
beyond local development — a library like `slowapi` (FastAPI-friendly wrapper
around `limits`) would fit without much rework.

**Status:** not fixed yet — tracked for later.

---

## 8. TODO: Add automated tests for the forms

**Files:** no test files exist anywhere in the project yet (backend or
frontend).

There's currently zero automated test coverage — every check so far in this
project has been manual/ad-hoc (direct API calls, manual DB queries, browser
checks). Worth having real tests around the registration and profile forms
specifically (foster registration, organization registration, foster profile
update), since those are the most field-heavy, validation-heavy parts of the
app.

**Future improvement:** add backend tests (e.g. `pytest` + FastAPI's
`TestClient`/`httpx`) covering required-field validation, the "at least one
link" org rule, password length limits, etc.; consider frontend tests
(e.g. Vitest) for form behavior like the dirty-state save button.

**Status:** not fixed yet — tracked for later.

---

## 9. TODO: Limit on foster full name length

**File:** [backend/app/schemas/foster.py](backend/app/schemas/foster.py) —
`full_name: str` (no `max_length`)

The DB column is `String(255)` (see
[backend/app/models/foster_profile.py](backend/app/models/foster_profile.py)),
but the Pydantic schema doesn't enforce any length limit before that. Right
now, a name longer than 255 characters would fail at the database level with
a raw SQL error, not a clean validation error from the API.

**Future improvement:** add `Field(max_length=255)` (matching the DB column)
to `full_name` in `FosterProfileBase`, so it fails with a clean `422` instead
of a DB-level error.

**Status:** not fixed yet — tracked for later.

---

## 10. TODO: Phone number validation

**Files:** [backend/app/schemas/foster.py](backend/app/schemas/foster.py)
(`phone: str | None`), [backend/app/schemas/organization.py](backend/app/schemas/organization.py)
(`phone: str`)

Phone fields are currently plain, unvalidated strings on both foster and
organization schemas — any text at all is accepted, no format/length check.

**Future improvement:** add real phone validation (e.g. a regex for
Israeli phone number formats, or a library like `phonenumbers`) to both
schemas.

**Status:** not fixed yet — tracked for later.

---

## 11. Code review from a friend — 4 items to go over

Someone who reviewed the code separately flagged these. Not fixed yet —
just recording so we don't lose them.

### 11a. Duplicate DB query in `require_approved_org_or_admin`

**File:** [backend/app/core/deps.py:58](backend/app/core/deps.py:58)

```python
org = db.query(Organization).filter(Organization.user_id == user.id).first()
```

This fires an extra query on every search request made by an organization.
Since `user` already has a `user.organization` relationship, that could be
used directly instead (if the session is still open), or eager-loaded.

### 11b. No pagination on list endpoints

**Files:** `GET /fosters` ([backend/app/routers/fosters.py](backend/app/routers/fosters.py)),
`GET /admin/fosters` and `GET /admin/organizations` ([backend/app/routers/admin.py](backend/app/routers/admin.py))

All three return every matching row with no limit. Fine at today's scale,
but with e.g. 10,000 fosters this would be slow and expensive. Add
`limit`/`offset` (or cursor-based) pagination.

### 11c. `AdminFosterRead` is built manually

**File:** [backend/app/routers/admin.py:109-111](backend/app/routers/admin.py:109-111)

```python
data = FosterProfileRead.model_validate(profile).model_dump()
data["account_email"] = user.email
```

Works, but fragile — hand-assembling a dict outside the type system.
Better: a proper `model_validator` on `AdminFosterRead`, or a typed
constructor that takes both the profile and the user object directly.

### 11d. `ilike` on unindexed `nearby_city`

**File:** [backend/app/routers/fosters.py:103](backend/app/routers/fosters.py:103)

`ilike` with a leading `%` can't use a plain B-tree index. Not a problem at
today's data volume, but at scale this would want a `pg_trgm` index or
full-text search.

**Status:** not fixed yet — tracked for later, none of these are urgent at
current scale.
