import sys
from pathlib import Path
from .tabular_parser import parse_tabular_file
from .text_parser import parse_key_value_text
from .writers import write_normalized_json, write_flat_csv, write_review_manifest
from .utils import file_sha256
from .validate import validate_record, score_confidence

def run(path_str: str):
    path = Path(path_str)
    if not path.exists():
        raise FileNotFoundError(f"Input not found: {path}")

    suffix = path.suffix.lower()
    base_name = path.stem

    if suffix in {".csv", ".xlsx"}:
        records = parse_tabular_file(str(path))
    elif suffix in {".txt"}:
        records = parse_key_value_text(str(path))
    else:
        raise ValueError(f"Unsupported input type: {suffix}")

    source_hash = file_sha256(path)

    total_errors = 0
    for record in records:
        record["meta"]["source_hash"] = source_hash
        errors = validate_record(record)
        record["review"]["validation_errors"] = errors
        record["meta"]["confidence_score"] = score_confidence(record, errors)
        if errors:
            total_errors += len(errors)

    json_path = write_normalized_json(records, base_name)
    csv_path = write_flat_csv(records, base_name)
    review_path = write_review_manifest(records, base_name)

    print("OK: intake completed")
    print(f"JSON   : {json_path}")
    print(f"CSV    : {csv_path}")
    print(f"REVIEW : {review_path}")
    print(f"RECORDS: {len(records)}")
    print(f"ERRORS : {total_errors}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 -m src.main <input_file>")
        sys.exit(1)
    run(sys.argv[1])
