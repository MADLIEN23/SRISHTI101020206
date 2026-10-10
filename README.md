# Search Term Triage Engine — Data Pipeline Module (Person 3)

Part of the **PS-01 Search Term Triage Engine** project for *Kestrel Business Funding*.

## Overview
This repository contains the **Data Processing & Pipeline Module** (owned by **Person 3**). It is responsible for ingesting, validating, sanitizing, and exporting search term reports (handling up to 25,000+ rows efficiently), while providing a plug-and-play hook for the Triage Engine (Person 2) and Frontend (Person 1).

---

## Deliverables Covered
- [x] **File Upload & Ingestion**: Reads `.csv` and Excel (`.xlsx`, `.xls`) files.
- [x] **Schema Validation**: Validates all 10 required columns and raises clear, actionable error messages if any are missing.
- [x] **Data Sanitization**: Safely handles blank values, strips whitespace, and converts invalid/corrupt numeric entries to zero without crashing.
- [x] **Triage Engine Integration**: Provides a pluggable callback hook (`triage_fn`) to connect directly to Person 2's classification engine.
- [x] **Fallback Handling**: Includes a fallback review mode if the triage engine has not yet been connected.
- [x] **Results Export**: Exports triaged datasets to a downloadable, properly formatted CSV.
- [x] **Sample Dataset**: Includes a verified sample dataset in `sample_data/` for rapid testing.
- [x] **Automated Tests**: Unit and integration test suite in `test_pipeline.py`.

---

## Repository Structure

```text
search-term-triage/
├── data_pipeline.py               # Core pipeline module (load, validate, sanitize, export)
├── test_pipeline.py               # Automated test suite
├── requirements.txt               # Dependencies (pandas, openpyxl)
├── sample_data/
│   └── sample_search_terms.csv    # Sample 15-row dataset for quick verification
├── .gitignore                     # Git ignore rules for caches and outputs
└── README.md                      # Documentation and integration guide
```

---

## Required Schema

The pipeline expects search term reports with the following columns:
| Column | Type | Description |
|---|---|---|
| `row_id` | Integer / String | Unique identifier for the row |
| `search_term` | String | User search query typed into Google |
| `match_type` | String | `broad`, `phrase`, or `exact` |
| `campaign` | String | Campaign name |
| `ad_group` | String | Ad group name |
| `impressions` | Numeric | Total impressions |
| `clicks` | Numeric | Total clicks |
| `cost` | Numeric | Advertising cost (USD) |
| `conversions` | Numeric | Completed loan applications |
| `conversion_value` | Numeric | Estimated monetary value of conversions |

---

## Installation & Setup

1. Clone this repository or copy the folder into your project:
   ```bash
   git clone <repo-url>
   cd search-term-triage
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## How to Run

### 1. Run via Command Line (CLI)
You can run the pipeline directly from your terminal:
```bash
python data_pipeline.py sample_data/sample_search_terms.csv
```
This will sanitize the data, run the fallback triage, and output `sample_search_terms_triaged_output.csv`.

### 2. Team Integration Guide

#### How Person 2 (Triage Engine) plugs in:
Person 2 can pass their classification function directly into `process_file`:

```python
from data_pipeline import process_file

def my_triage_engine(df):
    """
    Person 2's classification logic.
    Must populate: 'decision', 'confidence', 'reason'
    """
    df = df.copy()
    # Your rule-based or ML classification logic here
    df["decision"] = "promote"  # or 'block', 'ignore'
    df["confidence"] = "high"   # or 'medium', 'low'
    df["reason"] = "Positive ROI with confirmed conversions"
    return df

# Process file and apply your triage engine
results_df, output_path = process_file(
    "search_terms_report.csv",
    triage_fn=my_triage_engine,
    output_file="final_triaged_report.csv"
)
```

#### How Person 1 (UI / Web App) plugs in:
Person 1 can call `process_file` inside their file upload handler (e.g. Streamlit or Flask):
```python
from data_pipeline import process_file, DataValidationError

try:
    df_results, out_file = process_file(uploaded_file_path, triage_fn=team_triage_engine)
    # Render table in UI or provide download link to out_file
except DataValidationError as err:
    # Display friendly error message in UI
    show_ui_alert(str(err))
```

---

## Running Tests

To verify that schema validation, sanitization, and triage engine integration work as expected:
```bash
python test_pipeline.py
```
