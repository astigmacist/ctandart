from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import engine
from app.models import User, WarehouseZone
from app.models.domain import BonusTier, Cashbox
from app.models.enums import RoleCode, WarehouseZoneCode


SEED_USERS = [
    ("owner@ctandart.local", "Owner2026!", "Руководитель CtandART", RoleCode.OWNER),
    ("admin@ctandart.local", "Admin2026!", "Администратор системы", RoleCode.ADMIN),
    (
        "warehouse@ctandart.local",
        "Warehouse2026!",
        "Заведующий складом",
        RoleCode.WAREHOUSE_MANAGER,
    ),
    ("manager@ctandart.local", "Manager2026!", "Менеджер", RoleCode.MANAGER),
    ("designer@ctandart.local", "Designer2026!", "Дизайнер", RoleCode.DESIGNER),
    ("production@ctandart.local", "Production2026!", "Печатник / производство", RoleCode.PRODUCTION),
    ("installer@ctandart.local", "Installer2026!", "Монтажник", RoleCode.INSTALLER),
    ("store@ctandart.local", "Store2026!", "Магазин / кассир", RoleCode.STORE_CASHIER),
    ("finance@ctandart.local", "Finance2026!", "Финансы", RoleCode.FINANCE),
]

SEED_ZONES = [
    (WarehouseZoneCode.MAIN, "Главный склад"),
    (WarehouseZoneCode.PRODUCTION, "Производство / офис"),
    (WarehouseZoneCode.STORE, "Магазин"),
]

SEED_BONUS_TIERS = [
    ("silver", "Silver", 0, 3, 20),
    ("gold", "Gold", 500_000, 5, 30),
    ("vip", "VIP", 1_500_000, 7, 40),
]

SEED_CASHBOXES = [
    ("office_cashbox", "Касса офиса", WarehouseZoneCode.PRODUCTION),
    ("store_cashbox", "Касса магазина", WarehouseZoneCode.STORE),
]


def init_db(db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    if not settings.seed_demo_accounts:
        return
    seed_warehouse_zones(db)
    db.flush()
    seed_bonus_tiers(db)
    db.flush()
    seed_cashboxes(db)
    seed_users(db)
    db.commit()


def seed_users(db: Session) -> None:
    for email, password, full_name, role in SEED_USERS:
        existing = db.query(User).filter(User.email == email).one_or_none()
        if existing:
            continue
        db.add(
            User(
                email=email,
                full_name=full_name,
                role=role,
                password_hash=hash_password(password),
                is_active=True,
            )
        )


def seed_warehouse_zones(db: Session) -> None:
    for code, name in SEED_ZONES:
        existing = db.query(WarehouseZone).filter(WarehouseZone.code == code).one_or_none()
        if existing:
            continue
        db.add(WarehouseZone(code=code, name=name))


def seed_bonus_tiers(db: Session) -> None:
    for code, name, min_paid_amount, accrual_percent, max_redemption_percent in SEED_BONUS_TIERS:
        existing = db.query(BonusTier).filter(BonusTier.code == code).one_or_none()
        if existing:
            continue
        db.add(
            BonusTier(
                code=code,
                name=name,
                min_paid_amount=min_paid_amount,
                accrual_percent=accrual_percent,
                max_redemption_percent=max_redemption_percent,
            )
        )


def seed_cashboxes(db: Session) -> None:
    zones = {zone.code: zone for zone in db.query(WarehouseZone).all()}
    for code, name, zone_code in SEED_CASHBOXES:
        existing = db.query(Cashbox).filter(Cashbox.code == code).one_or_none()
        if existing:
            continue
        db.add(Cashbox(code=code, name=name, zone_id=zones[zone_code].id))
