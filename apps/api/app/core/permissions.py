from enum import StrEnum

from app.models.enums import RoleCode, WarehouseZoneCode


class Permission(StrEnum):
    VIEW_ALL_INVENTORY = "view_all_inventory"
    VIEW_PRODUCTION_INVENTORY = "view_production_inventory"
    VIEW_STORE_INVENTORY = "view_store_inventory"
    MANAGE_INVENTORY = "manage_inventory"
    APPROVE_STOCK_EXCEPTION = "approve_stock_exception"
    VIEW_MARGIN = "view_margin"
    VIEW_PAYROLL = "view_payroll"
    MANAGE_LOYALTY_ADVANCE = "manage_loyalty_advance"
    VOID_PAYMENT = "void_payment"
    VIEW_AUDIT = "view_audit"


ROLE_PERMISSIONS: dict[RoleCode, set[Permission]] = {
    RoleCode.OWNER: set(Permission),
    RoleCode.ADMIN: set(Permission),
    RoleCode.WAREHOUSE_MANAGER: {
        Permission.VIEW_ALL_INVENTORY,
        Permission.MANAGE_INVENTORY,
        Permission.APPROVE_STOCK_EXCEPTION,
        Permission.VIEW_AUDIT,
    },
    RoleCode.MANAGER: {
        Permission.VIEW_PRODUCTION_INVENTORY,
    },
    RoleCode.DESIGNER: set(),
    RoleCode.PRODUCTION: {
        Permission.VIEW_PRODUCTION_INVENTORY,
    },
    RoleCode.INSTALLER: set(),
    RoleCode.STORE_CASHIER: {
        Permission.VIEW_STORE_INVENTORY,
    },
    RoleCode.FINANCE: {
        Permission.VOID_PAYMENT,
        Permission.VIEW_AUDIT,
    },
    RoleCode.CLIENT: set(),
}


def can_view_zone(role: RoleCode, zone: WarehouseZoneCode) -> bool:
    permissions = ROLE_PERMISSIONS.get(role, set())
    if Permission.VIEW_ALL_INVENTORY in permissions:
        return True
    if zone == WarehouseZoneCode.PRODUCTION:
        return Permission.VIEW_PRODUCTION_INVENTORY in permissions
    if zone == WarehouseZoneCode.STORE:
        return Permission.VIEW_STORE_INVENTORY in permissions
    return False


def has_permission(role: RoleCode, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
