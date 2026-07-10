from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..core.deps import require_role
from ..database import get_db
from ..enums import ApprovalStatus, UserRole
from ..models.organization import Organization
from ..models.user import User
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
