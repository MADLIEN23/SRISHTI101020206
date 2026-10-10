import { describe, it, expect } from 'vitest';
import { triageQuery, triageAllQueries, findMatchingStopword } from '../utils/triageAlgorithm';
import { TRIAGE_STATUS, DEFAULT_CONFIG } from '../utils/constants';

describe('Triage Algorithm Rules', () => {
  const config = {
    ...DEFAULT_CONFIG,
    targetCPA: 40.0,
    maxCPA: 80.0,
    minConversionsForPromote: 2,
    bleederSpendThreshold: 50.0,
    maxClicksWithoutConversion: 20,
    targetROAS: 2.5,
  };

  it('should triage high spend with 0 conversions as BLOCK (Bleeder)', () => {
    const row = {
      query: 'expensive fleet tracking test',
      cost: 75.50,
      clicks: 15,
      impressions: 400,
      conversions: 0,
      conversionValue: 0,
    };

    const result = triageQuery(row, config);
    expect(result.status).toBe(TRIAGE_STATUS.BLOCK);
    expect(result.rule).toContain('Bleeder');
    expect(result.urgencyScore).toBeLessThan(0);
  });

  it('should triage high clicks with 0 conversions as BLOCK (Click Burner)', () => {
    const row = {
      query: 'gps navigation app download',
      cost: 35.00, // below spend threshold
      clicks: 25, // above click threshold (20)
      impressions: 600,
      conversions: 0,
      conversionValue: 0,
    };

    const result = triageQuery(row, config);
    expect(result.status).toBe(TRIAGE_STATUS.BLOCK);
    expect(result.rule).toContain('Click Burner');
  });

  it('should triage query matching negative stopwords with 0 conversions as BLOCK', () => {
    const row = {
      query: 'free fleet management excel sheet',
      cost: 15.00,
      clicks: 8,
      impressions: 250,
      conversions: 0,
      conversionValue: 0,
    };

    const result = triageQuery(row, config);
    expect(result.status).toBe(TRIAGE_STATUS.BLOCK);
    expect(result.rule).toBe('Negative Stopword Match');
    expect(result.matchedToken).toBe('free');
  });

  it('should triage runaway CPA exceeding maxCPA as BLOCK', () => {
    const row = {
      query: 'fleet consulting agency',
      cost: 180.00,
      clicks: 30,
      impressions: 500,
      conversions: 1, // 1 conversion at $180 CPA, max is $80
      conversionValue: 50.00,
    };

    const result = triageQuery(row, config);
    expect(result.status).toBe(TRIAGE_STATUS.BLOCK);
    expect(result.rule).toBe('Unprofitable High CPA');
  });

  it('should triage high-converting efficient CPA terms as PROMOTE', () => {
    const row = {
      query: 'enterprise fleet tracking software',
      cost: 120.00,
      clicks: 30,
      impressions: 450,
      conversions: 4, // $30 CPA vs $40 target
      conversionValue: 900.00,
    };

    const result = triageQuery(row, config);
    expect(result.status).toBe(TRIAGE_STATUS.PROMOTE);
    expect(result.rule).toBe('Star Converter');
    expect(result.urgencyScore).toBeGreaterThan(0);
  });

  it('should triage high ROAS winners as PROMOTE', () => {
    const row = {
      query: 'bus route dispatch platform',
      cost: 40.00,
      clicks: 10,
      impressions: 200,
      conversions: 1,
      conversionValue: 240.00, // 6.0x ROAS
    };

    const result = triageQuery(row, config);
    expect(result.status).toBe(TRIAGE_STATUS.PROMOTE);
    expect(result.rule).toBe('High ROAS Performer');
  });

  it('should triage low volume queries as IGNORE (Monitor)', () => {
    const row = {
      query: 'new specialized fuel card reviews',
      cost: 12.00,
      clicks: 3,
      impressions: 80,
      conversions: 0,
      conversionValue: 0,
    };

    const result = triageQuery(row, config);
    expect(result.status).toBe(TRIAGE_STATUS.IGNORE);
    expect(result.rule).toBe('Inconclusive / Monitor');
    expect(result.urgencyScore).toBe(0);
  });

  it('should respect manual user overrides', () => {
    const row = {
      query: 'new specialized fuel card reviews',
      cost: 12.00,
      clicks: 3,
      impressions: 80,
      conversions: 0,
      conversionValue: 0,
      userOverride: TRIAGE_STATUS.PROMOTE,
    };

    const result = triageQuery(row, config);
    expect(result.status).toBe(TRIAGE_STATUS.PROMOTE);
    expect(result.overridden).toBe(true);
    expect(result.rule).toBe('Manual Override');
  });

  it('should aggregate summary metrics correctly for all queries', () => {
    const rows = [
      // Promote
      { query: 'query1', cost: 100, clicks: 20, impressions: 200, conversions: 4, conversionValue: 500 },
      // Block (Bleeder)
      { query: 'query2', cost: 80, clicks: 15, impressions: 300, conversions: 0, conversionValue: 0 },
      // Ignore
      { query: 'query3', cost: 10, clicks: 2, impressions: 50, conversions: 0, conversionValue: 0 },
    ];

    const { triagedRows, summary } = triageAllQueries(rows, config);

    expect(summary.totalQueries).toBe(3);
    expect(summary.promoteCount).toBe(1);
    expect(summary.blockCount).toBe(1);
    expect(summary.ignoreCount).toBe(1);
    expect(summary.totalSpend).toBe(190);
    expect(summary.bleederSpendSaved).toBe(80);
    expect(summary.promotedConversions).toBe(4);
    expect(triagedRows.length).toBe(3);
  });
});
