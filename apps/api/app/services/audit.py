from uuid import UUID

from sqlalchemy.orm import Session

from app.models.domain import AuditLog
from app.models.enums import AuditSeverity


def write_audit_log(
    db: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: str | UUID,
    actor_id: UUID | None = None,
    severity: AuditSeverity = AuditSeverity.INFO,
    old_values: dict | None = None,
    new_values: dict | None = None,
    reason: str | None = None,
) -> AuditLog:
    log = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        severity=severity,
        old_values=old_values,
        new_values=new_values,
        reason=reason,
    )
    db.add(log)
    return log
