import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  X, 
  Ban, 
  Sparkles, 
  FileSpreadsheet, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  exportNegativeKeywordsCSV, 
  exportPromotedKeywordsCSV, 
  exportFullAuditCSV, 
  copyNegativesToClipboard, 
  copyPromotedToClipboard 
} from '../utils/exporter';
import { TRIAGE_STATUS } from '../utils/constants';

export default function ExportModal({ isOpen, onClose, rows = [], summary }) {
  const [activeTab, setActiveTab] = useState('negatives');
  const [negativeFormat, setNegativeFormat] = useState('exact'); // 'exact' | 'phrase'
  const [copiedStatus, setCopiedStatus] = useState(null); // 'negatives' | 'promoted' | null

  if (!isOpen) return null;

  const blockedRows = rows.filter((r) => r.triageStatus === TRIAGE_STATUS.BLOCK);
  const promotedRows = rows.filter((r) => r.triageStatus === TRIAGE_STATUS.PROMOTE);

  const handleCopyNegatives = async () => {
    const count = await copyNegativesToClipboard(rows, negativeFormat);
    setCopiedStatus('negatives');
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  const handleCopyPromoted = async () => {
    const count = await copyPromotedToClipboard(rows);
    setCopiedStatus('promoted');
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Export & Google Ads Toolkit</h2>
              <p className="text-xs text-slate-400">Generate Google Ads Editor files or copy to clipboard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('negatives')}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'negatives'
                ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            Negative Keywords ({blockedRows.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promoted')}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'promoted'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Promoted Keywords ({promotedRows.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Full Audit CSV ({rows.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 text-xs space-y-4">
          
          {/* TAB 1: NEGATIVES */}
          {activeTab === 'negatives' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 flex items-start gap-2.5">
                <Ban className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{blockedRows.length} Bleeder Search Terms</span>
                  <p className="text-slate-300 mt-0.5">
                    Adding these as negative keywords eliminates <strong className="text-rose-400">${summary ? summary.bleederSpendSaved.toFixed(2) : 0}</strong> in recurring wasted ad spend.
                  </p>
                </div>
              </div>

              {/* Match Format Selector */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Negative Match Type Format:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNegativeFormat('exact')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      negativeFormat === 'exact'
                        ? 'border-rose-500 bg-rose-500/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold">[Exact Negative]</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Blocks only this exact search query</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNegativeFormat('phrase')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      negativeFormat === 'phrase'
                        ? 'border-rose-500 bg-rose-500/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold">"Phrase Negative"</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Blocks any query containing this phrase</div>
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div>
                <div className="text-slate-400 font-medium mb-1 flex items-center justify-between">
                  <span>Preview ({blockedRows.slice(0, 5).length} of {blockedRows.length})</span>
                  <span className="text-slate-500 font-mono text-[10px]">Google Ads Editor format</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-28 overflow-y-auto space-y-1">
                  {blockedRows.slice(0, 5).map((r, i) => (
                    <div key={i} className="truncate">
                      {negativeFormat === 'exact' ? `[${r.query}]` : `"${r.query}"`} <span className="text-slate-500">({r.campaign || 'Account Level'})</span>
                    </div>
                  ))}
                  {blockedRows.length > 5 && (
                    <div className="text-slate-500 italic">+ {blockedRows.length - 5} more items...</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyNegatives}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedStatus === 'negatives' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied {blockedRows.length} Negatives!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy List to Clipboard
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => exportNegativeKeywordsCSV(rows, negativeFormat)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Negatives CSV
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PROMOTED */}
          {activeTab === 'promoted' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{promotedRows.length} Converting Stars</span>
                  <p className="text-slate-300 mt-0.5">
                    These queries generated <strong className="text-emerald-400">{summary ? summary.promotedConversions : 0} conversions</strong> at an average CPA of <strong className="text-emerald-400">${summary ? summary.promotedCPA.toFixed(2) : 0}</strong>. Add them as exact match keywords to maximize ad rank.
                  </p>
                </div>
              </div>

              {/* Preview Box */}
              <div>
                <div className="text-slate-400 font-medium mb-1 flex items-center justify-between">
                  <span>Preview ({promotedRows.slice(0, 5).length} of {promotedRows.length})</span>
                  <span className="text-slate-500 font-mono text-[10px]">Exact match [keyword]</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-28 overflow-y-auto space-y-1">
                  {promotedRows.slice(0, 5).map((r, i) => (
                    <div key={i} className="truncate">
                      [{r.query}] <span className="text-emerald-400 font-sans">({r.conversions} conv @ ${r.cpa ? r.cpa.toFixed(2) : '0'} CPA)</span>
                    </div>
                  ))}
                  {promotedRows.length > 5 && (
                    <div className="text-slate-500 italic">+ {promotedRows.length - 5} more items...</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyPromoted}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedStatus === 'promoted' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied {promotedRows.length} Keywords!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy List to Clipboard
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => exportPromotedKeywordsCSV(rows)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Promoted CSV
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FULL AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 flex items-start gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Complete Triage Audit Export</span>
                  <p className="text-slate-300 mt-0.5">
                    Includes all {rows.length} search queries with triage action tags, urgency scores, detailed rule explanations, original metrics, and custom overrides.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1 text-slate-400">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ready for Stakeholder & Executive Reporting</span>
                </div>
                <p>
                  Share this comprehensive CSV with clients, CMOs, or PPC teams to document exactly where ad spend was saved and which keywords were promoted.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => exportFullAuditCSV(rows)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Full Audit CSV ({rows.length} Rows)
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
