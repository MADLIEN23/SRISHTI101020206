import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Check, 
  Sparkles, 
  Ban, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Tag
} from 'lucide-react';
import { TRIAGE_STATUS, STATUS_COLORS } from '../utils/constants';

export default function DataTable({ 
  rows = [], 
  activeTab, 
  setActiveTab, 
  onOverrideRow, 
  onBatchOverride,
  summary
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatchType, setSelectedMatchType] = useState('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState('ALL');
  
  // Sorting state
  const [sortField, setSortField] = useState('urgencyScore');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Row selection state for batch actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  // Unique campaigns for filter
  const campaignOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r.campaign) set.add(r.campaign);
    });
    return Array.from(set).sort();
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Tab filter
      if (activeTab === 'promote' && r.triageStatus !== TRIAGE_STATUS.PROMOTE) return false;
      if (activeTab === 'block' && r.triageStatus !== TRIAGE_STATUS.BLOCK) return false;
      if (activeTab === 'ignore' && r.triageStatus !== TRIAGE_STATUS.IGNORE) return false;
      if (activeTab === 'overridden' && !r.overridden) return false;

      // Match type filter
      if (selectedMatchType !== 'ALL' && r.matchType.toLowerCase() !== selectedMatchType.toLowerCase()) {
        return false;
      }

      // Campaign filter
      if (selectedCampaign !== 'ALL' && r.campaign !== selectedCampaign) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = r.query.toLowerCase().includes(q);
        const matchesCampaign = (r.campaign || '').toLowerCase().includes(q);
        const matchesReason = (r.triageReason || '').toLowerCase().includes(q);
        const matchesRule = (r.triageRule || '').toLowerCase().includes(q);
        if (!matchesQuery && !matchesCampaign && !matchesReason && !matchesRule) {
          return false;
        }
      }

      return true;
    });
  }, [rows, activeTab, selectedMatchType, selectedCampaign, searchQuery]);

  // Sorted rows
  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) aVal = -Infinity;
      if (bVal === null || bVal === undefined) bVal = -Infinity;

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [filteredRows, sortField, sortDirection]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    if (pageSize === 'ALL') return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(sortedRows.length / pageSize) || 1;

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to desc for metrics, asc for strings/urgency
      setSortDirection(['cost', 'conversions', 'clicks', 'roas'].includes(field) ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginatedRows.map((r) => r.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id));
    } else {
      pageIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const handleCopyQuery = async (queryText, rowId) => {
    try {
      await navigator.clipboard.writeText(queryText);
      setCopiedId(rowId);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // fallback
    }
  };

  const handleBatchAction = (newStatus) => {
    if (selectedIds.size === 0) return;
    onBatchOverride(Array.from(selectedIds), newStatus);
    setSelectedIds(new Set());
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Tabs Header */}
      <div className="px-4 pt-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0">
          <button
            type="button"
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            All Queries
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px]">
              {rows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('promote'); setCurrentPage(1); }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'promote'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Promote
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px]">
              {summary ? summary.promoteCount : 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('block'); setCurrentPage(1); }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'block'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/30'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            Block (Bleeders)
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 text-[10px]">
              {summary ? summary.blockCount : 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('ignore'); setCurrentPage(1); }}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ignore'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Ignore / Monitor
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px]">
              {summary ? summary.ignoreCount : 0}
            </span>
          </button>

          {summary && summary.overriddenCount > 0 && (
            <button
              type="button"
              onClick={() => { setActiveTab('overridden'); setCurrentPage(1); }}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overridden'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
              }`}
            >
              Overridden
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 text-[10px]">
                {summary.overriddenCount}
              </span>
            </button>
          )}
        </div>

        {/* Quick count of visible rows */}
        <div className="text-xs text-slate-400 pb-2 sm:pb-0">
          Showing <span className="font-semibold text-white">{filteredRows.length}</span> queries
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search query text, campaign, rule, or reason..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Match Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMatchType}
              onChange={(e) => { setSelectedMatchType(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Match Types</option>
              <option value="Exact">Exact Match</option>
              <option value="Phrase">Phrase Match</option>
              <option value="Broad">Broad Match</option>
            </select>
          </div>

          {/* Campaign Filter */}
          {campaignOptions.length > 1 && (
            <select
              value={selectedCampaign}
              onChange={(e) => { setSelectedCampaign(e.target.value); setCurrentPage(1); }}
              className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">All Campaigns</option>
              {campaignOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Rows per page */}
          <select
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              setPageSize(val);
              setCurrentPage(1);
            }}
            className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={15}>15 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value="ALL">View All</option>
          </select>
        </div>

      </div>

      {/* Batch Operations Bar (Floats or appears when rows selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-950/70 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-300">{selectedIds.size} queries selected</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-indigo-400 hover:text-white underline cursor-pointer"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Batch triage to:</span>
            <button
              type="button"
              onClick={() => handleBatchAction(TRIAGE_STATUS.PROMOTE)}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Promote
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction(TRIAGE_STATUS.BLOCK)}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Ban className="w-3 h-3" />
              Block
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction(TRIAGE_STATUS.IGNORE)}
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Clock className="w-3 h-3" />
              Ignore
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium select-none">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={paginatedRows.length > 0 && paginatedRows.every((r) => selectedIds.has(r.id))}
                  onChange={toggleSelectAllPage}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </th>
              
              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('query')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Search Term & Details</span>
                  {sortField === 'query' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>

              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('urgencyScore')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Triage Decision</span>
                  {sortField === 'urgencyScore' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>

              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort('cost')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Cost</span>
                  {sortField === 'cost' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>

              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort('clicks')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Clicks / Impr</span>
                  {sortField === 'clicks' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>

              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort('conversions')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Conversions / CPA</span>
                  {sortField === 'conversions' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>

              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200 text-right"
                onClick={() => handleSort('roas')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>ROAS / Value</span>
                  {sortField === 'roas' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </div>
              </th>

              <th className="py-3 px-4 text-center">
                <span>Action Override</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No search queries match the active filters or search terms.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const isSelected = selectedIds.has(row.id);
                const isCopied = copiedId === row.id;
                const statusStyle = STATUS_COLORS[row.triageStatus] || STATUS_COLORS.ignore;

                return (
                  <tr 
                    key={row.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Query & Metadata */}
                    <td className="py-3 px-3 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-100 text-[13px]">{row.query}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyQuery(row.query, row.id)}
                          title="Copy search query"
                          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {row.matchType}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[140px]" title={row.campaign}>
                          {row.campaign}
                        </span>
                        {row.adGroup && (
                          <>
                            <span>/</span>
                            <span className="truncate max-w-[120px] text-slate-500" title={row.adGroup}>
                              {row.adGroup}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Triage Decision & Reason */}
                    <td className="py-3 px-3 min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wide ${statusStyle.badge}`}>
                          {row.triageStatus === TRIAGE_STATUS.PROMOTE && <Sparkles className="w-3 h-3" />}
                          {row.triageStatus === TRIAGE_STATUS.BLOCK && <Ban className="w-3 h-3" />}
                          {row.triageStatus === TRIAGE_STATUS.IGNORE && <Clock className="w-3 h-3" />}
                          {row.triageStatus}
                        </span>

                        {row.overridden && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {row.triageReason}
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-semibold text-slate-100">
                        ${row.cost.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Avg CPC: ${row.avgCpc.toFixed(2)}
                      </div>
                    </td>

                    {/* Clicks & Impr */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-semibold text-slate-200">
                        {row.clicks.toLocaleString()} clicks
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {row.impressions.toLocaleString()} impr • {row.ctr.toFixed(1)}% CTR
                      </div>
                    </td>

                    {/* Conversions & CPA */}
                    <td className="py-3 px-3 text-right">
                      <div className={`font-semibold ${row.conversions > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {row.conversions} conv
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.cpa !== null ? (
                          <span className={row.cpa > 80 ? 'text-rose-400 font-medium' : 'text-slate-300'}>
                            ${row.cpa.toFixed(2)} CPA
                          </span>
                        ) : (
                          '--'
                        )}
                        {row.convRate > 0 && ` (${row.convRate.toFixed(1)}%)`}
                      </div>
                    </td>

                    {/* ROAS & Conversion Value */}
                    <td className="py-3 px-3 text-right">
                      <div className={`font-semibold ${row.roas >= 2.5 ? 'text-emerald-400' : row.roas > 0 ? 'text-slate-200' : 'text-slate-500'}`}>
                        {row.roas > 0 ? `${row.roas.toFixed(2)}x` : '--'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.conversionValue > 0 ? `$${row.conversionValue.toFixed(2)} val` : '--'}
                      </div>
                    </td>

                    {/* Quick Override Dropdown */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                        <button
                          type="button"
                          onClick={() => onOverrideRow(row.id, TRIAGE_STATUS.PROMOTE)}
                          title="Promote to exact match keyword"
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            row.triageStatus === TRIAGE_STATUS.PROMOTE
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOverrideRow(row.id, TRIAGE_STATUS.BLOCK)}
                          title="Block as negative keyword"
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            row.triageStatus === TRIAGE_STATUS.BLOCK
                              ? 'bg-rose-600 text-white'
                              : 'text-slate-400 hover:text-rose-400'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOverrideRow(row.id, TRIAGE_STATUS.IGNORE)}
                          title="Ignore / leave running"
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            row.triageStatus === TRIAGE_STATUS.IGNORE
                              ? 'bg-slate-700 text-slate-200'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing {paginatedRows.length > 0 ? (currentPage - 1) * (pageSize === 'ALL' ? sortedRows.length : pageSize) + 1 : 0} to{' '}
          {pageSize === 'ALL' ? sortedRows.length : Math.min(currentPage * pageSize, sortedRows.length)} of{' '}
          <span className="font-semibold text-slate-200">{sortedRows.length}</span> results
        </div>

        {pageSize !== 'ALL' && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
