import { TRIAGE_STATUS, DEFAULT_CONFIG } from './constants';

/**
 * Normalizes query string for keyword matching
 * @param {string} text
 * @returns {string}
 */
export function normalizeQuery(text) {
  if (!text) return '';
  return String(text).toLowerCase().trim();
}

/**
 * Checks if a query contains any stopword as a whole word or significant substring
 * @param {string} query
 * @param {string[]} stopwords
 * @returns {string|null} matched stopword or null
 */
export function findMatchingStopword(query, stopwords = []) {
  if (!query || !stopwords || stopwords.length === 0) return null;
  const normalized = normalizeQuery(query);
  
  for (const word of stopwords) {
    const cleanWord = normalizeQuery(word);
    if (!cleanWord) continue;
    
    // Check as word boundary or exact phrase match
    const regex = new RegExp(`(^|\\b|\\s)${escapeRegex(cleanWord)}(\\b|\\s|$)`, 'i');
    if (regex.test(normalized)) {
      return word;
    }
  }
  return null;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Triages a single search query against the ruleset
 * @param {Object} row - Parsed search term metrics
 * @param {Object} userConfig - User configuration thresholds
 * @returns {Object} Triage result with status, rule, reason, urgencyScore, suggestedAction
 */
export function triageQuery(row, userConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  
  const query = String(row.query || '').trim();
  const cost = Number(row.cost) || 0;
  const clicks = Number(row.clicks) || 0;
  const impressions = Number(row.impressions) || 0;
  const conversions = Number(row.conversions) || 0;
  const conversionValue = Number(row.conversionValue) || 0;
  
  // Derived metrics
  const cpa = conversions > 0 ? cost / conversions : null;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const convRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const roas = cost > 0 ? conversionValue / cost : 0;
  const avgCpc = clicks > 0 ? cost / clicks : 0;

  // 1. Check if user manually overrode the status
  if (row.userOverride && Object.values(TRIAGE_STATUS).includes(row.userOverride)) {
    return {
      status: row.userOverride,
      rule: 'Manual Override',
      reason: `Manually set by user to ${row.userOverride.toUpperCase()}`,
      urgencyScore: row.userOverride === TRIAGE_STATUS.PROMOTE ? 85 : row.userOverride === TRIAGE_STATUS.BLOCK ? -85 : 0,
      overridden: true,
      suggestedAction: getSuggestedAction(row.userOverride, query, avgCpc, config),
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 2. Rule: Negative stopword match with 0 conversions
  const matchedStopword = findMatchingStopword(query, config.negativeStopwords);
  if (matchedStopword && conversions === 0) {
    const score = Math.max(-100, Math.round(-60 - Math.min(35, cost * 0.5)));
    return {
      status: TRIAGE_STATUS.BLOCK,
      rule: 'Negative Stopword Match',
      matchedToken: matchedStopword,
      reason: `Contains negative stopword "${matchedStopword}" with 0 conversions ($${cost.toFixed(2)} spent)`,
      urgencyScore: score,
      overridden: false,
      suggestedAction: `Add "${matchedStopword}" or [${query}] as negative keyword`,
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 3. Rule: Bleeder (High spend, zero conversions)
  if (conversions === 0 && cost >= config.bleederSpendThreshold) {
    const score = Math.max(-100, Math.round(-70 - Math.min(30, (cost / config.bleederSpendThreshold) * 10)));
    return {
      status: TRIAGE_STATUS.BLOCK,
      rule: 'Bleeder: Zero Conversions',
      reason: `$${cost.toFixed(2)} spent with 0 conversions (Exceeds $${config.bleederSpendThreshold.toFixed(2)} threshold)`,
      urgencyScore: score,
      overridden: false,
      suggestedAction: `Add [${query}] as exact negative to save $${cost.toFixed(2)} recurring spend`,
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 4. Rule: Click Burner (High clicks, zero conversions)
  if (conversions === 0 && clicks >= config.maxClicksWithoutConversion) {
    const score = Math.max(-100, Math.round(-55 - Math.min(35, clicks * 1.2)));
    return {
      status: TRIAGE_STATUS.BLOCK,
      rule: 'Click Burner: Zero Conversions',
      reason: `${clicks} clicks with 0 conversions ($${cost.toFixed(2)} spent, max allowed: ${config.maxClicksWithoutConversion})`,
      urgencyScore: score,
      overridden: false,
      suggestedAction: `Add [${query}] as negative keyword immediately`,
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 5. Rule: Runaway Unprofitable CPA
  if (conversions > 0 && cpa > config.maxCPA && cost >= config.minSpendForHighCPA) {
    const excess = cpa - config.maxCPA;
    const score = Math.max(-100, Math.round(-40 - Math.min(45, (excess / config.maxCPA) * 50)));
    return {
      status: TRIAGE_STATUS.BLOCK,
      rule: 'Unprofitable High CPA',
      reason: `CPA of $${cpa.toFixed(2)} exceeds maximum acceptable limit of $${config.maxCPA.toFixed(2)} ($${cost.toFixed(2)} spent)`,
      urgencyScore: score,
      overridden: false,
      suggestedAction: `Negative match or drastically lower keyword bid`,
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 6. Rule: Ghost Broad Match Impressions (High impressions, abysmal CTR, 0 conv)
  if (conversions === 0 && impressions >= 800 && ctr < config.lowCtrThreshold) {
    return {
      status: TRIAGE_STATUS.BLOCK,
      rule: 'Ghost Impressions / Poor CTR',
      reason: `Very low relevance: ${impressions.toLocaleString()} impressions with ${ctr.toFixed(2)}% CTR and 0 conversions`,
      urgencyScore: -35,
      overridden: false,
      suggestedAction: `Add as negative phrase to improve account Quality Score`,
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 7. Rule: Star Converter (Promote)
  // High conversions and efficient CPA or high ROAS
  if (conversions >= config.minConversionsForPromote && (cpa <= config.targetCPA * 1.15 || (conversionValue > 0 && roas >= config.targetROAS))) {
    const score = Math.min(100, Math.round(50 + Math.min(30, conversions * 6) + (roas > 0 ? Math.min(20, roas * 4) : 10)));
    const cpaNote = cpa !== null ? `$${cpa.toFixed(2)} CPA (Target: $${config.targetCPA.toFixed(2)})` : '';
    const roasNote = roas > 0 ? ` • ${roas.toFixed(2)}x ROAS` : '';
    return {
      status: TRIAGE_STATUS.PROMOTE,
      rule: 'Star Converter',
      reason: `${conversions} conversions @ ${cpaNote}${roasNote}`,
      urgencyScore: score,
      overridden: false,
      suggestedAction: `Promote to Exact Match [${query}] with dedicated bid ~$${Math.max(avgCpc * 1.1, 0.5).toFixed(2)}`,
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 8. Rule: High ROAS Performer (Promote)
  if (conversions >= 1 && conversionValue > 0 && roas >= config.targetROAS * 1.25 && cost >= 15) {
    const score = Math.min(100, Math.round(60 + Math.min(35, roas * 6)));
    return {
      status: TRIAGE_STATUS.PROMOTE,
      rule: 'High ROAS Performer',
      reason: `High return: ${roas.toFixed(2)}x ROAS ($${conversionValue.toFixed(2)} revenue on $${cost.toFixed(2)} spend)`,
      urgencyScore: score,
      overridden: false,
      suggestedAction: `Promote to Exact Match [${query}] to capture more high-value revenue`,
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 9. Rule: High Intent Converter (Promote)
  if (conversions >= 1 && convRate >= 12 && cpa <= config.targetCPA * 0.85 && clicks >= 6) {
    const score = Math.min(100, Math.round(45 + Math.min(35, convRate * 1.5)));
    return {
      status: TRIAGE_STATUS.PROMOTE,
      rule: 'High Intent Converter',
      reason: `Strong ${convRate.toFixed(1)}% conversion rate @ efficient $${cpa.toFixed(2)} CPA (${conversions} conv)`,
      urgencyScore: score,
      overridden: false,
      suggestedAction: `Promote to Exact Match [${query}] and isolate in single keyword ad group`,
      metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
    };
  }

  // 10. Default: Ignore / Inconclusive (Monitor)
  let ignoreReason = '';
  if (conversions === 0) {
    ignoreReason = `Inconclusive: ${clicks} click(s), $${cost.toFixed(2)} spend (below bleeder threshold of $${config.bleederSpendThreshold.toFixed(2)}). Continue monitoring.`;
  } else {
    ignoreReason = `Moderate performance: ${conversions} conv @ $${cpa.toFixed(2)} CPA (Target: $${config.targetCPA.toFixed(2)}). Needs more volume before promoting.`;
  }

  return {
    status: TRIAGE_STATUS.IGNORE,
    rule: 'Inconclusive / Monitor',
    reason: ignoreReason,
    urgencyScore: 0,
    overridden: false,
    suggestedAction: 'Keep running and monitor performance until reaching statistical threshold',
    metrics: { cost, clicks, impressions, conversions, conversionValue, cpa, ctr, convRate, roas, avgCpc },
  };
}

function getSuggestedAction(status, query, avgCpc, config) {
  if (status === TRIAGE_STATUS.PROMOTE) {
    return `Add [${query}] as exact match keyword (suggested bid: $${Math.max(avgCpc * 1.1, 0.5).toFixed(2)})`;
  }
  if (status === TRIAGE_STATUS.BLOCK) {
    return `Add [${query}] as negative keyword to stop ad spend`;
  }
  return `Keep monitoring search term in existing campaign`;
}

/**
 * Triages an entire array of search term items and computes summary aggregates
 * @param {Array<Object>} rows
 * @param {Object} config
 * @returns {Object} { triagedRows, summary }
 */
export function triageAllQueries(rows = [], config = {}) {
  let promoteCount = 0;
  let blockCount = 0;
  let ignoreCount = 0;
  let overriddenCount = 0;

  let totalSpend = 0;
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  let bleederSpendSaved = 0;
  let promotedSpend = 0;
  let promotedConversions = 0;
  let promotedRevenue = 0;
  let ignoredSpend = 0;

  const triagedRows = rows.map((row, index) => {
    const result = triageQuery(row, config);
    const { cost, clicks, impressions, conversions, conversionValue } = result.metrics;

    totalSpend += cost;
    totalClicks += clicks;
    totalImpressions += impressions;
    totalConversions += conversions;
    totalRevenue += conversionValue;

    if (result.overridden) overriddenCount++;

    if (result.status === TRIAGE_STATUS.PROMOTE) {
      promoteCount++;
      promotedSpend += cost;
      promotedConversions += conversions;
      promotedRevenue += conversionValue;
    } else if (result.status === TRIAGE_STATUS.BLOCK) {
      blockCount++;
      bleederSpendSaved += cost;
    } else {
      ignoreCount++;
      ignoredSpend += cost;
    }

    return {
      ...row,
      id: row.id || `query-${index}`,
      triageStatus: result.status,
      triageRule: result.rule,
      triageReason: result.reason,
      urgencyScore: result.urgencyScore,
      suggestedAction: result.suggestedAction,
      matchedToken: result.matchedToken || null,
      overridden: Boolean(result.overridden),
      // Clean metric values attached to row
      cost,
      clicks,
      impressions,
      conversions,
      conversionValue,
      cpa: result.metrics.cpa,
      ctr: result.metrics.ctr,
      convRate: result.metrics.convRate,
      roas: result.metrics.roas,
      avgCpc: result.metrics.avgCpc,
    };
  });

  const overallCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const promotedCPA = promotedConversions > 0 ? promotedSpend / promotedConversions : 0;
  const promotedROAS = promotedSpend > 0 ? promotedRevenue / promotedSpend : 0;
  const bleederSpendPercent = totalSpend > 0 ? (bleederSpendSaved / totalSpend) * 100 : 0;

  const summary = {
    totalQueries: rows.length,
    promoteCount,
    blockCount,
    ignoreCount,
    overriddenCount,
    totalSpend,
    totalClicks,
    totalImpressions,
    totalConversions,
    totalRevenue,
    overallCPA,
    overallROAS,
    bleederSpendSaved,
    bleederSpendPercent,
    promotedSpend,
    promotedConversions,
    promotedRevenue,
    promotedCPA,
    promotedROAS,
    ignoredSpend,
    // Projected monthly waste reduction: based on bleeder spend in this period
    projectedMonthlySavings: bleederSpendSaved,
  };

  return { triagedRows, summary };
}
