from uuid import UUID

from sqlalchemy.orm import Session

from app.models.domain import GamificationEvent


def award_points(
    db: Session,
    *,
    user_id: UUID,
    event_code: str,
    points: int,
    period_key: str,
    order_id: UUID | None = None,
    task_id: UUID | None = None,
    details: dict | None = None,
) -> GamificationEvent:
    event = GamificationEvent(
        user_id=user_id,
        order_id=order_id,
        task_id=task_id,
        event_code=event_code,
        points=points,
        period_key=period_key,
        details=details or {},
    )
    db.add(event)
    return event
