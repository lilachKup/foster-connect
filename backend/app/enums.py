import enum


class UserRole(str, enum.Enum):
    foster = "foster"
    organization = "organization"
    admin = "admin"


class MaxFosterDuration(str, enum.Enum):
    depends_on_case = "depends_on_case"
    up_to_3_days = "up_to_3_days"
    up_to_1_week = "up_to_1_week"
    up_to_2_weeks = "up_to_2_weeks"
    up_to_1_month = "up_to_1_month"
    up_to_2_months = "up_to_2_months"


class ProfileStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    deleted = "deleted"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    suspended = "suspended"
