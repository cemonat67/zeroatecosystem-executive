from pathlib import Path
from .normalize import build_record_from_row

KNOWN_KEYS = {
    "facility": "facility",
    "water_m3": "water_m3",
    "energy_kwh": "energy_kwh",
    "natural_gas_m3": "natural_gas_m3",
    "steam_ton": "steam_ton",
    "co2_kg": "co2_kg",
    "wastewater_m3": "wastewater_m3",
    "production_kg": "production_kg",
    "cod_mg_l": "cod_mg_l",
    "bod_mg_l": "bod_mg_l",
    "tss_mg_l": "tss_mg_l",
    "ph": "ph",
}

def parse_key_value_text(path: str) -> list[dict]:
    file_path = Path(path)
    content = file_path.read_text(encoding="utf-8")
    row = {}

    for line in content.splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip().lower()
        value = value.strip()
        if key in KNOWN_KEYS:
            row[KNOWN_KEYS[key]] = value

    record = build_record_from_row(
        row=row,
        source_name=file_path.name,
        source_type="pasted_text",
        row_index=1,
    )
    record["evidence"]["raw_text_excerpt"] = content[:1000]
    return [record]
