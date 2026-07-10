from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.deps import require_role
from ..database import get_db
from ..enums import UserRole
from ..models.organization import Organization
from ..models.user import User
from ..schemas.organization import OrganizationRead, OrganizationUpdate

router = APIRouter(prefix="/organizations", tags=["organizations"])


def _get_own_org(db: Session, user: User) -> Organization:
    org = db.query(Organization).filter(Organization.user_id == user.id).first()
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )
    return org


@router.get("/me", response_model=OrganizationRead)
def get_my_org(
    user: User = Depends(require_role(UserRole.organization)),
    db: Session = Depends(get_db),
):
    return _get_own_org(db, user)


@router.put("/me", response_model=OrganizationRead)
def update_my_org(
    data: OrganizationUpdate,
    user: User = Depends(require_role(UserRole.organization)),
    db: Session = Depends(get_db),
):
    org = _get_own_org(db, user)
    for key, value in data.model_dump().items():
        setattr(org, key, value)
    db.commit()
    db.refresh(org)
    return org
