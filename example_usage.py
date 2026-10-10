"""
example_usage.py - Simple Integration Example for Teammates.

Shows how teammates (Person 1, 3, or 4) can import and call triage_engine.py
to classify single rows, batch reports, and pass custom campaign configs.
"""

import json
from triage_engine import triage_search_term, triage_batch


def run_single_record_example():
    print("=" * 70)
    print("EXAMPLE 1: Evaluating Single Search Terms")
    print("=" * 70)

    # Example A: Fluke conversion with tiny sample size (The problem trap!)
    fluke_query = {
        "query": "buy carbon marathon racing shoes",
        "match_type": "Broad",
        "campaign": "Marathon_2026",
        "ad_group": "Carbon_Plates",
        "impressions": 15,
        "clicks": 2,              # Only 2 clicks!
        "cost": 6.50,
        "conversions": 1,         # 1 conversion (50% conv rate looks high, but it's noise!)
        "conversion_value": 150.0,
    }

    result_a = triage_search_term(fluke_query)
    print(f"\nQuery: '{result_a['query']}'")
    print(f"Decision:     {result_a['decision']}")
    print(f"Confidence:   {result_a['confidence']}")
    print(f"Human Review: {result_a['human_review']}")
    print(f"Reason:       {result_a['reason']}")

    # Example B: Proven winner with sufficient volume
    proven_winner = {
        "query": "best lightweight running sneakers",
        "match_type": "Exact",
        "campaign": "Marathon_2026",
        "ad_group": "Sneakers",
        "impressions": 320,
        "clicks": 25,
        "cost": 45.0,
        "conversions": 4,         # CPA = $45 / 4 = $11.25 (target is $30)
        "conversion_value": 360.0,
    }

    result_b = triage_search_term(proven_winner)
    print(f"\nQuery: '{result_b['query']}'")
    print(f"Decision:     {result_b['decision']}")
    print(f"Confidence:   {result_b['confidence']}")
    print(f"Human Review: {result_b['human_review']}")
    print(f"Reason:       {result_b['reason']}")

    # Example C: Non-converting query with low clicks (Don't block prematurely!)
    low_clicks_zero_conv = {
        "query": "running shoes size 10 blue",
        "match_type": "Phrase",
        "campaign": "Marathon_2026",
        "ad_group": "Sizes",
        "impressions": 25,
        "clicks": 3,
        "cost": 4.50,
        "conversions": 0,
        "conversion_value": 0,
    }

    result_c = triage_search_term(low_clicks_zero_conv)
    print(f"\nQuery: '{result_c['query']}'")
    print(f"Decision:     {result_c['decision']}")
    print(f"Confidence:   {result_c['confidence']}")
    print(f"Human Review: {result_c['human_review']}")
    print(f"Reason:       {result_c['reason']}")


def run_batch_with_custom_config_example():
    print("\n" + "=" * 70)
    print("EXAMPLE 2: Batch Processing with Custom Campaign Config")
    print("=" * 70)

    # Custom configuration with campaign-specific overrides and negative keywords
    custom_config = {
        "negative_keywords": ["free", "torrent", "jobs", "salary", "login"],
        "campaigns": {
            "High_Margin_Shoes": {
                "target_cpa": 50.0,
                "max_wasted_spend": 100.0,
                "min_clicks_promote": 8,
            },
            "Budget_Accessories": {
                "target_cpa": 15.0,
                "max_wasted_spend": 30.0,
                "min_clicks_promote": 12,
            }
        }
    }

    sample_report = [
        # 1. Matches configured negative keyword -> BLOCK immediately
        {
            "query": "free running shoe vouchers",
            "campaign": "High_Margin_Shoes",
            "clicks": 1,
            "cost": 0.50,
            "conversions": 0,
        },
        # 2. Wasted budget exceeding threshold -> BLOCK
        {
            "query": "cheap shoe laces online",
            "campaign": "Budget_Accessories",
            "clicks": 22,
            "cost": 38.0,          # Exceeds max_wasted_spend ($30) for Budget_Accessories
            "conversions": 0,
        },
        # 3. High performance meeting High_Margin_Shoes target -> PROMOTE
        {
            "query": "carbon racing shoe high arch",
            "campaign": "High_Margin_Shoes",
            "clicks": 14,
            "cost": 70.0,          # CPA = $70 / 2 = $35 <= $50 target
            "conversions": 2,
        },
    ]

    results = triage_batch(sample_report, config=custom_config)

    for i, res in enumerate(results, 1):
        print(f"\n[{i}] Query: '{res['query']}'")
        print(f"    Decision:     {res['decision']}")
        print(f"    Confidence:   {res['confidence']}")
        print(f"    Human Review: {res['human_review']}")
        print(f"    Reason:       {res['reason']}")


if __name__ == "__main__":
    run_single_record_example()
    run_batch_with_custom_config_example()
