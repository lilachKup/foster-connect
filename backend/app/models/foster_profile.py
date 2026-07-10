from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from ..enums import MaxFosterDuration, ProfileStatus


class FosterProfile(Base):
    __tablename__ = "foster_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(120), index=True)
    nearby_city: Mapped[str | None] = mapped_column(String(120), index=True)

    can_foster_dogs: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_foster_cats: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    max_dog_weight_kg: Mapped[int | None] = mapped_column(Integer)

    has_children: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_other_dogs: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_other_cats: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    other_pets_details: Mapped[str | None] = mapped_column(Text)

    has_car: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    previous_experience: Mapped[str | None] = mapped_column(Text)

    max_foster_duration: Mapped[MaxFosterDuration | None] = mapped_column(
        SAEnum(MaxFosterDuration, name="max_foster_duration")
    )
    emergency_foster_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    notes: Mapped[str | None] = mapped_column(Text)

    profile_status: Mapped[ProfileStatus] = mapped_column(
        SAEnum(ProfileStatus, name="profile_status"),
        default=ProfileStatus.active,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="foster_profile")
