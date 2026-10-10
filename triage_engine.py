"""
triage_engine.py - Transparent Decision Engine for Google Ads Search Term Triage.

This module evaluates Google Ads search terms and assigns one of three actions:
  - PROMOTE: Add as an exact/phrase keyword we deliberately bid on.
  - BLOCK: Add as a negative keyword to stop paying for wasted spend.
  - IGNORE: Leave alone / abstain due to insufficient evidence or routine volume.

Designed for PPC analysts with transparent, explainable rules, small-sample
uncertainty protection, and configurable campaign goals.
"""

from typing import Any, Dict, List, Optional, Union
import math
import re


# Default configuration thresholds
# These represent sensible starting baselines that can be overridden per campaign.
DEFAULT_CONFIG: Dict[str, Any] = {
    # Sample size thresholds (Statistical prudence)
    "min_clicks_promote": 10,        # Minimum clicks required before considering a term proven
    "min_conversions_promote": 2,    # Minimum conversions required (never promote on a single fluke)
    "min_clicks_block": 15,          # Minimum clicks with zero conversions before blocking on volume

    # Financial / efficiency thresholds
    "target_cpa": 30.0,              # Target Cost Per Acquisition ($)
    "max_cpa_multiple": 2.0,         # Maximum allowable CPA multiplier (e.g., 2.0x = $60.0 max)
    "max_wasted_spend": 60.0,        # Maximum spend tolerated with 0 conversions before blocking ($)
    "target_roas": 2.0,              # Target Return On Ad Spend (Value / Cost), if applicable

    # Business context (Explicit negative / brand terms for the campaign)
    # If empty, the engine DOES NOT guess search intent or relevance.
    "negative_keywords": [],         # List of strings/tokens indicating non-commercial or irrelevant intent
    "brand_terms": [],               # List of recognized brand terms
}


def _safe_float(val: Any) -> Optional[float]:
    """Safely parse a numerical value to float, handling strings with currency or punctuation."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    if isinstance(val, str):
        cleaned = val.strip().replace("$", "").replace(",", "").replace("%", "")
        if cleaned == "" or cleaned.lower() in ("null", "none", "nan", "n/a"):
            return 0.0
        try:
            parsed = float(cleaned)
            if math.isnan(parsed) or math.isinf(parsed):
                return None
            return parsed
        except ValueError:
            return None
    return None


def _safe_int(val: Any) -> Optional[int]:
    """Safely parse a numerical value to integer."""
    flt = _safe_float(val)
    if flt is None:
        return None
    return int(round(flt))


def _clean_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize and extract fields from the raw input dictionary.
    Returns cleaned fields and an isValid flag.
    """
    raw_query = record.get("query")
    if raw_query is None or not isinstance(raw_query, str) or not raw_query.strip():
        query_str = str(raw_query).strip() if raw_query is not None else ""
        return {"query": query_str, "is_valid": False, "error": "Query text is empty or missing."}

    query = raw_query.strip()
    campaign = str(record.get("campaign") or "").strip()
    ad_group = str(record.get("ad_group") or "").strip()
    match_type = str(record.get("match_type") or "").strip()

    impressions = _safe_int(record.get("impressions"))
    clicks = _safe_int(record.get("clicks"))
    cost = _safe_float(record.get("cost"))
    conversions = _safe_float(record.get("conversions"))
    conversion_value = _safe_float(record.get("conversion_value"))

    # Check for invalid numerical fields (e.g., parse errors or negative metrics)
    if impressions is None or clicks is None or cost is None or conversions is None or conversion_value is None:
        return {"query": query, "is_valid": False, "error": "Record contains unparseable numerical values."}

    if impressions < 0 or clicks < 0 or cost < 0 or conversions < 0 or conversion_value < 0:
        return {"query": query, "is_valid": False, "error": "Record contains negative performance values."}

    return {
        "query": query,
        "campaign": campaign,
        "ad_group": ad_group,
        "match_type": match_type,
        "impressions": impressions,
        "clicks": clicks,
        "cost": cost,
        "conversions": conversions,
        "conversion_value": conversion_value,
        "is_valid": True,
        "error": None,
    }


