"""Pytest fixtures: dedicated Postgres test DB, per-test rollback, and a
TestClient wired to the test DB via a get_db override.

The whole app funnels DB access through the single `get_db` dependency
(used by every router and by all guards in app/core/deps.py), so overriding
that one dependency reroutes the entire application onto an isolated session.
"""

import os

# Must be set before importing app.config so pydantic-settings picks it up and
# the app's startup lifespan does NOT touch the real database. (An env var
# takes precedence over the value in .env.)
os.environ["AUTO_CREATE_TABLES"] = "false"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import hash_password
from app.database import Base, get_db
from app.enums import UserRole
from app.main import app
from app.models.organization import Organization  # noqa: F401 (register mapping)
from app.models.user import User

# Derive test/maintenance URLs from the real DATABASE_URL by swapping the db name.
_PREFIX, _ = settings.database_url.rsplit("/", 1)
TEST_DB_NAME = "fosterconnect_test"
TEST_DB_URL = f"{_PREFIX}/{TEST_DB_NAME}"
MAINTENANCE_URL = f"{_PREFIX}/postgres"


def _drop_test_db():
    admin_engine = create_engine(MAINTENANCE_URL, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        # WITH (FORCE) disconnects any lingering sessions (Postgres 13+).
        conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}" WITH (FORCE)'))
    admin_engine.dispose()


@pytest.fixture(scope="session")
def test_engine():
    """Create a clean fosterconnect_test DB for the whole session, drop it after."""
    _drop_test_db()
    admin_engine = create_engine(MAINTENANCE_URL, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    admin_engine.dispose()

    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()
    _drop_test_db()


@pytest.fixture()
def db_session(test_engine):
    """One connection + outer transaction per test; the app commits into a
    SAVEPOINT, and we roll the whole thing back afterward so tests never leak."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    """TestClient whose get_db yields the test's rolled-back session."""

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_token(client, db_session):
    """Insert an admin directly (there's no admin register endpoint), then log in.

    The insert uses the same connection the client reads through, so login sees it.
    """
    admin = User(
        email="admin@test.io",
        hashed_password=hash_password("adminpass123"),
        role=UserRole.admin,
    )
    db_session.add(admin)
    db_session.commit()
    resp = client.post(
        "/auth/login",
        data={"username": "admin@test.io", "password": "adminpass123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture()
def approved_org_token(client, db_session, admin_token):
    """Register an organization and have the admin approve it; return its token.

    The org's token is unchanged by approval — the search guard re-checks the
    org's approval_status from the DB per request, so the same token now passes.
    """
    from tests.helpers import auth_headers, org_register_payload

    reg = client.post("/auth/register/organization", json=org_register_payload())
    token = reg.json()["access_token"]

    org = db_session.query(Organization).one()
    resp = client.patch(
        f"/admin/organizations/{org.id}/status",
        json={"approval_status": "approved"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200, resp.text
    return token


@pytest.fixture()
def make_foster(client, db_session):
    """Factory: register a foster via the API, optionally force its
    profile_status (to seed paused/suspended/deleted rows for search tests)."""
    from app.enums import ProfileStatus
    from app.models.foster_profile import FosterProfile
    from tests.helpers import foster_register_payload

    def _make(email, status=ProfileStatus.active, **profile_overrides):
        resp = client.post(
            "/auth/register/foster",
            json=foster_register_payload(account_email=email, **profile_overrides),
        )
        assert resp.status_code == 201, resp.text
        user = db_session.query(User).filter(User.email == email).one()
        profile = (
            db_session.query(FosterProfile)
            .filter(FosterProfile.user_id == user.id)
            .one()
        )
        if status != ProfileStatus.active:
            profile.profile_status = status
            db_session.commit()
        return profile

    return _make
