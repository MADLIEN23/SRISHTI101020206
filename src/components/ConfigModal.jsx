import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { DEFAULT_CONFIG } from '../utils/constants';

export default function ConfigModal({ 
  isOpen, 
  onClose, 
  config, 
  onSaveConfig, 
  onResetDefaults 
}) {
  const [formData, setFormData] = useState({ ...config });
  const [newStopword, setNewStopword] = useState('');

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof value === 'number' ? value : parseFloat(value) || 0,
    }));
  };

  const handleAddStopword = (e) => {
    e.preventDefault();
    if (!newStopword.trim()) return;

    const wordsToAdd = newStopword
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0 && !formData.negativeStopwords.includes(w));

    if (wordsToAdd.length > 0) {
      setFormData((prev) => ({
        ...prev,
        negativeStopwords: [...prev.negativeStopwords, ...wordsToAdd],
      }));
    }
    setNewStopword('');
  };

  const handleRemoveStopword = (wordToRemove) => {
    setFormData((prev) => ({
      ...prev,
      negativeStopwords: prev.negativeStopwords.filter((w) => w !== wordToRemove),
    }));
  };

  const handleSave = () => {
    onSaveConfig(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_CONFIG });
    onResetDefaults();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Triage Algorithm Rules & Thresholds</h2>
              <p className="text-xs text-slate-400">Configure parameters used to triage queries into Promote / Block / Ignore</p>
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Section 1: Promote Rules */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <span>🚀 Promote Thresholds (Exact Keyword Additions)</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target CPA ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.targetCPA}
                    onChange={(e) => handleChange('targetCPA', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Acceptable CPA benchmark for your campaigns</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Min Conversions for Promote
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.minConversionsForPromote}
                  onChange={(e) => handleChange('minConversionsForPromote', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Conversions required before moving to exact match</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target ROAS (multiplier)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.1"
                  value={formData.targetROAS}
                  onChange={(e) => handleChange('targetROAS', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">e.g. 2.5 = $2.50 revenue per $1.00 spend</p>
              </div>
            </div>
          </div>

          {/* Section 2: Block Rules */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <span>🚫 Block Thresholds (Negative Keyword Additions)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Bleeder Spend Limit ($ with 0 conv)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">$</span>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.bleederSpendThreshold}
                    onChange={(e) => handleChange('bleederSpendThreshold', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Cost threshold to automatically block non-converting queries</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Clicks without Conversion
                </label>
                <input
                  type="number"
                  min="5"
                  value={formData.maxClicksWithoutConversion}
                  onChange={(e) => handleChange('maxClicksWithoutConversion', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Clicks without a single conversion before blocking</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Tolerable CPA ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">$</span>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={formData.maxCPA}
                    onChange={(e) => handleChange('maxCPA', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Queries with conversions but runaway CPA above this are blocked</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Low CTR Threshold (%)
                </label>
                <input
                  type="number"
                  min="0.05"
                  step="0.05"
                  value={formData.lowCtrThreshold}
                  onChange={(e) => handleChange('lowCtrThreshold', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Broad match terms with high impr & CTR below this get blocked</p>
              </div>
            </div>
          </div>

          {/* Section 3: Negative Stopwords List */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-semibold text-sm">
                🛑 Negative Stopwords Filter ({formData.negativeStopwords.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Any query containing these with 0 conv will be blocked
              </span>
            </div>

            {/* Input to add */}
            <form onSubmit={handleAddStopword} className="flex gap-2">
              <input
                type="text"
                placeholder="Add stopword (e.g. 'torrent, coupon, cheap')"
                value={newStopword}
                onChange={(e) => setNewStopword(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            {/* Badges list */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-900/60 rounded-lg border border-slate-800">
              {formData.negativeStopwords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => handleRemoveStopword(word)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Apply Rules & Re-triage
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
