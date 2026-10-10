# Search Term Triage Engine (`triage_engine.py`)

A standalone, transparent decision-making module for Google Ads Search Term Triage. Built for college hackathon **PS-01: Search Term Triage Engine**.

---

## 🌟 Quick Overview for Teammates

This module receives a single Google Ads search term record (dictionary) and outputs a structured triage decision:

```python
from triage_engine import triage_search_term

record = {
    "query": "best lightweight running sneakers",
    "match_type": "Exact",
    "campaign": "Running_Shoes",
    "ad_group": "Sneakers",
    "impressions": 320,
    "clicks": 25,
    "cost": 45.0,
    "conversions": 4,
    "conversion_value": 360.0
}

result = triage_search_term(record)
print(result)
```

### Output Format:
```json
{
  "query": "best lightweight running sneakers",
  "decision": "PROMOTE",
  "confidence": "HIGH",
  "reason": "Demonstrated repeatable performance with 4 conversions across 25 clicks at an efficient CPA of $11.25 (target: $30.00).",
  "human_review": false
}
```

---

## 🧠 Decision Rules Explained (Plain English)

1. **Small Sample Protection (The Fluke Trap)**:
   - *Problem*: In Google Ads, a search term with 2 clicks and 1 conversion has a 50% conversion rate on paper, but it's statistically random noise.
   - *Rule*: Never promote based on conversions alone without sufficient click volume (minimum 10 clicks and 2 conversions). Small-sample conversions are returned as `IGNORE`, `LOW` confidence, `human_review: true`.

2. **Cautious Blocking (Don't Block on Low Data)**:
   - *Problem*: Blocking every query with 0 conversions wastes opportunities (e.g. 2 clicks with 0 conversions is completely normal).
   - *Rule*: Only block 0-conversion queries when they accumulate significant evidence of failure (e.g. 15+ clicks or exceeding maximum wasted spend). Otherwise, return `IGNORE` with `human_review: true`.

3. **Proven Performers (`PROMOTE`)**:
   - Queries with sufficient volume (≥ 10 clicks, ≥ 2 conversions) AND acceptable acquisition cost (CPA ≤ target CPA).

4. **Campaign-Specific Context**:
   - Relevance and negative keywords are only evaluated if explicitly configured for that campaign. The engine never pretends to guess search intent without business context.

5. **Fault Tolerant**:
   - Handles missing keys, string numbers (`"$45.50"`), commas, None values, and malformed records without crashing.

---

## ⚙️ Configuration (Optional)

You can pass a custom `config` dictionary to `triage_search_term(record, config=my_config)`:

```python
custom_config = {
    "min_clicks_promote": 10,
    "min_conversions_promote": 2,
    "target_cpa": 30.0,
    "max_wasted_spend": 60.0,
    "negative_keywords": ["free", "crack", "torrent", "jobs"],
    "campaigns": {
        "High_Margin_Campaign": {
            "target_cpa": 50.0,
            "max_wasted_spend": 100.0
        }
    }
}
```

---

## 🧪 Running Tests & Examples

Run the unit test suite:
```bash
python -m unittest test_triage_engine.py
```

Run the example runner:
```bash
python example_usage.py
```
