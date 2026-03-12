import hashlib
import json
from typing import Dict, Any


def _normalize(value: Any) -> str:
    """
    Normalize values before hashing.
    """
    if value is None:
        return ""

    if isinstance(value, float):
        return f"{value:.6f}"

    return str(value).strip().lower()


def build_event_fingerprint(event: Dict[str, Any]) -> str:
    """
    Create deterministic fingerprint for a sustainability event.
    """

    fields = [
        _normalize(event.get("facility_id")),
        _normalize(event.get("metric_type")),
        _normalize(event.get("event_timestamp")),
        _normalize(event.get("process_line")),
        _normalize(event.get("batch_id")),
        _normalize(event.get("order_id")),
        _normalize(event.get("asset_id")),
        _normalize(event.get("value")),
        _normalize(event.get("unit")),
    ]

    key = "|".join(fields)

    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def build_idempotency_key(event: Dict[str, Any]) -> str:
    """
    Generate idempotency key for ingestion replay safety.
    """

    source = _normalize(event.get("source_type"))
    source_event_id = _normalize(event.get("source_event_id"))
    timestamp = _normalize(event.get("event_timestamp"))

    base = f"{source}|{source_event_id}|{timestamp}"

    return hashlib.md5(base.encode("utf-8")).hexdigest()


def canonical_event_to_fingerprint(event) -> str:
    """
    Helper for CanonicalEvent objects.
    """

    return build_event_fingerprint(event.to_dict())


def canonical_event_to_idempotency(event) -> str:
    """
    Helper for CanonicalEvent objects.
    """

    return build_idempotency_key(event.to_dict())
