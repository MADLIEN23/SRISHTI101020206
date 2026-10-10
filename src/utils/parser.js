import Papa from 'papaparse';

/**
 * Strips currency symbols, percentage signs, commas, and formatting from numeric strings
 * @param {any} val
 * @returns {number}
 */
export function cleanNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim();
  if (str === '' || str === '--' || str === '-' || str === 'N/A' || str === 'null') {
    return 0;
  }
  
  // Remove commas, currencies, spaces, quotes
  str = str.replace(/[$,€£₹¥\s"']/g, '');
  
  // Handle percentage (keep as standard percentage value, e.g. "5.4%" -> 5.4)
  if (str.endsWith('%')) {
    str = str.slice(0, -1);
  }
  // Handle "< 10%" or "> 90%"
  str = str.replace(/^[<>~]/, '');

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

const COLUMN_ALIASES = {
  query: ['search term', 'search query', 'query', 'user query', 'keyword text', 'search_term'],
  matchType: ['match type', 'keyword match type', 'match_type'],
  status: ['added/excluded', 'added / excluded', 'status', 'keyword status'],
  campaign: ['campaign', 'campaign name', 'campaign_name'],
  adGroup: ['ad group', 'ad group name', 'adgroup', 'ad_group'],
  clicks: ['clicks', 'clicks (all)', 'total clicks'],
  impressions: ['impressions', 'impr.', 'impr', 'total impressions'],
  ctr: ['ctr', 'click through rate', 'click-through rate'],
  avgCpc: ['avg. cpc', 'avg cpc', 'average cpc', 'cpc'],
  cost: ['cost', 'spend', 'cost (usd)', 'cost (eur)', 'cost (gbp)', 'cost (inr)', 'cost / spent', 'total cost'],
  conversions: ['conversions', 'conv.', 'conv', 'all conv.', 'conversions (all)'],
  cpa: ['cost / conv.', 'cost per conv.', 'cost / conv', 'cost/conv.', 'cpa'],
  convRate: ['conv. rate', 'conversion rate', 'conv rate', 'all conv. rate'],
  conversionValue: ['conv. value', 'total conv. value', 'conversion value', 'all conv. value', 'conv value', 'value', 'revenue'],
  roas: ['conv. value / cost', 'roas', 'conv. value/cost', 'return on ad spend'],
};

/**
 * Maps raw CSV headers to standardized field names
 * @param {string[]} headers
 * @returns {Object} { [standardKey]: rawHeaderIndex }
 */
export function detectColumnMapping(headers = []) {
  const mapping = {};
  const normalizedHeaders = headers.map((h) => String(h || '').trim().toLowerCase());

  for (const [standardKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalizedHeaders.findIndex((nh) => nh === alias || nh.startsWith(alias) || nh.includes(alias));
      if (idx !== -1 && mapping[standardKey] === undefined) {
        mapping[standardKey] = idx;
        break;
      }
    }
  }

  return mapping;
}

/**
 * Finds the index of the header row in raw 2D array data (skips report title/date rows)
 * @param {Array<Array<any>>} rows
 * @returns {number} 0-based index of header row, or -1 if not found
 */
export function findHeaderRowIndex(rows = []) {
  const targetTerms = ['search term', 'search query', 'query', 'clicks', 'cost', 'impressions'];

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rowStrings = row.map((cell) => String(cell || '').trim().toLowerCase());
    const matchCount = targetTerms.filter((term) => rowStrings.some((s) => s.includes(term))).length;

    // If at least 2 key terms match, this is our header row
    if (matchCount >= 2) {
      return i;
    }
  }

  return 0; // Default to first row
}

/**
 * Checks if a parsed row is a Google Ads summary / footer row or empty
 * @param {string} query
 * @param {Array<any>} rawRow
 * @returns {boolean}
 */
export function isSummaryOrEmptyRow(query, rawRow = []) {
  if (!query || query.trim() === '') return true;
  const lower = query.trim().toLowerCase();
  
  if (lower.startsWith('total:') || lower.startsWith('total') || lower === '--' || lower === 'summary') {
    return true;
  }

  // Check if every other item is empty
  const nonEmptyCount = rawRow.filter((c) => String(c || '').trim() !== '').length;
  if (nonEmptyCount <= 1) return true;

  return false;
}

/**
 * Parses raw Google Ads CSV text or File using PapaParse
 * @param {File|string} input - File object or CSV string
 * @param {Object} options - PapaParse options
 * @returns {Promise<{ rows: Array<Object>, mapping: Object, meta: Object }>}
 */
export function parseGoogleAdsCSV(input, options = {}) {
  return new Promise((resolve, reject) => {
    Papa.parse(input, {
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      ...options,
      complete: (results) => {
        try {
          const rawData = results.data;
          if (!rawData || rawData.length === 0) {
            return reject(new Error('The CSV file appears to be completely empty.'));
          }

          const headerIndex = findHeaderRowIndex(rawData);
          const rawHeaders = rawData[headerIndex];
          const mapping = detectColumnMapping(rawHeaders);

          if (mapping.query === undefined) {
            return reject(new Error(
              'Could not locate a "Search term" or "Query" column in your CSV. ' +
              'Please ensure this is a standard Google Ads Search Terms report export.'
            ));
          }

          const dataRows = rawData.slice(headerIndex + 1);
          const parsedRows = [];

          dataRows.forEach((row, idx) => {
            const queryRaw = mapping.query !== undefined ? row[mapping.query] : null;
            const query = String(queryRaw || '').trim();

            if (isSummaryOrEmptyRow(query, row)) {
              return; // Skip summary / total row
            }

            const clicks = cleanNumber(mapping.clicks !== undefined ? row[mapping.clicks] : 0);
            const impressions = cleanNumber(mapping.impressions !== undefined ? row[mapping.impressions] : 0);
            const cost = cleanNumber(mapping.cost !== undefined ? row[mapping.cost] : 0);
            const conversions = cleanNumber(mapping.conversions !== undefined ? row[mapping.conversions] : 0);
            const conversionValue = cleanNumber(mapping.conversionValue !== undefined ? row[mapping.conversionValue] : 0);

            // CTR
            let ctr = cleanNumber(mapping.ctr !== undefined ? row[mapping.ctr] : 0);
            if (ctr === 0 && impressions > 0 && clicks > 0) {
              ctr = (clicks / impressions) * 100;
            }

            // Avg CPC
            let avgCpc = cleanNumber(mapping.avgCpc !== undefined ? row[mapping.avgCpc] : 0);
            if (avgCpc === 0 && clicks > 0 && cost > 0) {
              avgCpc = cost / clicks;
            }

            // CPA
            let cpa = cleanNumber(mapping.cpa !== undefined ? row[mapping.cpa] : 0);
            if (cpa === 0 && conversions > 0 && cost > 0) {
              cpa = cost / conversions;
            }

            // Conversion rate
            let convRate = cleanNumber(mapping.convRate !== undefined ? row[mapping.convRate] : 0);
            if (convRate === 0 && clicks > 0 && conversions > 0) {
              convRate = (conversions / clicks) * 100;
            }

            // ROAS
            let roas = cleanNumber(mapping.roas !== undefined ? row[mapping.roas] : 0);
            if (roas === 0 && cost > 0 && conversionValue > 0) {
              roas = conversionValue / cost;
            }

            parsedRows.push({
              id: `q-${idx + 1}-${query.slice(0, 10).replace(/\s+/g, '_')}`,
              query,
              matchType: mapping.matchType !== undefined && row[mapping.matchType] ? String(row[mapping.matchType]).trim() : 'Broad',
              status: mapping.status !== undefined && row[mapping.status] ? String(row[mapping.status]).trim() : 'None',
              campaign: mapping.campaign !== undefined && row[mapping.campaign] ? String(row[mapping.campaign]).trim() : 'Search Campaign',
              adGroup: mapping.adGroup !== undefined && row[mapping.adGroup] ? String(row[mapping.adGroup]).trim() : 'Default Ad Group',
              clicks,
              impressions,
              cost,
              conversions,
              conversionValue,
              ctr,
              avgCpc,
              cpa: conversions > 0 ? cpa : null,
              convRate,
              roas,
            });
          });

          if (parsedRows.length === 0) {
            return reject(new Error('No valid search query rows were found in the uploaded file after filtering.'));
          }

          resolve({
            rows: parsedRows,
            mapping,
            headers: rawHeaders,
            meta: {
              totalRowsRaw: rawData.length,
              headerRowIndex: headerIndex,
              validRowsParsed: parsedRows.length,
            },
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(new Error(`CSV parsing error: ${err.message}`));
      },
    });
  });
}
