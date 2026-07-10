from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from ..database import get_db
from ..enums import ApprovalStatus, UserRole
from ..models.organization import Organization
from ..models.user import User
from .security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise _credentials_exc
    except JWTError:
        raise _credentials_exc

    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        raise _credentials_exc
    return user


def require_role(*roles: UserRole):
    """Dependency factory: allow only users whose role is in `roles`."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return user

    return checker


def require_approved_org_or_admin(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> User:
    """Allow admins, and organizations whose approval_status is 'approved'."""
    if user.role == UserRole.admin:
        return user
    if user.role == UserRole.organization:
        org = db.query(Organization).filter(Organization.user_id == user.id).first()
        if org and org.approval_status == ApprovalStatus.approved:
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organization must be approved before searching fosters",
        )
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
    )
