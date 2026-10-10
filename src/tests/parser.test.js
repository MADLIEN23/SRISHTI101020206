import { describe, it, expect } from 'vitest';
import { cleanNumber, detectColumnMapping, findHeaderRowIndex, isSummaryOrEmptyRow, parseGoogleAdsCSV } from '../utils/parser';

describe('Google Ads CSV Parser & Cleaner', () => {
  it('cleanNumber cleans currency symbols, percentages, and commas', () => {
    expect(cleanNumber('$1,250.50')).toBe(1250.5);
    expect(cleanNumber('€450.00')).toBe(450);
    expect(cleanNumber('£35.25')).toBe(35.25);
    expect(cleanNumber('12.5%')).toBe(12.5);
    expect(cleanNumber('< 10%')).toBe(10);
    expect(cleanNumber('--')).toBe(0);
    expect(cleanNumber('-')).toBe(0);
    expect(cleanNumber('')).toBe(0);
    expect(cleanNumber(null)).toBe(0);
    expect(cleanNumber(42)).toBe(42);
  });

  it('detectColumnMapping detects standard and alias Google Ads column names', () => {
    const headers = [
      'Search term',
      'Match type',
      'Added/Excluded',
      'Campaign',
      'Ad group',
      'Clicks',
      'Impressions',
      'Cost',
      'Conversions',
      'Cost / conv.',
      'Total conv. value',
    ];

    const mapping = detectColumnMapping(headers);
    expect(mapping.query).toBe(0);
    expect(mapping.matchType).toBe(1);
    expect(mapping.status).toBe(2);
    expect(mapping.campaign).toBe(3);
    expect(mapping.adGroup).toBe(4);
    expect(mapping.clicks).toBe(5);
    expect(mapping.impressions).toBe(6);
    expect(mapping.cost).toBe(7);
    expect(mapping.conversions).toBe(8);
    expect(mapping.cpa).toBe(9);
    expect(mapping.conversionValue).toBe(10);
  });

  it('findHeaderRowIndex detects header row when report has leading metadata rows', () => {
    const rawData = [
      ['Search terms report'],
      ['Jan 1, 2026 - Mar 31, 2026'],
      ['Search term', 'Clicks', 'Impressions', 'Cost', 'Conversions'],
      ['fleet tracking', '10', '100', '20.00', '1'],
    ];

    expect(findHeaderRowIndex(rawData)).toBe(2);
  });

  it('isSummaryOrEmptyRow correctly flags Google Ads Total summary rows', () => {
    expect(isSummaryOrEmptyRow('Total: Search terms', ['Total: Search terms', '10', '20'])).toBe(true);
    expect(isSummaryOrEmptyRow('Total: Other search terms', ['Total: Other search terms'])).toBe(true);
    expect(isSummaryOrEmptyRow('Total: Account', ['Total: Account'])).toBe(true);
    expect(isSummaryOrEmptyRow('--', ['--', '0', '0'])).toBe(true);
    expect(isSummaryOrEmptyRow('', ['', ''])).toBe(true);
    expect(isSummaryOrEmptyRow('valid search term', ['valid search term', '10', '100'])).toBe(false);
  });

  it('parseGoogleAdsCSV parses raw CSV string and returns normalized search queries', async () => {
    const csvContent = `Report Title
Date Range
Search term,Campaign,Clicks,Impressions,Cost,Conversions
"fleet gps software",Campaign A,25,500,$75.00,3
"free tracker",Campaign A,30,600,$45.00,0
Total: Search terms,Campaign A,55,1100,$120.00,3`;

    const result = await parseGoogleAdsCSV(csvContent);
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].query).toBe('fleet gps software');
    expect(result.rows[0].clicks).toBe(25);
    expect(result.rows[0].impressions).toBe(500);
    expect(result.rows[0].cost).toBe(75.0);
    expect(result.rows[0].conversions).toBe(3);
    expect(result.rows[0].cpa).toBe(25.0); // 75 / 3

    expect(result.rows[1].query).toBe('free tracker');
    expect(result.rows[1].conversions).toBe(0);
    expect(result.rows[1].cpa).toBeNull();
  });
});
