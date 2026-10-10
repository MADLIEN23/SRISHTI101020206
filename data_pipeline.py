"""
Data Processing Pipeline for Search Term Triage Engine (Person 3 Deliverable)
----------------------------------------------------------------------------
This module handles ingestion, validation, sanitization, and export of search term reports.
Supports both CSV and Excel (.xlsx, .xls) input files.
Connects directly to the classification / triage engine (Person 2).
"""

from pathlib import Path
from typing import Callable, Optional, Tuple, Union
import pandas as pd


REQUIRED_COLUMNS = [
    "row_id",
    "search_term",
    "match_type",
    "campaign",
    "ad_group",
    "impressions",
    "clicks",
    "cost",
    "conversions",
    "conversion_value",
]

NUMERIC_COLUMNS = [
    "impressions",
    "clicks",
    "cost",
    "conversions",
    "conversion_value",
]

TEXT_COLUMNS = [
    "search_term",
    "match_type",
    "campaign",
    "ad_group",
]


class DataValidationError(ValueError):
    """Raised when the uploaded dataset fails schema validation."""
    pass


def load_dataset(file_path: Union[str, Path]) -> pd.DataFrame:
    """
    Load data from either a CSV or Excel file safely.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Input file not found at: {path.resolve()}")

    suffix = path.suffix.lower()
    if suffix == ".csv":
        # Low_memory=False ensures stable parsing for ~25,000+ rows
        df = pd.read_csv(path, low_memory=False)
    elif suffix in [".xlsx", ".xls"]:
        df = pd.read_excel(path)
    else:
        raise DataValidationError(
            f"Unsupported file format: '{suffix}'. Expected .csv or .xlsx / .xls"
        )

    return df


def validate_schema(df: pd.DataFrame) -> None:
    """
    Ensure all required columns exist in the DataFrame.
    """
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise DataValidationError(
            f"Dataset is missing {len(missing_columns)} required column(s): {missing_columns}\n"
            f"Required schema is: {REQUIRED_COLUMNS}"
        )


def sanitize_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Safely clean text and numeric values:
    - Strips whitespace and handles blank strings in text fields.
    - Coerces invalid/corrupt numeric entries to 0 without crashing.
    """
    cleaned_df = df.copy()

    # Clean text columns
    for col in TEXT_COLUMNS:
        cleaned_df[col] = cleaned_df[col].fillna("").astype(str).str.strip()

    # Clean numeric columns (handles non-numeric strings, negatives, and NaN values)
    for col in NUMERIC_COLUMNS:
        cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce").fillna(0)
        # Ensure counts like impressions/clicks/conversions are non-negative
        cleaned_df[col] = cleaned_df[col].apply(lambda x: max(0.0, float(x)))

    return cleaned_df


def default_fallback_triage(df: pd.DataFrame) -> pd.DataFrame:
    """
    Default triage placeholder used when Person 2's triage engine is not yet attached.
    Routes items to human review with low confidence.
    """
    res_df = df.copy()
    res_df["decision"] = "review"
    res_df["confidence"] = "low"
    res_df["reason"] = "Awaiting automated triage engine classification"
    return res_df


def process_file(
    input_file: Union[str, Path],
    triage_fn: Optional[Callable[[pd.DataFrame], pd.DataFrame]] = None,
    output_file: Optional[Union[str, Path]] = None,
) -> Tuple[pd.DataFrame, Path]:
    """
    Full end-to-end processing pipeline:
    1. Loads CSV or Excel file.
    2. Validates required schema.
    3. Cleans blank values and converts numeric types safely.
    4. Passes sanitized data to triage engine (triage_fn).
    5. Exports results to a downloadable CSV file.

    Returns:
        (processed_dataframe, output_file_path)
    """
    input_path = Path(input_file)
    print(f"[Pipeline] Loading dataset from: {input_path.name}...")
    df = load_dataset(input_path)
    print(f"[Pipeline] Loaded {len(df):,} rows.")

    # 1. Validation
    validate_schema(df)
    print("[Pipeline] Schema validation passed.")

    # 2. Sanitization
    df_clean = sanitize_data(df)
    print("[Pipeline] Data sanitization completed.")

    # 3. Connect to Triage Engine
    if triage_fn is not None:
        print("[Pipeline] Applying custom triage engine...")
        df_triaged = triage_fn(df_clean)
    else:
        print("[Pipeline] No custom triage function provided. Applying fallback review...")
        df_triaged = default_fallback_triage(df_clean)

    # Ensure required triage output columns exist
    for output_col in ["decision", "confidence", "reason"]:
        if output_col not in df_triaged.columns:
            df_triaged[output_col] = "N/A"

    # 4. Export results
    if output_file is None:
        output_path = input_path.with_name(f"{input_path.stem}_triaged_output.csv")
    else:
        output_path = Path(output_file)

    df_triaged.to_csv(output_path, index=False)
    print(f"[Pipeline] Successfully processed {len(df_triaged):,} rows.")
    print(f"[Pipeline] Output exported to: {output_path.resolve()}")

    return df_triaged, output_path


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        target_path = sys.argv[1]
    else:
        default_sample = Path(__file__).parent / "sample_data" / "sample_search_terms.csv"
        prompt_text = f"Enter path to CSV/Excel file [press Enter for '{default_sample}']: "
        entered = input(prompt_text).strip().strip('"')
        target_path = entered if entered else str(default_sample)

    try:
        results, out_file = process_file(target_path)
        print("\n--- First 3 Sample Output Rows ---")
        preview_cols = ["search_term", "clicks", "conversions", "decision", "confidence", "reason"]
        available_cols = [c for c in preview_cols if c in results.columns]
        print(results[available_cols].head(3).to_string(index=False))
    except Exception as err:
        print(f"\n[Error] Pipeline failed: {err}")
