"""Basic auth: register organization, login, /auth/me."""

from tests.helpers import auth_headers, org_register_payload


def test_register_organization_returns_token_and_starts_pending(client, db_session):
    from app.models.organization import Organization

    resp = client.post("/auth/register/organization", json=org_register_payload())

    assert resp.status_code == 201, resp.text
    assert resp.json()["access_token"]

    org = db_session.query(Organization).one()
    assert org.approval_status.value == "pending"


def test_login_with_valid_credentials_returns_token(client):
    client.post("/auth/register/organization", json=org_register_payload())

    resp = client.post(
        "/auth/login",
        data={"username": "org@example.com", "password": "orgpass123"},
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["access_token"]


def test_login_with_wrong_password_is_rejected(client):
    client.post("/auth/register/organization", json=org_register_payload())

    resp = client.post(
        "/auth/login",
        data={"username": "org@example.com", "password": "wrong-password"},
    )

    assert resp.status_code == 401


def test_auth_me_returns_current_user(client):
    reg = client.post("/auth/register/organization", json=org_register_payload())
    token = reg.json()["access_token"]

    resp = client.get("/auth/me", headers=auth_headers(token))

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["email"] == "org@example.com"
    assert body["role"] == "organization"


def test_auth_me_without_token_is_rejected(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401
