# Open Questions / Follow-ups

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
