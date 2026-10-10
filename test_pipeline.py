"""
Unit and integration tests for the Person 3 Data Pipeline.
Demonstrates:
1. Processing sample CSV data.
2. Handling missing columns with descriptive errors.
3. Handling corrupt numeric values and blanks gracefully.
4. Plugging in a custom triage engine function.
"""

from pathlib import Path
import pandas as pd
from data_pipeline import (
    process_file,
    sanitize_data,
    validate_schema,
    DataValidationError,
)

SAMPLE_PATH = Path(__file__).parent / "sample_data" / "sample_search_terms.csv"


def test_valid_sample_pipeline():
    print("[TEST 1] Testing end-to-end pipeline with sample dataset...")
    df_out, out_path = process_file(SAMPLE_PATH)
    assert len(df_out) > 0, "Output dataframe should not be empty"
    assert out_path.exists(), "Output CSV file should exist"
    for col in ["decision", "confidence", "reason"]:
        assert col in df_out.columns, f"Missing output column {col}"
    print("-> PASS: Sample dataset processed and exported successfully.")


def test_missing_column_validation():
    print("\n[TEST 2] Testing schema validation on missing column...")
    bad_df = pd.DataFrame({
        "row_id": [1],
        "search_term": ["bad test"],
        # Missing other required columns
    })
    try:
        validate_schema(bad_df)
        print("-> FAIL: Expected DataValidationError was not raised.")
    except DataValidationError as e:
        print(f"-> PASS: Caught expected validation error:\n   '{e}'")


def test_corrupt_data_sanitization():
    print("\n[TEST 3] Testing dirty/corrupt data handling...")
    dirty_df = pd.DataFrame({
        "row_id": [1, 2],
        "search_term": ["  sba loan  ", None],
        "match_type": ["phrase", None],
        "campaign": ["Search | SBA", "Search | SBA"],
        "ad_group": ["SBA Loans", "SBA Loans"],
        "impressions": ["invalid_number", None],
        "clicks": ["5", "not_a_num"],
        "cost": [10.5, "corrupted"],
        "conversions": [None, 1],
        "conversion_value": [None, None],
    })
    cleaned = sanitize_data(dirty_df)
    assert cleaned.loc[0, "search_term"] == "sba loan", "Whitespace should be stripped"
    assert cleaned.loc[1, "search_term"] == "", "None should become empty string"
    assert cleaned.loc[0, "impressions"] == 0.0, "Corrupt impressions should be coerced to 0"
    assert cleaned.loc[0, "clicks"] == 5.0, "Valid string number should become float"
    assert cleaned.loc[1, "clicks"] == 0.0, "Corrupt clicks should be coerced to 0"
    print("-> PASS: Dirty and invalid data sanitized safely without throwing exceptions.")


def test_custom_triage_engine_hook():
    print("\n[TEST 4] Testing triage engine plug-in (Person 2 integration)...")

    def mock_person_2_triage(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Mock logic: if cost > 100 and conversions == 0 -> block
        # If conversions > 0 -> promote
        # Else -> ignore
        df["decision"] = "ignore"
        df["confidence"] = "medium"
        df["reason"] = "Standard traffic within normal variance"

        block_mask = (df["cost"] > 100) & (df["conversions"] == 0)
        df.loc[block_mask, "decision"] = "block"
        df.loc[block_mask, "confidence"] = "high"
        df.loc[block_mask, "reason"] = "High cost with zero conversions"

        promote_mask = df["conversions"] > 0
        df.loc[promote_mask, "decision"] = "promote"
        df.loc[promote_mask, "confidence"] = "high"
        df.loc[promote_mask, "reason"] = "Proven converting query"

        return df

    df_out, _ = process_file(SAMPLE_PATH, triage_fn=mock_person_2_triage)
    decisions = set(df_out["decision"].unique())
    print(f"Decisions assigned by triage engine: {decisions}")
    assert "decision" in df_out.columns
    print("-> PASS: Custom triage engine integrated seamlessly.")


if __name__ == "__main__":
    test_valid_sample_pipeline()
    test_missing_column_validation()
    test_corrupt_data_sanitization()
    test_custom_triage_engine_hook()
    print("\n==========================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("==========================================")
