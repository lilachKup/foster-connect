from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..core.deps import require_role
from ..database import get_db
from ..enums import ApprovalStatus, ProfileStatus, UserRole
from ..models.foster_profile import FosterProfile
from ..models.organization import Organization
from ..models.user import User
from ..schemas.foster import AdminFosterRead, AvailabilityUpdate, FosterProfileRead
from ..schemas.organization import OrganizationRead, OrgStatusUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/organizations", response_model=list[OrganizationRead])
def list_organizations(
    status_filter: ApprovalStatus | None = Query(default=None, alias="status"),
    _admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    q = db.query(Organization)
    if status_filter is not None:
        q = q.filter(Organization.approval_status == status_filter)
    return q.order_by(Organization.created_at.desc()).all()


@router.patch("/organizations/{org_id}/status", response_model=OrganizationRead)
def set_organization_status(
    org_id: int,
    data: OrgStatusUpdate,
    _admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )
    org.approval_status = data.approval_status
    if data.admin_notes is not None:
        org.admin_notes = data.admin_notes
    db.commit()
    db.refresh(org)
    return org


# ---- Admin: manage all foster profiles ------------------------------------

@router.get("/fosters", response_model=list[AdminFosterRead])
def list_all_fosters(
    status_filter: ProfileStatus | None = Query(default=None, alias="status"),
    email: str | None = Query(default=None),
    city: str | None = Query(default=None),
    can_foster_dogs: bool | None = Query(default=None),
    can_foster_cats: bool | None = Query(default=None),
    max_dog_weight: int | None = Query(default=None, ge=0),
    emergency_foster_available: bool | None = Query(default=None),
    has_car: bool | None = Query(default=None),
    has_experience: bool | None = Query(default=None),
    _admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    q = db.query(FosterProfile, User).join(User, FosterProfile.user_id == User.id)

    if status_filter is not None:
        q = q.filter(FosterProfile.profile_status == status_filter)
    if email:
        q = q.filter(
            or_(
                FosterProfile.email.ilike(f"%{email}%"),
                User.email.ilike(f"%{email}%"),
            )
        )
    if city:
        q = q.filter(
            or_(
                FosterProfile.city.ilike(f"%{city}%"),
                FosterProfile.nearby_city.ilike(f"%{city}%"),
            )
        )
    if can_foster_dogs is not None:
        q = q.filter(FosterProfile.can_foster_dogs == can_foster_dogs)
    if can_foster_cats is not None:
        q = q.filter(FosterProfile.can_foster_cats == can_foster_cats)
    if max_dog_weight is not None:
        q = q.filter(
            or_(
                FosterProfile.max_dog_weight_kg.is_(None),
                FosterProfile.max_dog_weight_kg >= max_dog_weight,
            )
        )
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

    rows = q.order_by(FosterProfile.updated_at.desc()).all()
    result = []
    for profile, user in rows:
        data = FosterProfileRead.model_validate(profile).model_dump()
        data["account_email"] = user.email
        result.append(data)
    return result


@router.patch("/fosters/{foster_id}/status", response_model=FosterProfileRead)
def set_foster_status(
    foster_id: int,
    data: AvailabilityUpdate,
    _admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    profile = db.get(FosterProfile, foster_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Foster profile not found"
        )
    if data.profile_status is not None:
        profile.profile_status = data.profile_status
    db.commit()
    db.refresh(profile)
    return profile
