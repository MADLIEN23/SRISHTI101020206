import Papa from 'papaparse';
import { TRIAGE_STATUS } from './constants';

/**
 * Triggers a browser download of a CSV file
 * @param {string} csvContent
 * @param {string} fileName
 */
export function downloadCSV(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports blocked queries as a Google Ads Editor compatible Negative Keywords CSV
 * @param {Array<Object>} rows
 * @param {'phrase'|'exact'} matchFormat
 */
export function exportNegativeKeywordsCSV(rows = [], matchFormat = 'exact') {
  const blockedRows = rows.filter((r) => r.triageStatus === TRIAGE_STATUS.BLOCK);
  
  const formattedData = blockedRows.map((r) => {
    const formattedKeyword = matchFormat === 'phrase' ? `"${r.query}"` : `[${r.query}]`;
    const criterionType = matchFormat === 'phrase' ? 'Negative Phrase' : 'Negative Exact';
    
    return {
      'Campaign': r.campaign || 'All campaigns',
      'Ad group': r.adGroup || '',
      'Keyword': formattedKeyword,
      'Criterion Type': criterionType,
      'Status': 'Enabled',
      'Wasted Spend': `$${r.cost.toFixed(2)}`,
      'Clicks Wasted': r.clicks,
      'Reason': r.triageReason,
    };
  });

  const csv = Papa.unparse(formattedData);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `google_ads_negative_keywords_${matchFormat}_${timestamp}.csv`);
}

/**
 * Exports promoted queries as Google Ads Editor compatible Promoted Exact Keywords CSV
 * @param {Array<Object>} rows
 */
export function exportPromotedKeywordsCSV(rows = []) {
  const promotedRows = rows.filter((r) => r.triageStatus === TRIAGE_STATUS.PROMOTE);

  const formattedData = promotedRows.map((r) => {
    const suggestedBid = r.avgCpc > 0 ? (r.avgCpc * 1.15).toFixed(2) : '1.50';
    return {
      'Campaign': r.campaign || 'Default Campaign',
      'Ad group': r.adGroup || 'Dedicated Single Keyword Ad Group',
      'Keyword': `[${r.query}]`,
      'Criterion Type': 'Exact',
      'Max CPC': `$${suggestedBid}`,
      'Historical Conversions': r.conversions,
      'Historical CPA': r.cpa !== null ? `$${r.cpa.toFixed(2)}` : 'N/A',
      'Historical ROAS': r.roas > 0 ? `${r.roas.toFixed(2)}x` : 'N/A',
      'Status': 'Enabled',
      'Notes': r.triageReason,
    };
  });

  const csv = Papa.unparse(formattedData);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `google_ads_promoted_keywords_exact_${timestamp}.csv`);
}

/**
 * Exports complete triage audit with all metrics, scores, and classifications
 * @param {Array<Object>} rows
 */
export function exportFullAuditCSV(rows = []) {
  const formattedData = rows.map((r) => ({
    'Search Term': r.query,
    'Triage Action': r.triageStatus.toUpperCase(),
    'Urgency / Profit Score': r.urgencyScore,
    'Triage Rule': r.triageRule,
    'Reasoning': r.triageReason,
    'Suggested Action': r.suggestedAction,
    'User Overridden': r.overridden ? 'Yes' : 'No',
    'Campaign': r.campaign,
    'Ad Group': r.adGroup,
    'Match Type': r.matchType,
    'Added/Excluded': r.status,
    'Cost ($)': r.cost.toFixed(2),
    'Clicks': r.clicks,
    'Impressions': r.impressions,
    'CTR (%)': `${r.ctr.toFixed(2)}%`,
    'Avg CPC ($)': r.avgCpc.toFixed(2),
    'Conversions': r.conversions,
    'Cost / Conv ($)': r.cpa !== null ? r.cpa.toFixed(2) : '--',
    'Conv Rate (%)': `${r.convRate.toFixed(2)}%`,
    'Conversion Value ($)': r.conversionValue.toFixed(2),
    'ROAS': r.roas > 0 ? r.roas.toFixed(2) : '--',
  }));

  const csv = Papa.unparse(formattedData);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `google_ads_full_triage_audit_${timestamp}.csv`);
}

/**
 * Copies negative keywords list to clipboard formatted for Google Ads UI
 * @param {Array<Object>} rows
 * @param {'phrase'|'exact'} matchFormat
 * @returns {Promise<number>} number of copied items
 */
export async function copyNegativesToClipboard(rows = [], matchFormat = 'exact') {
  const blockedRows = rows.filter((r) => r.triageStatus === TRIAGE_STATUS.BLOCK);
  const text = blockedRows
    .map((r) => (matchFormat === 'phrase' ? `"${r.query}"` : `[${r.query}]`))
    .join('\n');

  await navigator.clipboard.writeText(text);
  return blockedRows.length;
}

/**
 * Copies promoted keywords list to clipboard
 * @param {Array<Object>} rows
 * @returns {Promise<number>} number of copied items
 */
export async function copyPromotedToClipboard(rows = []) {
  const promotedRows = rows.filter((r) => r.triageStatus === TRIAGE_STATUS.PROMOTE);
  const text = promotedRows.map((r) => `[${r.query}]`).join('\n');

  await navigator.clipboard.writeText(text);
  return promotedRows.length;
}
