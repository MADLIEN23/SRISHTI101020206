import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import KPISummary from './components/KPISummary';
import VisualBreakdown from './components/VisualBreakdown';
import DataTable from './components/DataTable';
import FileUploader from './components/FileUploader';
import ConfigModal from './components/ConfigModal';
import ExportModal from './components/ExportModal';

import { DEFAULT_CONFIG } from './utils/constants';
import { triageAllQueries } from './utils/triageAlgorithm';
import { parseGoogleAdsCSV } from './utils/parser';
import { SAMPLE_GOOGLE_ADS_CSV_RAW, downloadSampleCSVFile } from './utils/sampleData';

import { 
  UploadCloud, 
  Sparkles, 
  Ban, 
  Clock, 
  TrendingUp, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sliders,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [rawRows, setRawRows] = useState([]);
  const [activeFileName, setActiveFileName] = useState('');
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [activeTab, setActiveTab] = useState('all');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Run triage algorithm reactively whenever rawRows or config change
  const { triagedRows, summary } = useMemo(() => {
    if (!rawRows || rawRows.length === 0) {
      return { triagedRows: [], summary: null };
    }
    return triageAllQueries(rawRows, config);
  }, [rawRows, config]);

  // Handle uploaded data from FileUploader
  const handleDataParsed = (rows, fileName) => {
    setRawRows(rows);
    setActiveFileName(fileName);
    setActiveTab('all');
    showToast(`Successfully parsed ${rows.length} search queries from ${fileName}`, 'success');
  };

  // Load realistic sample dataset
  const handleLoadSample = async () => {
    try {
      const result = await parseGoogleAdsCSV(SAMPLE_GOOGLE_ADS_CSV_RAW);
      setRawRows(result.rows);
      setActiveFileName('google_ads_search_terms_sample.csv');
      setActiveTab('all');
      showToast(`Loaded ${result.rows.length} sample search queries across 4 campaigns`, 'success');
    } catch (err) {
      showToast('Error loading sample dataset: ' + err.message, 'error');
    }
  };

  // Override a single row's triage decision
  const handleOverrideRow = (rowId, newStatus) => {
    setRawRows((prevRows) =>
      prevRows.map((r) => {
        if (r.id === rowId) {
          const isReturningToOriginal = r.triageStatus === newStatus && !r.overridden;
          return {
            ...r,
            userOverride: isReturningToOriginal ? null : newStatus,
          };
        }
        return r;
      })
    );
    showToast(`Updated search query to ${newStatus.toUpperCase()}`, 'info');
  };

  // Batch override multiple rows
  const handleBatchOverride = (rowIds, newStatus) => {
    const idSet = new Set(rowIds);
    setRawRows((prevRows) =>
      prevRows.map((r) => {
        if (idSet.has(r.id)) {
          return {
            ...r,
            userOverride: newStatus,
          };
        }
        return r;
      })
    );
    showToast(`Batch triaged ${rowIds.length} queries to ${newStatus.toUpperCase()}`, 'info');
  };

  // Config handlers
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    showToast('Triage rules and thresholds updated', 'success');
  };

  const handleResetDefaults = () => {
    setConfig({ ...DEFAULT_CONFIG });
    showToast('Reset rules to default thresholds', 'info');
  };

  const handleResetData = () => {
    setRawRows([]);
    setActiveFileName('');
    setActiveTab('all');
    showToast('Cleared search queries data', 'info');
  };

  const isConfigCustomized = JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-slate-200">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onLoadSample={handleLoadSample}
        hasData={rawRows.length > 0}
        totalQueries={summary ? summary.totalQueries : 0}
        bleederSavings={summary ? summary.bleederSpendSaved : 0}
        isConfigCustomized={isConfigCustomized}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {rawRows.length === 0 ? (
          /* Empty / Welcome State */
          <div className="py-12 px-4 max-w-4xl mx-auto space-y-8 animate-fadeIn">
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Algorithmic Google Ads PPC Optimization
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Triage Search Queries into <span className="text-emerald-400">Promote</span>, <span className="text-rose-400">Block</span> & <span className="text-amber-400">Ignore</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
                Upload your Google Ads Search Terms CSV report. PapaParse handles report headers, 
                removes summary rows, cleans currencies, and our multi-variable algorithm isolates budget bleeders from converting gems.
              </p>
            </div>

            {/* Main Action Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5" />
                  Upload Google Ads CSV
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Load Sample Google Ads Data (40+ Queries)
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-6 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={downloadSampleCSVFile}
                  className="hover:text-slate-200 underline cursor-pointer"
                >
                  Download Sample CSV Template
                </button>
                <span>•</span>
                <span>PapaParse Client-Side Processing</span>
                <span>•</span>
                <span>Google Ads Editor Compatible</span>
              </div>
            </div>

            {/* How the 3-Way Triage Algorithm Works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {/* Feature 1: PROMOTE */}
              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-white text-sm">1. Promote (Add as Exact Keywords)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identifies search queries with multiple conversions operating at or below your target CPA or high ROAS. 
                  Isolate them into dedicated exact match ad groups to boost Ad Rank and prevent query dilution.
                </p>
              </div>

              {/* Feature 2: BLOCK */}
              <div className="bg-slate-900/60 border border-rose-500/20 rounded-xl p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-white text-sm">2. Block (Add as Negative Keywords)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Catches budget bleeders with zero conversions, click burners exceeding volume thresholds, runaway CPA queries, 
                  and queries matching negative stop words ("free", "crack", "jobs", "login").
                </p>
              </div>

              {/* Feature 3: IGNORE */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white text-sm">3. Ignore (Keep Monitoring)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Leaves low-volume exploratory queries running until they reach statistical significance. 
                  Prevents knee-jerk negative keyword additions on queries with only 1–3 clicks.
                </p>
              </div>

            </div>

          </div>
        ) : (
          /* Active Dashboard View */
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Bar with File Name and Dataset Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Active File:</span>
                <span className="font-semibold text-white font-mono">{activeFileName}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {summary ? summary.totalQueries : 0} rows
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(true)}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Target CPA: <strong className="text-white">${config.targetCPA}</strong> • Bleeder Limit: <strong className="text-white">${config.bleederSpendThreshold}</strong>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <KPISummary
              summary={summary}
              onFilterByStatus={(status) => setActiveTab(status)}
            />

            {/* Visual Distribution & Strategy Banner */}
            <VisualBreakdown summary={summary} />

            {/* Interactive Data Table with Search, Filter, Sort, Batch Actions, & Pagination */}
            <DataTable
              rows={triagedRows}
              summary={summary}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOverrideRow={handleOverrideRow}
              onBatchOverride={handleBatchOverride}
            />

          </div>
        )}

      </main>

      {/* Modals */}
      <FileUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataParsed={handleDataParsed}
        onLoadSample={handleLoadSample}
      />

      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onResetDefaults={handleResetDefaults}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rows={triagedRows}
        summary={summary}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AdQueryTriage • Powered by PapaParse & Vite React</span>
          <span>Google Ads Search Terms Audit & Triage Automation Engine</span>
        </div>
      </footer>

    </div>
  );
}
