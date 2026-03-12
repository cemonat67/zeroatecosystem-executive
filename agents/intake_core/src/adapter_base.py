from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List

from agents.intake_core.src.canonical_event import CanonicalEvent
from agents.intake_core.src.fingerprint import (
    canonical_event_to_fingerprint,
    canonical_event_to_idempotency,
)


class AdapterBase(ABC):
    """
    Base contract for all industrial ingestion adapters.

    Adapters are responsible only for:
    - reading source payloads
    - normalizing into CanonicalEvent
    - attaching source metadata
    - generating fingerprint + idempotency key

    Adapters must NOT apply business logic.
    """

    source_type: str = "unknown"
    trust_level: str = "medium"
    default_confidence_score: float = 0.8

    def __init__(self, registry=None) -> None:
        self.registry = registry

    @abstractmethod
    def parse(self, payload: Any) -> List[CanonicalEvent]:
        """
        Convert raw payload into one or more CanonicalEvent objects.
        """
        raise NotImplementedError

    def enrich_event(self, event: CanonicalEvent) -> CanonicalEvent:
        """
        Attach adapter-level defaults and deterministic keys.
        """
        if not event.source_type:
            event.source_type = self.source_type

        if not event.trust_level:
            event.trust_level = self.trust_level

        if event.confidence_score is None:
            event.confidence_score = self.default_confidence_score

        if not event.fingerprint:
            event.fingerprint = canonical_event_to_fingerprint(event)

        if not event.idempotency_key:
            event.idempotency_key = canonical_event_to_idempotency(event)

        return event

    def validate_event(self, event: CanonicalEvent) -> CanonicalEvent:
        """
        Minimal structural validation only.
        Optionally checks facility registry constraints.
        """
        if not event.is_valid():
            event.add_error("invalid_canonical_event")

        if self.registry is not None:
            facility = self.registry.get_facility(event.facility_id)
            if facility is None:
                event.add_error("unknown_facility")

            metric = self.registry.get_metric_definition(event.facility_id, event.metric_type)
            if metric is None:
                event.add_error("unknown_metric_type")
            else:
                ok, reason = self.registry.validate_metric_value(
                    event.facility_id,
                    event.metric_type,
                    float(event.value),
                )
                if not ok and reason:
                    event.add_error(reason)

            if event.process_line:
                line = self.registry.get_process_line(event.facility_id, event.process_line)
                if line is None:
                    event.add_error("unknown_process_line")

        return event

    def normalize(self, payload: Any) -> List[CanonicalEvent]:
        """
        Main adapter pipeline:
        parse -> enrich -> validate
        """
        parsed = self.parse(payload)
        normalized: List[CanonicalEvent] = []

        for event in parsed:
            event = self.enrich_event(event)
            event = self.validate_event(event)
            normalized.append(event)

        return normalized

    def build_source_metadata(self, payload: Any, extra: Dict[str, Any] | None = None) -> Dict[str, Any]:
        """
        Common source metadata builder.
        """
        meta = {
            "adapter_type": self.__class__.__name__,
            "source_type": self.source_type,
            "trust_level": self.trust_level,
        }
        if extra:
            meta.update(extra)
        return meta
