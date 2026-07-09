from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.domain import StockMovement
from app.models.enums import AuditSeverity, StockMovementType
from app.services.audit import write_audit_log


def register_stock_movement(
    db: Session,
    *,
    movement_type: StockMovementType,
    material_id: UUID,
    quantity: Decimal,
    actor_id: UUID,
    from_zone_id: UUID | None = None,
    to_zone_id: UUID | None = None,
    order_id: UUID | None = None,
    reason: str | None = None,
    requires_approval: bool = False,
) -> StockMovement:
    movement = StockMovement(
        movement_type=movement_type,
        material_id=material_id,
        from_zone_id=from_zone_id,
        to_zone_id=to_zone_id,
        order_id=order_id,
        quantity=quantity,
        requested_by_id=actor_id,
        reason=reason,
        requires_approval=requires_approval,
    )
    db.add(movement)
    write_audit_log(
        db,
        action=f"stock.{movement_type.value}",
        entity_type="stock_movement",
        entity_id=movement.id,
        actor_id=actor_id,
        severity=AuditSeverity.WARNING if requires_approval else AuditSeverity.INFO,
        new_values={
            "material_id": str(material_id),
            "quantity": str(quantity),
            "from_zone_id": str(from_zone_id) if from_zone_id else None,
            "to_zone_id": str(to_zone_id) if to_zone_id else None,
            "order_id": str(order_id) if order_id else None,
        },
        reason=reason,
    )
    return movement
