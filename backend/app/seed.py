"""Create the initial admin account. Run with: python -m app.seed"""

from .config import settings
from .core.security import hash_password
from .database import Base, SessionLocal, engine
from .enums import UserRole
from .models.user import User


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.admin_email).first()
        if existing:
            print(f"Admin already exists: {settings.admin_email}")
            return
        admin = User(
            email=settings.admin_email,
            hashed_password=hash_password(settings.admin_password),
            role=UserRole.admin,
        )
        db.add(admin)
        db.commit()
        print(f"Created admin account: {settings.admin_email} / {settings.admin_password}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
