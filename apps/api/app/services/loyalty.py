from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.domain import Client, LoyaltyLedger
from app.models.enums import AuditSeverity, LoyaltyEventType
from app.services.audit import write_audit_log


def add_loyalty_event(
    db: Session,
    *,
    client: Client,
    event_type: LoyaltyEventType,
    amount: Decimal,
    actor_id: UUID,
    order_id: UUID | None = None,
    reason: str | None = None,
) -> LoyaltyLedger:
    client.bonus_balance += amount
    ledger = LoyaltyLedger(
        client_id=client.id,
        order_id=order_id,
        event_type=event_type,
        amount=amount,
        balance_after=client.bonus_balance,
        created_by_id=actor_id,
        reason=reason,
    )
    db.add(ledger)
    write_audit_log(
        db,
        action=f"loyalty.{event_type.value}",
        entity_type="client",
        entity_id=client.id,
        actor_id=actor_id,
        severity=AuditSeverity.WARNING
        if event_type in {LoyaltyEventType.ADVANCE, LoyaltyEventType.ADJUSTMENT}
        else AuditSeverity.INFO,
        new_values={"amount": str(amount), "balance_after": str(client.bonus_balance)},
        reason=reason,
    )
    return ledger
