from pathlib import Path
import pandas as pd
from .normalize import build_record_from_row

def parse_tabular_file(path: str) -> list[dict]:
    file_path = Path(path)
    suffix = file_path.suffix.lower()

    if suffix == ".csv":
        df = pd.read_csv(file_path)
    elif suffix == ".xlsx":
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported tabular file: {suffix}")

    rows = df.fillna("").to_dict(orient="records")
    records = []

    for idx, row in enumerate(rows, start=1):
        records.append(
            build_record_from_row(
                row=row,
                source_name=file_path.name,
                source_type=suffix.lstrip("."),
                row_index=idx,
            )
        )

    return records
