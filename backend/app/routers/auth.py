from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..core.deps import get_current_user
from ..core.security import create_access_token, hash_password, verify_password
from ..database import get_db
from ..enums import UserRole
from ..models.foster_profile import FosterProfile
from ..models.organization import Organization
from ..models.user import User
from ..schemas.auth import Token, UserRead
from ..schemas.foster import FosterRegister
from ..schemas.organization import OrganizationRegister

router = APIRouter(prefix="/auth", tags=["auth"])


def _create_user(db: Session, email: str, password: str, role: UserRole) -> User:
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    try:
        hashed = hash_password(password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    user = User(email=email, hashed_password=hashed, role=role)
    db.add(user)
    db.flush()  # assigns user.id without committing yet
    return user


@router.post("/register/foster", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_foster(data: FosterRegister, db: Session = Depends(get_db)):
    user = _create_user(db, data.account_email, data.password, UserRole.foster)
    profile_data = data.model_dump(exclude={"account_email", "password"})
    if not profile_data.get("email"):
        profile_data["email"] = data.account_email
    db.add(FosterProfile(user_id=user.id, **profile_data))
    db.commit()
    return Token(access_token=create_access_token(user.id, user.role.value))


@router.post(
    "/register/organization", response_model=Token, status_code=status.HTTP_201_CREATED
)
def register_organization(data: OrganizationRegister, db: Session = Depends(get_db)):
    user = _create_user(db, data.account_email, data.password, UserRole.organization)
    org_data = data.model_dump(exclude={"account_email", "password"})
    if not org_data.get("email"):
        org_data["email"] = data.account_email
    db.add(Organization(user_id=user.id, **org_data))
    db.commit()
    return Token(access_token=create_access_token(user.id, user.role.value))


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    # OAuth2PasswordRequestForm uses `username`; we treat it as the email.
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return Token(access_token=create_access_token(user.id, user.role.value))


@router.get("/me", response_model=UserRead)
def read_me(user: User = Depends(get_current_user)):
    return user
