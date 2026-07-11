"""One full backend journey through the real API, end to end:

register org (pending) -> register foster -> admin approves org ->
org finds the foster -> admin suspends the foster -> org no longer finds them.
"""

from app.models.foster_profile import FosterProfile
from app.models.organization import Organization
from tests.helpers import auth_headers, foster_register_payload, org_register_payload


def test_full_org_and_foster_lifecycle(client, db_session, admin_token):
    # 1. Organization registers -> starts pending.
    org_reg = client.post("/auth/register/organization", json=org_register_payload())
    assert org_reg.status_code == 201, org_reg.text
    org_token = org_reg.json()["access_token"]

    # 2. A foster family registers.
    foster_reg = client.post(
        "/auth/register/foster",
        json=foster_register_payload(full_name="Journey Family"),
    )
    assert foster_reg.status_code == 201, foster_reg.text

    # 3. While pending, the org cannot search.
    assert client.get("/fosters", headers=auth_headers(org_token)).status_code == 403

    # 4. Admin approves the organization.
    org = db_session.query(Organization).one()
    approve = client.patch(
        f"/admin/organizations/{org.id}/status",
        json={"approval_status": "approved"},
        headers=auth_headers(admin_token),
    )
    assert approve.status_code == 200, approve.text

    # 5. The approved org searches and finds the foster.
    found = client.get("/fosters", headers=auth_headers(org_token))
    assert found.status_code == 200, found.text
    assert "Journey Family" in {f["full_name"] for f in found.json()}

    # 6. Admin suspends the foster.
    foster = db_session.query(FosterProfile).one()
    suspend = client.patch(
        f"/admin/fosters/{foster.id}/status",
        json={"profile_status": "suspended"},
        headers=auth_headers(admin_token),
    )
    assert suspend.status_code == 200, suspend.text

    # 7. The org searches again -> the suspended foster is gone.
    after = client.get("/fosters", headers=auth_headers(org_token))
    assert after.status_code == 200, after.text
    assert "Journey Family" not in {f["full_name"] for f in after.json()}
