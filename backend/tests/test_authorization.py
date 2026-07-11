"""The approval gate: only approved organizations (or admin) may search fosters."""

from tests.helpers import auth_headers, org_register_payload


def test_pending_organization_cannot_search_fosters(client):
    reg = client.post("/auth/register/organization", json=org_register_payload())
    token = reg.json()["access_token"]  # org is 'pending' right after registering

    resp = client.get("/fosters", headers=auth_headers(token))

    assert resp.status_code == 403, resp.text


def test_admin_can_approve_organization(client, db_session, admin_token):
    from app.models.organization import Organization

    client.post("/auth/register/organization", json=org_register_payload())
    org = db_session.query(Organization).one()

    resp = client.patch(
        f"/admin/organizations/{org.id}/status",
        json={"approval_status": "approved"},
        headers=auth_headers(admin_token),
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["approval_status"] == "approved"


def test_approved_organization_can_search_fosters(client, approved_org_token):
    resp = client.get("/fosters", headers=auth_headers(approved_org_token))

    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), list)
