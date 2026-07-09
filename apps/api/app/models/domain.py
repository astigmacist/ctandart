from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid as SAUuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    AuditSeverity,
    LoyaltyEventType,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    RoleCode,
    StockMovementType,
    TaskStatus,
    TaskType,
    WarehouseZoneCode,
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    full_name: Mapped[str] = mapped_column(String(180), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True)
    email: Mapped[str | None] = mapped_column(String(180), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleCode] = mapped_column(Enum(RoleCode), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    production_tasks: Mapped[list["ProductionTask"]] = relationship(back_populates="assignee")


class BonusTier(Base, TimestampMixin):
    __tablename__ = "bonus_tiers"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    min_paid_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    accrual_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    max_redemption_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    clients: Mapped[list["Client"]] = relationship(back_populates="bonus_tier")


class Client(Base, TimestampMixin):
    __tablename__ = "clients"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    display_name: Mapped[str] = mapped_column(String(220), nullable=False, index=True)
    company_name: Mapped[str | None] = mapped_column(String(220), index=True)
    phone: Mapped[str | None] = mapped_column(String(32), index=True)
    email: Mapped[str | None] = mapped_column(String(180))
    address: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)
    bonus_tier_id: Mapped[UUID | None] = mapped_column(ForeignKey("bonus_tiers.id"))
    bonus_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    debt_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)

    bonus_tier: Mapped["BonusTier | None"] = relationship(back_populates="clients")
    orders: Mapped[list["Order"]] = relationship(back_populates="client")


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    client_id: Mapped[UUID] = mapped_column(ForeignKey("clients.id"), nullable=False)
    manager_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.NEW, nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    estimated_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    debt_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    is_financially_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_operationally_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)

    client: Mapped["Client"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
    tasks: Mapped[list["ProductionTask"]] = relationship(back_populates="order")
    payments: Mapped[list["Payment"]] = relationship(back_populates="order")
    files: Mapped[list["OrderFile"]] = relationship(back_populates="order")


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=1)
    unit: Mapped[str] = mapped_column(String(24), default="шт")
    width_mm: Mapped[int | None] = mapped_column(Integer)
    height_mm: Mapped[int | None] = mapped_column(Integer)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    estimated_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)

    order: Mapped["Order"] = relationship(back_populates="items")


class OrderFile(Base, TimestampMixin):
    __tablename__ = "order_files"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    uploaded_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_client_visible: Mapped[bool] = mapped_column(Boolean, default=False)
    comment: Mapped[str | None] = mapped_column(Text)

    order: Mapped["Order"] = relationship(back_populates="files")


class ProductionTask(Base, TimestampMixin):
    __tablename__ = "production_tasks"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    order_id: Mapped[UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    assignee_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    task_type: Mapped[TaskType] = mapped_column(Enum(TaskType), nullable=False, index=True)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.TODO, nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    planned_minutes: Mapped[int | None] = mapped_column(Integer)
    actual_minutes: Mapped[int | None] = mapped_column(Integer)
    defect_count: Mapped[int] = mapped_column(Integer, default=0)

    order: Mapped["Order"] = relationship(back_populates="tasks")
    assignee: Mapped["User | None"] = relationship(back_populates="production_tasks")


class WarehouseZone(Base, TimestampMixin):
    __tablename__ = "warehouse_zones"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    code: Mapped[WarehouseZoneCode] = mapped_column(
        Enum(WarehouseZoneCode), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    balances: Mapped[list["StockBalance"]] = relationship(back_populates="zone")


class Material(Base, TimestampMixin):
    __tablename__ = "materials"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(220), nullable=False, index=True)
    sku: Mapped[str | None] = mapped_column(String(80), unique=True)
    category: Mapped[str | None] = mapped_column(String(120), index=True)
    unit: Mapped[str] = mapped_column(String(24), default="шт")
    min_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    average_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    balances: Mapped[list["StockBalance"]] = relationship(back_populates="material")


class StockBalance(Base, TimestampMixin):
    __tablename__ = "stock_balances"
    __table_args__ = (UniqueConstraint("material_id", "zone_id", name="uq_material_zone"),)

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    material_id: Mapped[UUID] = mapped_column(ForeignKey("materials.id"), nullable=False)
    zone_id: Mapped[UUID] = mapped_column(ForeignKey("warehouse_zones.id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    reserved_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)

    material: Mapped["Material"] = relationship(back_populates="balances")
    zone: Mapped["WarehouseZone"] = relationship(back_populates="balances")


class StockMovement(Base, TimestampMixin):
    __tablename__ = "stock_movements"
    __table_args__ = (
        Index("ix_stock_movement_material_created", "material_id", "created_at"),
        Index("ix_stock_movement_order_created", "order_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    movement_type: Mapped[StockMovementType] = mapped_column(
        Enum(StockMovementType), nullable=False, index=True
    )
    material_id: Mapped[UUID] = mapped_column(ForeignKey("materials.id"), nullable=False)
    from_zone_id: Mapped[UUID | None] = mapped_column(ForeignKey("warehouse_zones.id"))
    to_zone_id: Mapped[UUID | None] = mapped_column(ForeignKey("warehouse_zones.id"))
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id"))
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    requested_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    issued_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    accepted_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    approved_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[str | None] = mapped_column(String(255))
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Cashbox(Base, TimestampMixin):
    __tablename__ = "cashboxes"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    zone_id: Mapped[UUID | None] = mapped_column(ForeignKey("warehouse_zones.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id"))
    cashbox_id: Mapped[UUID | None] = mapped_column(ForeignKey("cashboxes.id"))
    method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.ACTIVE, nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    accepted_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    voided_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    void_reason: Mapped[str | None] = mapped_column(Text)
    voided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    order: Mapped["Order | None"] = relationship(back_populates="payments")


class LoyaltyLedger(Base, TimestampMixin):
    __tablename__ = "loyalty_ledger"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    client_id: Mapped[UUID] = mapped_column(ForeignKey("clients.id"), nullable=False)
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id"))
    event_type: Mapped[LoyaltyEventType] = mapped_column(Enum(LoyaltyEventType), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    balance_after: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    created_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[str | None] = mapped_column(Text)


class GamificationEvent(Base, TimestampMixin):
    __tablename__ = "gamification_events"

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id"))
    task_id: Mapped[UUID | None] = mapped_column(ForeignKey("production_tasks.id"))
    event_code: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    points: Mapped[int] = mapped_column(Integer, default=0)
    period_key: Mapped[str] = mapped_column(String(20), index=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_entity", "entity_type", "entity_id"),
        Index("ix_audit_actor_created", "actor_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(SAUuid(as_uuid=True), primary_key=True, default=uuid4)
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    severity: Mapped[AuditSeverity] = mapped_column(
        Enum(AuditSeverity), default=AuditSeverity.INFO, nullable=False
    )
    old_values: Mapped[dict | None] = mapped_column(JSON)
    new_values: Mapped[dict | None] = mapped_column(JSON)
    reason: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(255))
