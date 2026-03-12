from __future__ import annotations

from typing import Any, Dict, List

from agents.intake_core.src.adapter_base import AdapterBase
from agents.intake_core.src.canonical_event import CanonicalEvent


class CSVAdapter(AdapterBase):
    source_type = "csv"
    trust_level = "medium"
    default_confidence_score = 0.85

    def parse(self, payload: Any) -> List[CanonicalEvent]:
        """
        Payload expected:
        {
          "rows": [ {...}, {...} ],
          "file_name": "example.csv"
        }
        """
        rows = payload.get("rows", [])
        file_name = payload.get("file_name", "unknown.csv")

        events: List[CanonicalEvent] = []

        for idx, row in enumerate(rows, start=1):
            event = CanonicalEvent(
                facility_id=str(row.get("facility_id", "")).strip(),
                source_type=self.source_type,
                metric_type=str(row.get("metric_type", "")).strip(),
                value=float(row.get("value", 0)),
                unit=str(row.get("unit", "")).strip(),
                event_timestamp=str(row.get("event_timestamp", "")).strip(),
                process_line=row.get("process_line"),
                batch_id=row.get("batch_id"),
                order_id=row.get("order_id"),
                asset_id=row.get("asset_id"),
                confidence_score=float(row.get("confidence_score", self.default_confidence_score)),
                trust_level=self.trust_level,
                source_event_id=str(row.get("source_event_id", f"{file_name}:{idx}")),
                source_metadata=self.build_source_metadata(
                    payload,
                    {
                        "file_name": file_name,
                        "row_number": idx,
                    },
                ),
            )
            events.append(event)

        return events
