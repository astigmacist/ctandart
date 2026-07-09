from fastapi import APIRouter

from app.core.deps import CurrentUser
from app.models.enums import OrderStatus, RoleCode, WarehouseZoneCode
from app.services.navigation import ROLE_LABELS, role_workspace

router = APIRouter()


@router.get("/bootstrap")
def bootstrap_catalog() -> dict[str, list[str]]:
    return {
        "roles": [role.value for role in RoleCode],
        "warehouse_zones": [zone.value for zone in WarehouseZoneCode],
        "order_statuses": [status.value for status in OrderStatus],
        "modules": [
            "dashboard",
            "crm",
            "orders",
            "production",
            "inventory",
            "store",
            "payments",
            "loyalty",
            "gamification",
            "reports",
            "audit",
            "settings",
        ],
    }


@router.get("/navigation")
def navigation(current_user: CurrentUser) -> dict:
    return role_workspace(current_user.role)


@router.get("/roles")
def roles() -> list[dict[str, str]]:
    return [{"code": role.value, "label": ROLE_LABELS[role]} for role in RoleCode]
