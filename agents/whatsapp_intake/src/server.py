from datetime import datetime
from pathlib import Path
import json

from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .adapter import parse_whatsapp_to_record
from agents.intake_agent.src.writers import write_normalized_json, write_review_manifest
from agents.intake_agent.src.validate import validate_record, score_confidence
from agents.intake_agent.src.config import REJECTED_DIR

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "http://127.0.0.1:8010",
        "http://localhost:8010",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SITE_ROOT = Path(__file__).resolve().parents[3]
INTAKE_ROOT = SITE_ROOT / "agents" / "intake_agent"
ARCHIVE_DIR = INTAKE_ROOT / "archive"
LOG_FILE = INTAKE_ROOT / "logs" / "intake_events.jsonl"
NORMALIZED_FILE = INTAKE_ROOT / "normalized" / "sample_metrics.normalized.json"


def write_rejected_json(record: dict, base_name: str) -> str:
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)
    out_path = REJECTED_DIR / f"{base_name}.rejected.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump([record], f, indent=2, ensure_ascii=False)
    return str(out_path)


def read_json(path: Path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def read_jsonl(path: Path, limit: int = 5):
    rows = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception:
                    pass
    except Exception:
        return []
    return rows[-limit:]


def latest_summary_file():
    files = sorted(ARCHIVE_DIR.glob("*.summary.json"), key=lambda p: p.stat().st_mtime)
    return files[-1] if files else None


def latest_rejected_file():
    files = sorted((INTAKE_ROOT / "rejected").glob("*.rejected.json"), key=lambda p: p.stat().st_mtime)
    return files[-1] if files else None


def build_snapshot_for_facility(facility: str):
    rows = read_json(NORMALIZED_FILE, [])
    chosen = None

    for row in rows:
        meta = row.get("meta", {})
        if str(meta.get("facility", "")).lower() == facility.lower():
            chosen = row

    if chosen is None and rows:
        chosen = rows[-1]

    if not chosen:
        return {
            "snapshot_date": datetime.now().strftime("%Y-%m-%d"),
            "water_m3": None,
            "wastewater_m3": None,
            "energy_kwh": None,
            "natural_gas_m3": None,
            "steam_ton": None,
            "production_kg": None,
            "co2_kg": None,
            "cod_mg_l": None,
            "bod_mg_l": None,
            "tss_mg_l": None,
            "ph": None
        }

    metrics = chosen.get("metrics", {})
    ww = chosen.get("wastewater_quality", {})
    meta = chosen.get("meta", {})

    return {
        "snapshot_date": meta.get("period_end") or datetime.now().strftime("%Y-%m-%d"),
        "water_m3": metrics.get("water_m3"),
        "wastewater_m3": metrics.get("wastewater_m3"),
        "energy_kwh": metrics.get("energy_kwh"),
        "natural_gas_m3": metrics.get("natural_gas_m3"),
        "steam_ton": metrics.get("steam_ton"),
        "production_kg": metrics.get("production_kg"),
        "co2_kg": metrics.get("co2_kg"),
        "cod_mg_l": ww.get("cod_mg_l"),
        "bod_mg_l": ww.get("bod_mg_l"),
        "tss_mg_l": ww.get("tss_mg_l"),
        "ph": ww.get("ph")
    }


@app.get("/api/intake/ops")
async def intake_ops(facility: str = Query(default="Ekoten")):
    summary_path = latest_summary_file()
    rejected_path = latest_rejected_file()

    summary = read_json(summary_path, {}) if summary_path else {}
    rejected_rows = read_json(rejected_path, []) if rejected_path else []
    event_rows = read_jsonl(LOG_FILE, 5)

    events = []
    for row in event_rows:
        events.append({
            "ts": row.get("ts", ""),
            "stage": row.get("event_type", "event"),
            "status": row.get("status", ""),
            "detail": row.get("extra", {}).get("input_name")
                      or row.get("archive_path")
                      or row.get("normalized_path")
                      or row.get("review_path")
                      or ""
        })

    return JSONResponse({
        "facility": facility,
        "latest_batch": {
            "batch_id": summary.get("batch_id", "—"),
            "source": summary.get("source", "—"),
            "facility": facility,
            "status": summary.get("status", "—")
        },
        "counts": {
            "accepted": summary.get("counts", {}).get("accepted_records", 0),
            "rejected": summary.get("counts", {}).get("rejected_records", len(rejected_rows) if isinstance(rejected_rows, list) else 0)
        },
        "processor": {
            "status": "Processed" if summary else "No Data",
            "note": summary.get("input_name", "No summary found")
        },
        "events": events,
        "snapshot": build_snapshot_for_facility(facility)
    })


@app.post("/api/intake/whatsapp")
async def whatsapp_intake(request: Request):
    payload = await request.json()

    record = parse_whatsapp_to_record(payload)

    errors = validate_record(record)
    record["review"]["validation_errors"] = errors
    record["meta"]["confidence_score"] = score_confidence(record, errors)

    base_name = f"whatsapp_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if errors:
        record["meta"]["review_status"] = "rejected"
        normalized_path = write_normalized_json([record], base_name)
        rejected_path = write_rejected_json(record, base_name)

        return {
            "status": "rejected",
            "stored_at": str(normalized_path),
            "rejected_at": rejected_path,
            "validation_errors": errors,
            "confidence_score": record["meta"]["confidence_score"],
            "record_preview": {
                "facility": record["meta"]["facility"],
                "water_m3": record["metrics"]["water_m3"],
                "energy_kwh": record["metrics"]["energy_kwh"],
                "production_kg": record["metrics"]["production_kg"]
            }
        }

    record["meta"]["review_status"] = "in_review"
    normalized_path = write_normalized_json([record], base_name)
    review_path = str(write_review_manifest([record], base_name))

    return {
        "status": "accepted",
        "stored_at": str(normalized_path),
        "review_manifest": review_path,
        "validation_errors": [],
        "confidence_score": record["meta"]["confidence_score"],
        "record_preview": {
            "facility": record["meta"]["facility"],
            "water_m3": record["metrics"]["water_m3"],
            "energy_kwh": record["metrics"]["energy_kwh"],
            "production_kg": record["metrics"]["production_kg"]
        }
    }
