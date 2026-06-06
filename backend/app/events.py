"""
Event system — provides an event bus for triggering Viktor workflows.
When domain events occur (new lead, deal stage change, task completion),
this module logs them and can forward them to Viktor's webhook URL.
"""
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

VIKTOR_WEBHOOK_URL = os.getenv("VIKTOR_WEBHOOK_URL", "")

# In-memory event log for simple persistence.
# In production, use a proper message queue (Celery + Redis / RabbitMQ).
_event_log: list[dict[str, Any]] = []


def fire_event(event_type: str, payload: dict[str, Any]) -> Optional[str]:
    """
    Fire a domain event. Logs it locally and attempts to forward
    to Viktor's webhook URL if configured.

    Returns the event ID or None on failure.
    """
    event_id = str(uuid.uuid4())
    event = {
        "id": event_id,
        "event_type": event_type,
        "payload": payload,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
    }
    _event_log.append(event)

    # Forward to Viktor if configured
    if VIKTOR_WEBHOOK_URL:
        try:
            with httpx.Client(timeout=10) as client:
                resp = client.post(
                    VIKTOR_WEBHOOK_URL,
                    json={"event_id": event_id, "event_type": event_type, "payload": payload},
                )
                if resp.is_success:
                    event["status"] = "delivered"
                else:
                    event["status"] = f"failed: HTTP {resp.status_code}"
        except Exception as exc:
            event["status"] = f"failed: {exc}"
    else:
        event["status"] = "logged (no webhook URL configured)"

    return event_id


def get_event_log(limit: int = 50) -> list[dict[str, Any]]:
    """Return the most recent events."""
    return list(reversed(_event_log))[:limit]


def clear_event_log() -> None:
    """Clear the event log (for testing/admin)."""
    _event_log.clear()


# ─── Standard event types ───────────────────────────────────────────────────

EVENT_LEAD_CREATED = "lead_created"
EVENT_LEAD_RESPONDED = "lead_responded"
EVENT_DEAL_STAGE_CHANGED = "deal_stage_changed"
EVENT_TASK_COMPLETED = "task_completed"
EVENT_PROPERTY_ANALYZED = "property_analyzed"