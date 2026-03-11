from datetime import datetime
from .schema_utils import new_record
from .config import DEFAULT_CONFIDENCE, DEFAULT_FACILITY, DEFAULT_SOURCE_LANGUAGE, PARSER_VERSION

FIELD_CANDIDATES = {
    "water_m3": ["water_m3", "water", "water consumption", "water consumption m3", "su", "su_m3"],
    "energy_kwh": ["energy_kwh", "energy", "electricity_kwh", "electricity", "enerji", "kwh"],
    "natural_gas_m3": ["natural_gas_m3", "natural gas", "dogalgaz", "gas_m3"],
    "steam_ton": ["steam_ton", "steam", "buhar", "steam ton"],
    "co2_kg": ["co2_kg", "co2", "carbon", "emission", "emissions_kg"],
    "wastewater_m3": ["wastewater_m3", "wastewater", "atiksu", "effluent_m3"],
    "production_kg": ["production_kg", "production", "uretim", "kg production"],
    "cod_mg_l": ["cod_mg_l", "cod"],
    "bod_mg_l": ["bod_mg_l", "bod"],
    "tss_mg_l": ["tss_mg_l", "tss"],
    "ph": ["ph", "p_h"],
    "conductivity_us_cm": ["conductivity_us_cm", "conductivity"],
    "temperature_c": ["temperature_c", "temperature", "temp_c"],
}

def _norm_key(value: str) -> str:
    return str(value).strip().lower().replace("-", "_")

def _pick_value(row: dict, candidates: list[str]):
    normalized = {_norm_key(k): v for k, v in row.items()}
    for candidate in candidates:
        key = _norm_key(candidate)
        if key in normalized and normalized[key] not in ("", None):
            return normalized[key], key
    return None, None

def build_record_from_row(row: dict, source_name: str, source_type: str, row_index: int) -> dict:
    record = new_record()
    now = datetime.utcnow().isoformat() + "Z"

    record["meta"]["source_id"] = f"{source_name}::row::{row_index}"
    record["meta"]["source_type"] = source_type
    record["meta"]["source_name"] = source_name
    record["meta"]["source_language"] = DEFAULT_SOURCE_LANGUAGE
    record["meta"]["received_at"] = now
    record["meta"]["processed_at"] = now
    record["meta"]["facility"] = row.get("facility", DEFAULT_FACILITY) or DEFAULT_FACILITY
    record["meta"]["uploader"] = "local_mvp"
    record["meta"]["review_status"] = "draft"
    record["meta"]["confidence_score"] = DEFAULT_CONFIDENCE
    record["meta"]["parser_version"] = PARSER_VERSION

    field_map = {}

    for target_field, candidates in FIELD_CANDIDATES.items():
        value, source_field = _pick_value(row, candidates)
        if value is None:
            continue

        if target_field in record["metrics"]:
            record["metrics"][target_field] = value
        elif target_field in record["wastewater_quality"]:
            record["wastewater_quality"][target_field] = value

        if source_field:
            field_map[target_field] = source_field

    record["normalization"]["field_map"] = field_map
    record["evidence"]["raw_text_excerpt"] = str(row)[:500]

    return record
