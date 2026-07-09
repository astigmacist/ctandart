from enum import StrEnum


class RoleCode(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    WAREHOUSE_MANAGER = "warehouse_manager"
    MANAGER = "manager"
    DESIGNER = "designer"
    PRODUCTION = "production"
    INSTALLER = "installer"
    STORE_CASHIER = "store_cashier"
    FINANCE = "finance"
    CLIENT = "client"


class OrderStatus(StrEnum):
    NEW = "new"
    ACCEPTED = "accepted"
    DESIGN = "design"
    APPROVAL = "approval"
    PRODUCTION_READY = "production_ready"
    IN_PRODUCTION = "in_production"
    READY = "ready"
    DELIVERED_OR_INSTALLED = "delivered_or_installed"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class TaskType(StrEnum):
    DESIGN = "design"
    PRINT = "print"
    CUT = "cut"
    ASSEMBLY = "assembly"
    INSTALLATION = "installation"
    OTHER = "other"


class TaskStatus(StrEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    WAITING_APPROVAL = "waiting_approval"
    DONE = "done"
    REWORK = "rework"
    CANCELLED = "cancelled"


class WarehouseZoneCode(StrEnum):
    MAIN = "main"
    PRODUCTION = "production"
    STORE = "store"


class StockMovementType(StrEnum):
    RECEIPT = "receipt"
    TRANSFER = "transfer"
    RESERVE = "reserve"
    RELEASE_RESERVE = "release_reserve"
    ISSUE_TO_ORDER = "issue_to_order"
    RETURN = "return"
    WASTE = "waste"
    INVENTORY_ADJUSTMENT = "inventory_adjustment"


class PaymentMethod(StrEnum):
    CASH = "cash"
    KASPI_QR = "kaspi_qr"
    BANK = "bank"
    TRANSFER = "transfer"
    BONUS = "bonus"
    DEBT = "debt"


class PaymentStatus(StrEnum):
    ACTIVE = "active"
    VOIDED = "voided"
    REFUNDED = "refunded"


class LoyaltyEventType(StrEnum):
    ACCRUAL = "accrual"
    REDEMPTION = "redemption"
    ADVANCE = "advance"
    ADJUSTMENT = "adjustment"
    EXPIRE = "expire"


class AuditSeverity(StrEnum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
