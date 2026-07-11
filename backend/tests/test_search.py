"""Foster search: only active profiles appear, and the dog-weight filter works."""

from app.enums import ProfileStatus
from tests.helpers import auth_headers


def _search(client, token, **params):
    resp = client.get("/fosters", headers=auth_headers(token), params=params)
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_active_foster_appears_in_search(client, approved_org_token, make_foster):
    make_foster("active@example.com", full_name="Active Family")

    results = _search(client, approved_org_token)

    names = {f["full_name"] for f in results}
    assert "Active Family" in names


def test_non_active_fosters_are_excluded(client, approved_org_token, make_foster):
    make_foster("active@example.com", full_name="Active Family")
    make_foster("paused@example.com", status=ProfileStatus.paused, full_name="Paused Family")
    make_foster("suspended@example.com", status=ProfileStatus.suspended, full_name="Suspended Family")
    make_foster("deleted@example.com", status=ProfileStatus.deleted, full_name="Deleted Family")

    results = _search(client, approved_org_token)

    names = {f["full_name"] for f in results}
    assert names == {"Active Family"}


def test_dog_weight_filter(client, approved_org_token, make_foster):
    # A foster who can take up to 10kg, one up to 30kg, one with no stated limit.
    make_foster("small@example.com", full_name="Up To 10", max_dog_weight_kg=10)
    make_foster("big@example.com", full_name="Up To 30", max_dog_weight_kg=30)
    make_foster("nolimit@example.com", full_name="No Limit")  # max_dog_weight_kg = None

    # Need someone able to take a 20kg dog -> the 30kg foster and the no-limit one,
    # but not the 10kg one.
    results = _search(client, approved_org_token, max_dog_weight=20)

    names = {f["full_name"] for f in results}
    assert names == {"Up To 30", "No Limit"}
