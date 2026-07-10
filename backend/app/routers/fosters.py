from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..core.deps import require_approved_org_or_admin, require_role
from ..database import get_db
from ..enums import AvailabilityStatus, ProfileStatus, UserRole
from ..models.foster_profile import FosterProfile
from ..models.user import User
from ..schemas.foster import (
    AvailabilityUpdate,
    FosterProfileRead,
    FosterProfileUpdate,
)

router = APIRouter(prefix="/fosters", tags=["fosters"])


def _get_own_profile(db: Session, user: User) -> FosterProfile:
    profile = db.query(FosterProfile).filter(FosterProfile.user_id == user.id).first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Foster profile not found"
        )
    return profile


# ---- Foster: manage own profile -------------------------------------------

@router.get("/me", response_model=FosterProfileRead)
def get_my_profile(
    user: User = Depends(require_role(UserRole.foster)), db: Session = Depends(get_db)
):
    return _get_own_profile(db, user)


@router.put("/me", response_model=FosterProfileRead)
def update_my_profile(
    data: FosterProfileUpdate,
    user: User = Depends(require_role(UserRole.foster)),
    db: Session = Depends(get_db),
):
    profile = _get_own_profile(db, user)
    for key, value in data.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/me/availability", response_model=FosterProfileRead)
def update_my_availability(
    data: AvailabilityUpdate,
    user: User = Depends(require_role(UserRole.foster)),
    db: Session = Depends(get_db),
):
    profile = _get_own_profile(db, user)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(
    user: User = Depends(require_role(UserRole.foster)), db: Session = Depends(get_db)
):
    profile = _get_own_profile(db, user)
    profile.profile_status = ProfileStatus.deleted
    db.commit()


# ---- Organizations / admin: search fosters --------------------------------

@router.get("", response_model=list[FosterProfileRead])
def search_fosters(
    city: str | None = Query(default=None),
    nearby_city: str | None = Query(default=None),
    can_foster_dogs: bool | None = Query(default=None),
    can_foster_cats: bool | None = Query(default=None),
    max_dog_weight: int | None = Query(
        default=None, ge=0, description="Only fosters able to take a dog of at least this weight (kg)"
    ),
    availability_status: AvailabilityStatus | None = Query(default=None),
    emergency_foster_available: bool | None = Query(default=None),
    has_car: bool | None = Query(default=None),
    has_experience: bool | None = Query(
        default=None, description="Only fosters with previous experience filled in"
    ),
    _user: User = Depends(require_approved_org_or_admin),
    db: Session = Depends(get_db),
):
    q = db.query(FosterProfile).filter(
        FosterProfile.profile_status == ProfileStatus.active
    )

    if city:
        q = q.filter(FosterProfile.city.ilike(f"%{city}%"))
    if nearby_city:
        q = q.filter(FosterProfile.nearby_city.ilike(f"%{nearby_city}%"))
    if can_foster_dogs is not None:
        q = q.filter(FosterProfile.can_foster_dogs == can_foster_dogs)
    if can_foster_cats is not None:
        q = q.filter(FosterProfile.can_foster_cats == can_foster_cats)
    if max_dog_weight is not None:
        # A foster with no stated limit (NULL) is treated as "no maximum".
        q = q.filter(
            or_(
                FosterProfile.max_dog_weight_kg.is_(None),
                FosterProfile.max_dog_weight_kg >= max_dog_weight,
            )
        )
    if availability_status is not None:
        q = q.filter(FosterProfile.availability_status == availability_status)
    if emergency_foster_available is not None:
        q = q.filter(
            FosterProfile.emergency_foster_available == emergency_foster_available
        )
    if has_car is not None:
        q = q.filter(FosterProfile.has_car == has_car)
    if has_experience:
        q = q.filter(
            FosterProfile.previous_experience.isnot(None),
            FosterProfile.previous_experience != "",
        )

    return q.order_by(FosterProfile.updated_at.desc()).all()
