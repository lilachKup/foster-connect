from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from ..enums import ApprovalStatus


class OrganizationBase(BaseModel):
    org_name: str
    contact_person: str
    phone: str
    email: EmailStr | None = None
    website_url: str | None = None
    instagram_url: str | None = None
    other_link: str | None = None
    city: str
    street: str
    house_number: str
    zip_code: str


class _RequireOneLink(BaseModel):
    """At least one of website/Instagram/other link is required, to help
    verify the organization is a registered nonprofit."""

    @model_validator(mode="after")
    def _check_at_least_one_link(self):
        if not (self.website_url or self.instagram_url or self.other_link):
            raise ValueError(
                "Provide at least one of: website, Instagram, or another link"
            )
        return self


class OrganizationRegister(OrganizationBase, _RequireOneLink):
    account_email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class OrganizationUpdate(OrganizationBase, _RequireOneLink):
    """Fields an organization can edit about itself."""


class OrganizationRead(OrganizationBase):
    id: int
    approval_status: ApprovalStatus
    admin_notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


class OrgStatusUpdate(BaseModel):
    approval_status: ApprovalStatus
    admin_notes: str | None = None
