import enum


class UserRole(str, enum.Enum):
    foster = "foster"
    organization = "organization"
    admin = "admin"


class AvailabilityStatus(str, enum.Enum):
    available = "available"
    unavailable = "unavailable"


class ProfileStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    deleted = "deleted"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    suspended = "suspended"
