from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ..enums import AvailabilityStatus, ProfileStatus


class FosterProfileBase(BaseModel):
    full_name: str
    phone: str | None = None
    email: EmailStr | None = None
    city: str | None = None
    nearby_city: str | None = None

    can_foster_dogs: bool = False
    can_foster_cats: bool = False
    max_dog_weight_kg: int | None = Field(default=None, ge=0)

    has_children: bool = False
    has_other_dogs: bool = False
    has_other_cats: bool = False
    other_pets_details: str | None = None

    has_car: bool = False
    previous_experience: str | None = None

    availability_status: AvailabilityStatus = AvailabilityStatus.available
    max_foster_duration_days: int | None = Field(default=None, ge=0)
    emergency_foster_available: bool = False

    notes: str | None = None


class FosterRegister(FosterProfileBase):
    account_email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class FosterProfileUpdate(FosterProfileBase):
    """Full replacement of the editable profile fields."""


class AvailabilityUpdate(BaseModel):
    availability_status: AvailabilityStatus | None = None
    profile_status: ProfileStatus | None = None


class FosterProfileRead(FosterProfileBase):
    id: int
    profile_status: ProfileStatus

    model_config = ConfigDict(from_attributes=True)
