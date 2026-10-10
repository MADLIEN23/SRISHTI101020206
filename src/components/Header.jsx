import React from 'react';
import { 
  UploadCloud, 
  Sliders, 
  Download, 
  Sparkles, 
  ShieldAlert, 
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';

export default function Header({ 
  onOpenUpload, 
  onOpenConfig, 
  onOpenExport, 
  onLoadSample,
  hasData,
  totalQueries,
  bleederSavings,
  isConfigCustomized,
  onResetData
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  AdQuery<span className="text-indigo-400">Triage</span>
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Google Ads Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PPC Search Terms Audit • Algorithmic Promote / Block / Ignore Decisions
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge (if data loaded) */}
          {hasData && (
            <div className="hidden lg:flex items-center gap-4 bg-slate-950/60 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Audited: </span>
                <span className="font-semibold text-white">{totalQueries} queries</span>
              </div>
              <div className="w-px h-3.5 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-slate-400">Wasted Spend Found: </span>
                <span className="font-bold text-rose-400">${bleederSavings.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {!hasData ? (
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample Data
              </button>
            ) : (
              <button
                type="button"
                onClick={onResetData}
                title="Reset data"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
              Upload CSV
            </button>

            <button
              type="button"
              onClick={onOpenConfig}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Rules & Thresholds
              {isConfigCustomized && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900" />
              )}
            </button>

            {hasData && (
              <button
                type="button"
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Toolkit
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
