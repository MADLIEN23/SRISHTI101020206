"""
test_triage_engine.py - Comprehensive Unit Tests for Search Term Triage Engine.

Covers all core requirements, edge cases, small-sample uncertainty,
resilience to malformed data, and campaign-specific configurations.
"""

import unittest
from triage_engine import triage_search_term, triage_batch, DEFAULT_CONFIG


class TestTriageEngine(unittest.TestCase):

    def setUp(self):
        # Base standard record for reference
        self.base_record = {
            "query": "running shoes for marathon",
            "match_type": "Broad",
            "campaign": "Running_Shoes_Campaign",
            "ad_group": "Marathon",
            "impressions": 100,
            "clicks": 10,
            "cost": 25.0,
            "conversions": 2.0,
            "conversion_value": 80.0,
        }

    # ---------------------------------------------------------
    # Core Test: Small-sample uncertainty (The Problem Trap)
    # ---------------------------------------------------------
    def test_small_sample_with_conversion_not_promoted(self):
        """
        CRITICAL TEST: 2 clicks and 1 conversion is noise, not proof of a winner.
        Must NOT be promoted. Must return IGNORE with LOW confidence and human_review=True.
        """
        record = {
            "query": "cheap marathon shoes",
            "match_type": "Broad",
            "campaign": "Marathon_Campaign",
            "ad_group": "Shoes",
            "impressions": 20,
            "clicks": 2,
            "cost": 5.0,
            "conversions": 1.0,
            "conversion_value": 50.0,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "IGNORE")
        self.assertEqual(res["confidence"], "LOW")
        self.assertTrue(res["human_review"])
        self.assertIn("too small", res["reason"])

    # ---------------------------------------------------------
    # Core Test: Proven Performers (PROMOTE)
    # ---------------------------------------------------------
    def test_promote_strong_performance_with_sufficient_sample(self):
        """
        Query has sufficient sample volume (20 clicks, 4 conversions) and efficient CPA ($15 vs $30 target).
        Should return PROMOTE, HIGH confidence, human_review=False.
        """
        record = {
            "query": "best trail running shoes",
            "match_type": "Phrase",
            "campaign": "Shoes_Campaign",
            "ad_group": "Trail",
            "impressions": 250,
            "clicks": 20,
            "cost": 60.0,       # CPA = 60 / 4 = $15.00 <= target $30.00
            "conversions": 4.0,
            "conversion_value": 200.0,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "PROMOTE")
        self.assertEqual(res["confidence"], "HIGH")
        self.assertFalse(res["human_review"])
        self.assertIn("efficient CPA", res["reason"])

    def test_promote_borderline_cpa_needs_human_review(self):
        """
        High volume and multiple conversions, but CPA is near upper limit ($45 vs $30 target, max allowable $60).
        Should return PROMOTE, MEDIUM confidence, human_review=True.
        """
        record = {
            "query": "custom running orthotics",
            "match_type": "Exact",
            "campaign": "Orthotics_Campaign",
            "ad_group": "Running",
            "impressions": 180,
            "clicks": 15,
            "cost": 90.0,       # CPA = 90 / 2 = $45.00 (between $30 and $60)
            "conversions": 2.0,
            "conversion_value": 110.0,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "PROMOTE")
        self.assertEqual(res["confidence"], "MEDIUM")
        self.assertTrue(res["human_review"])
        self.assertIn("upper allowable limit", res["reason"])

    # ---------------------------------------------------------
    # Core Test: Wasted Spend and Poor Efficiency (BLOCK)
    # ---------------------------------------------------------
    def test_do_not_block_low_clicks_zero_conversions(self):
        """
        CRITICAL TEST: 2 clicks and 0 conversions is simply thin evidence.
        Do NOT block automatically. Must return IGNORE with human_review=True.
        """
        record = {
            "query": "red marathon laces",
            "match_type": "Broad",
            "campaign": "Shoes_Campaign",
            "ad_group": "Laces",
            "impressions": 15,
            "clicks": 2,
            "cost": 3.0,
            "conversions": 0,
            "conversion_value": 0,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "IGNORE")
        self.assertEqual(res["confidence"], "LOW")
        self.assertTrue(res["human_review"])
        self.assertIn("Insufficient volume", res["reason"])

    def test_block_excessive_wasted_spend_zero_conversions(self):
        """
        Query spent $75.00 with 0 conversions (exceeding default max_wasted_spend of $60.00).
        Should return BLOCK with HIGH confidence.
        """
        record = {
            "query": "free running shoe samples",
            "match_type": "Broad",
            "campaign": "Shoes_Campaign",
            "ad_group": "Samples",
            "impressions": 400,
            "clicks": 12,
            "cost": 75.0,
            "conversions": 0,
            "conversion_value": 0,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "BLOCK")
        self.assertEqual(res["confidence"], "HIGH")
        self.assertFalse(res["human_review"])
        self.assertIn("maximum wasted spend", res["reason"])

    def test_block_high_click_volume_zero_conversions(self):
        """
        Query has 18 clicks without any conversions (exceeding min_clicks_block of 15).
        Should return BLOCK with HIGH confidence.
        """
        record = {
            "query": "history of marathon running",
            "match_type": "Broad",
            "campaign": "Informational",
            "ad_group": "History",
            "impressions": 600,
            "clicks": 18,
            "cost": 27.0,
            "conversions": 0,
            "conversion_value": 0,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "BLOCK")
        self.assertEqual(res["confidence"], "HIGH")
        self.assertFalse(res["human_review"])
        self.assertIn("Accumulated 18 clicks", res["reason"])

    def test_block_high_conversions_with_terrible_cpa(self):
        """
        Query has conversions and clicks, but CPA is $100 (exceeding max limit of $60).
        Should be blocked due to unsustainable acquisition cost.
        """
        record = {
            "query": "expensive running shoes",
            "match_type": "Phrase",
            "campaign": "Shoes_Campaign",
            "ad_group": "Luxury",
            "impressions": 300,
            "clicks": 25,
            "cost": 200.0,      # CPA = 200 / 2 = $100 (target $30, max tolerance $60)
            "conversions": 2.0,
            "conversion_value": 150.0,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "BLOCK")
        self.assertEqual(res["confidence"], "HIGH")
        self.assertFalse(res["human_review"])
        self.assertIn("unsustainable CPA", res["reason"])

    # ---------------------------------------------------------
    # Core Test: Business Context & Negative Keyword Matching
    # ---------------------------------------------------------
    def test_block_explicit_negative_keyword_match(self):
        """
        Campaign provides explicit negative keywords (e.g. 'torrent', 'free', 'jobs').
        Query matches. Should return BLOCK with HIGH confidence immediately.
        """
        config = {
            "negative_keywords": ["free", "jobs", "salary", "crack"]
        }
        record = {
            "query": "jobs in running shoe store",
            "match_type": "Broad",
            "campaign": "Store_Campaign",
            "ad_group": "General",
            "impressions": 10,
            "clicks": 1,
            "cost": 1.20,
            "conversions": 0,
            "conversion_value": 0,
        }
        res = triage_search_term(record, config=config)

        self.assertEqual(res["decision"], "BLOCK")
        self.assertEqual(res["confidence"], "HIGH")
        self.assertFalse(res["human_review"])
        self.assertIn("configured campaign negative term 'jobs'", res["reason"])

    def test_no_business_context_does_not_guess_semantics(self):
        """
        Without business context, queries like 'free running plan' with low clicks are NOT blocked by guessing.
        They remain IGNORE (human_review=True) because we cannot presume business goals.
        """
        record = {
            "query": "free running plan pdf",
            "match_type": "Broad",
            "campaign": "Shoes_Campaign",
            "ad_group": "Plans",
            "impressions": 8,
            "clicks": 1,
            "cost": 0.80,
            "conversions": 0,
            "conversion_value": 0,
        }
        res = triage_search_term(record, config={})

        self.assertEqual(res["decision"], "IGNORE")
        self.assertEqual(res["confidence"], "LOW")
        self.assertTrue(res["human_review"])

    # ---------------------------------------------------------
    # Edge Cases & Data Robustness (No Crashing)
    # ---------------------------------------------------------
    def test_handles_missing_fields_and_nulls(self):
        """
        Record is missing most optional keys or has None values. Must not crash.
        """
        record = {
            "query": "lightweight sneakers",
            "impressions": None,
            "clicks": None,
            # cost, conversions missing completely
        }
        res = triage_search_term(record)

        self.assertIn(res["decision"], ["IGNORE", "BLOCK", "PROMOTE"])
        self.assertEqual(res["decision"], "IGNORE")
        self.assertTrue(res["human_review"])

    def test_handles_string_formatted_metrics(self):
        """
        Google Ads exports often contain '$', commas, or spaces (e.g. '$1,250.00').
        Should parse correctly.
        """
        record = {
            "query": "professional road bikes",
            "match_type": "Exact",
            "campaign": "Bikes",
            "ad_group": "Road",
            "impressions": " 1,500 ",
            "clicks": "25",
            "cost": " $75.00 ",
            "conversions": "3.0",
            "conversion_value": "$600.00",
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "PROMOTE")
        self.assertEqual(res["confidence"], "HIGH")
        self.assertFalse(res["human_review"])

    def test_empty_or_whitespace_query(self):
        """
        Empty query string should be flagged safely with human_review=True.
        """
        record = {"query": "   ", "clicks": 5, "cost": 10.0}
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "IGNORE")
        self.assertEqual(res["confidence"], "LOW")
        self.assertTrue(res["human_review"])
        self.assertIn("empty or missing", res["reason"])

    def test_negative_or_corrupt_numbers(self):
        """
        Corrupt inputs like negative clicks or invalid characters should not crash.
        """
        record = {
            "query": "trail gear",
            "clicks": -5,
            "cost": "corrupt_data",
            "conversions": 1,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "IGNORE")
        self.assertEqual(res["confidence"], "LOW")
        self.assertTrue(res["human_review"])
        self.assertIn("unparseable", res["reason"])

    def test_high_impressions_zero_clicks_anomaly(self):
        """
        Queries with hundreds of impressions but zero clicks (ad relevance / low CTR problem).
        """
        record = {
            "query": "generic sports shoes",
            "impressions": 500,
            "clicks": 0,
            "cost": 0.0,
            "conversions": 0,
            "conversion_value": 0,
        }
        res = triage_search_term(record)

        self.assertEqual(res["decision"], "IGNORE")
        self.assertEqual(res["confidence"], "LOW")
        self.assertTrue(res["human_review"])
        self.assertIn("0 clicks", res["reason"])

    # ---------------------------------------------------------
    # Campaign-Specific Configuration Overrides
    # ---------------------------------------------------------
    def test_campaign_specific_threshold_overrides(self):
        """
        Campaign A is strict (target CPA $10), Campaign B is generous (target CPA $100).
        The same query metrics yield different calls based on the campaign context.
        """
        config = {
            "campaigns": {
                "Brand_Campaign": {
                    "target_cpa": 10.0,
                    "max_wasted_spend": 20.0,
                    "min_clicks_promote": 5,
                    "min_conversions_promote": 2,
                },
                "High_Ticket_Enterprise": {
                    "target_cpa": 100.0,
                    "max_wasted_spend": 250.0,
                    "min_clicks_promote": 5,
                    "min_conversions_promote": 2,
                }
            }
        }

        # Query spending $35 for 2 conversions (CPA = $17.50)
        # In Brand_Campaign ($10 target, max allowable $20), this is borderline (PROMOTE, MEDIUM).
        res_brand = triage_search_term({
            "query": "brand shoes store",
            "campaign": "Brand_Campaign",
            "clicks": 8,
            "cost": 35.0,
            "conversions": 2.0,
        }, config=config)

        # In High_Ticket_Enterprise ($100 target), $17.50 CPA is stellar (PROMOTE, HIGH).
        res_enterprise = triage_search_term({
            "query": "enterprise marathon supply",
            "campaign": "High_Ticket_Enterprise",
            "clicks": 8,
            "cost": 35.0,
            "conversions": 2.0,
        }, config=config)

        self.assertEqual(res_brand["decision"], "PROMOTE")
        self.assertEqual(res_brand["confidence"], "MEDIUM")
        self.assertTrue(res_brand["human_review"])

        self.assertEqual(res_enterprise["decision"], "PROMOTE")
        self.assertEqual(res_enterprise["confidence"], "HIGH")
        self.assertFalse(res_enterprise["human_review"])

    # ---------------------------------------------------------
    # Batch Processing Helper
    # ---------------------------------------------------------
    def test_triage_batch(self):
        """
        Verify triage_batch processes an array of records smoothly.
        """
        records = [
            {"query": "winner query", "clicks": 20, "cost": 40.0, "conversions": 3.0},
            {"query": "fluke query", "clicks": 2, "cost": 5.0, "conversions": 1.0},
            {"query": "wasted query", "clicks": 18, "cost": 70.0, "conversions": 0.0},
        ]
        results = triage_batch(records)
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]["decision"], "PROMOTE")
        self.assertEqual(results[1]["decision"], "IGNORE")
        self.assertEqual(results[2]["decision"], "BLOCK")


if __name__ == "__main__":
    unittest.main()