def _get_campaign_config(campaign_name: str, config: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Merge default settings with user config and any campaign-specific overrides.
    """
    merged = dict(DEFAULT_CONFIG)
    if not config:
        return merged

    # First merge general config options
    for k, v in config.items():
        if k != "campaigns":
            merged[k] = v

    # Then check for campaign-specific overrides
    campaigns = config.get("campaigns", {})
    if campaign_name and campaign_name in campaigns:
        campaign_override = campaigns[campaign_name]
        if isinstance(campaign_override, dict):
            merged.update(campaign_override)

    return merged


def _matches_negative_context(query: str, negative_terms: List[str]) -> Optional[str]:
    """
    Check if the query matches any business-provided negative keywords.
    Only active if explicit negative terms are provided in the configuration.
    """
    if not negative_terms:
        return None
    
    query_lower = f" {query.lower()} "
    for term in negative_terms:
        term_clean = term.strip().lower()
        if not term_clean:
            continue
        # Check whole-word / phrase match
        pattern = r"\b" + re.escape(term_clean) + r"\b"
        if re.search(pattern, query_lower):
            return term
    return None


def triage_search_term(record: Dict[str, Any], config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Triages a single Google Ads search term record.

    Parameters:
        record: Dictionary containing:
            query, match_type, campaign, ad_group,
            impressions, clicks, cost, conversions, conversion_value.
        config: Optional configuration dictionary to customize thresholds,
            business negative terms, or campaign-specific goals.

    Returns:
        Dictionary containing:
            - query (str): The search query text.
            - decision (str): 'PROMOTE', 'BLOCK', or 'IGNORE'.
            - confidence (str): 'HIGH', 'MEDIUM', or 'LOW'.
            - reason (str): A concise, human-readable one-sentence explanation.
            - human_review (bool): True if human analyst intervention is needed.
    """
    cleaned = _clean_record(record)
    query = cleaned["query"]

    # RULE 1: Handle invalid or corrupted records safely
    if not cleaned["is_valid"]:
        return {
            "query": query,
            "decision": "IGNORE",
            "confidence": "LOW",
            "reason": f"Input validation failed: {cleaned['error']}",
            "human_review": True,
        }

    # Extract cleaned data
    campaign = cleaned["campaign"]
    impressions = cleaned["impressions"]
    clicks = cleaned["clicks"]
    cost = cleaned["cost"]
    conversions = cleaned["conversions"]
    conversion_value = cleaned["conversion_value"]

    # Resolve active configuration for this campaign
    cfg = _get_campaign_config(campaign, config)
    min_clicks_promote = cfg.get("min_clicks_promote", 10)
    min_conversions_promote = cfg.get("min_conversions_promote", 2)
    min_clicks_block = cfg.get("min_clicks_block", 15)
    target_cpa = cfg.get("target_cpa", 30.0)
    max_cpa_multiple = cfg.get("max_cpa_multiple", 2.0)
    max_wasted_spend = cfg.get("max_wasted_spend", target_cpa * max_cpa_multiple if target_cpa else 60.0)
    target_roas = cfg.get("target_roas")
    negative_keywords = cfg.get("negative_keywords", [])

    # RULE 2: Explicit Business / Campaign Negative Keywords Check
    # If the business provided negative keywords, block immediately if matched.
    # Note: If no negative keywords are configured, we DO NOT pretend to guess search intent.
    matched_negative = _matches_negative_context(query, negative_keywords)
    if matched_negative:
        return {
            "query": query,
            "decision": "BLOCK",
            "confidence": "HIGH",
            "reason": f"Query matches configured campaign negative term '{matched_negative}'.",
            "human_review": False,
        }

    # RULE 3: Small-Sample Uncertainty with Conversions (The Fluke Protection Rule)
    # A query with conversions (e.g. 1 conversion on 2 clicks) CANNOT be promoted
    # because small sample sizes are statistically noisy and not repeatable proof.
    if conversions > 0 and (clicks < min_clicks_promote or conversions < min_conversions_promote):
        return {
            "query": query,
            "decision": "IGNORE",
            "confidence": "LOW",
            "reason": (
                f"Generated {conversions:g} conversion(s) across {clicks} click(s), but sample size is too small "
                f"to prove repeatable performance."
            ),
            "human_review": True,
        }

    # RULE 4: Proven High Performers (PROMOTE)
    # Meets volume requirements AND satisfies efficiency goals (CPA or ROAS).
    if conversions >= min_conversions_promote and clicks >= min_clicks_promote:
        cpa = (cost / conversions) if conversions > 0 else float("inf")
        roas = (conversion_value / cost) if cost > 0 else 0.0

        # Sub-check A: Target CPA evaluation
        if target_cpa and target_cpa > 0:
            if cpa <= target_cpa:
                return {
                    "query": query,
                    "decision": "PROMOTE",
                    "confidence": "HIGH",
                    "reason": (
                        f"Demonstrated repeatable performance with {conversions:g} conversions across {clicks} clicks "
                        f"at an efficient CPA of ${cpa:.2f} (target: ${target_cpa:.2f})."
                    ),
                    "human_review": False,
                }
            elif cpa <= (target_cpa * max_cpa_multiple):
                return {
                    "query": query,
                    "decision": "PROMOTE",
                    "confidence": "MEDIUM",
                    "reason": (
                        f"Generated {conversions:g} conversions across {clicks} clicks, but CPA of ${cpa:.2f} is near "
                        f"the upper allowable limit of ${target_cpa * max_cpa_multiple:.2f}."
                    ),
                    "human_review": True,
                }
            else:
                # Conversions exist with high volume, but CPA is unsustainably high -> BLOCK
                return {
                    "query": query,
                    "decision": "BLOCK",
                    "confidence": "HIGH",
                    "reason": (
                        f"Generated {conversions:g} conversions across {clicks} clicks but at an unsustainable CPA of "
                        f"${cpa:.2f}, exceeding the maximum threshold of ${target_cpa * max_cpa_multiple:.2f}."
                    ),
                    "human_review": False,
                }

        # Sub-check B: Target ROAS evaluation (for ecommerce/value campaigns)
        if target_roas and target_roas > 0 and cost > 0:
            if roas >= target_roas:
                return {
                    "query": query,
                    "decision": "PROMOTE",
                    "confidence": "HIGH",
                    "reason": (
                        f"Achieved profitable ROAS of {roas:.2f}x across {clicks} clicks, exceeding the target of "
                        f"{target_roas:.2f}x."
                    ),
                    "human_review": False,
                }
            else:
                return {
                    "query": query,
                    "decision": "BLOCK",
                    "confidence": "MEDIUM",
                    "reason": (
                        f"ROAS of {roas:.2f}x across {clicks} clicks fell short of the campaign target of {target_roas:.2f}x."
                    ),
                    "human_review": True,
                }

        # Sub-check C: Volume proven without explicit financial target configured
        return {
            "query": query,
            "decision": "PROMOTE",
            "confidence": "MEDIUM",
            "reason": (
                f"Generated consistent conversion volume ({conversions:g} conversions from {clicks} clicks) "
                f"meeting volume criteria."
            ),
            "human_review": False,
        }

    # RULE 5: Wasted Spend / High Volume Non-Converters (BLOCK)
    # Only block zero-conversion queries when there is clear evidence of waste (clicks or spend).
    # Never block simply because conversions == 0 on low clicks!
    if conversions == 0:
        if cost >= max_wasted_spend:
            return {
                "query": query,
                "decision": "BLOCK",
                "confidence": "HIGH",
                "reason": (
                    f"Spent ${cost:.2f} across {clicks} clicks with zero conversions, exceeding the maximum wasted spend "
                    f"tolerance of ${max_wasted_spend:.2f}."
                ),
                "human_review": False,
            }
        if clicks >= min_clicks_block:
            return {
                "query": query,
                "decision": "BLOCK",
                "confidence": "HIGH",
                "reason": (
                    f"Accumulated {clicks} clicks without a single conversion, exceeding the non-converting click "
                    f"threshold of {min_clicks_block}."
                ),
                "human_review": False,
            }

    # RULE 6: Zero Clicks with High Impressions (Low CTR anomaly)
    if clicks == 0 and impressions >= 100:
        return {
            "query": query,
            "decision": "IGNORE",
            "confidence": "LOW",
            "reason": (
                f"Accumulated {impressions} impressions with 0 clicks; volume is too thin to block but warrants ad relevance review."
            ),
            "human_review": True,
        }

    # RULE 7: Low Volume / Insufficient Evidence (Default Abstention)
    # Routine search terms with low clicks and zero conversions are normal exploration.
    # We do NOT block them prematurely; we route them to human review if uncertain.
    return {
        "query": query,
        "decision": "IGNORE",
        "confidence": "LOW",
        "reason": (
            f"Insufficient volume ({clicks} click(s), ${cost:.2f} spend) to make a definitive promote or block decision."
        ),
        "human_review": True,
    }


# Aliases for seamless team integration
triage_query = triage_search_term
evaluate_query = triage_search_term


def triage_batch(records: List[Dict[str, Any]], config: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Convenience helper to triage a list of search term records in one call.
    """
    return [triage_search_term(record, config=config) for record in records]
