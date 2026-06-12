"""Permission and role management."""
from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
    """User roles."""
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class Permission(str, Enum):
    """System permissions."""
    # People
    VIEW_PEOPLE = "view_people"
    CREATE_PERSON = "create_person"
    UPDATE_PERSON = "update_person"
    DELETE_PERSON = "delete_person"

    # Photos
    VIEW_PHOTOS = "view_photos"
    UPLOAD_PHOTO = "upload_photo"
    DELETE_PHOTO = "delete_photo"

    # Events
    VIEW_EVENTS = "view_events"

    # Devices
    VIEW_DEVICES = "view_devices"
    MANAGE_DEVICES = "manage_devices"
    SEND_COMMANDS = "send_commands"

    # System
    OPEN_DOOR = "open_door"
    REBOOT_DEVICE = "reboot_device"
    VIEW_LOGS = "view_logs"
    MANAGE_BACKUPS = "manage_backups"

    # Users
    VIEW_USERS = "view_users"
    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"

    # Audit
    VIEW_AUDIT = "view_audit"


# Role to permissions mapping
ROLE_PERMISSIONS: dict[UserRole, set[Permission]] = {
    UserRole.ADMIN: set(Permission),  # All permissions
    UserRole.OPERATOR: {
        Permission.VIEW_PEOPLE,
        Permission.CREATE_PERSON,
        Permission.UPDATE_PERSON,
        Permission.VIEW_PHOTOS,
        Permission.UPLOAD_PHOTO,
        Permission.VIEW_EVENTS,
        Permission.VIEW_DEVICES,
        Permission.SEND_COMMANDS,
        Permission.OPEN_DOOR,
        Permission.VIEW_LOGS,
    },
    UserRole.VIEWER: {
        Permission.VIEW_PEOPLE,
        Permission.VIEW_PHOTOS,
        Permission.VIEW_EVENTS,
        Permission.VIEW_DEVICES,
    },
}


def has_permission(role: UserRole, permission: Permission) -> bool:
    """Check if a role has a specific permission."""
    return permission in ROLE_PERMISSIONS.get(role, set())
