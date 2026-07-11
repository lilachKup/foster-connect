"""Shared helpers for building request payloads and auth headers in tests."""


def org_register_payload(**overrides):
    """A valid organization registration body. Override any field as needed.

    Includes one link (website_url) so the 'at least one link' rule passes.
    """
    payload = {
        "account_email": "org@example.com",
        "password": "orgpass123",
        "org_name": "Test Org",
        "contact_person": "Contact Person",
        "phone": "050-1234567",
        "website_url": "https://example.org",
        "city": "Tel Aviv",
        "street": "Herzl",
        "house_number": "1",
    }
    payload.update(overrides)
    return payload


def foster_register_payload(**overrides):
    """A valid foster registration body. Override any field as needed."""
    payload = {
        "account_email": "foster@example.com",
        "password": "fosterpass123",
        "full_name": "Foster Family",
        "city": "Tel Aviv",
    }
    payload.update(overrides)
    return payload


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
