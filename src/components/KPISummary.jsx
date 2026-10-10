import React from 'react';
import { 
  TrendingUp, 
  Ban, 
  Clock, 
  DollarSign, 
  Target, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export default function KPISummary({ summary, onFilterByStatus }) {
  if (!summary) return null;

  const {
    totalQueries,
    promoteCount,
    blockCount,
    ignoreCount,
    totalSpend,
    totalConversions,
    overallCPA,
    bleederSpendSaved,
    bleederSpendPercent,
    promotedSpend,
    promotedConversions,
    promotedCPA,
    promotedRevenue,
    promotedROAS,
    ignoredSpend
  } = summary;

  const promotePercent = totalQueries > 0 ? ((promoteCount / totalQueries) * 100).toFixed(0) : 0;
  const blockPercent = totalQueries > 0 ? ((blockCount / totalQueries) * 100).toFixed(0) : 0;
  const ignorePercent = totalQueries > 0 ? ((ignoreCount / totalQueries) * 100).toFixed(0) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Card 1: Total Account Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Analyzed</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalQueries}</span>
            <span className="text-xs text-slate-400">queries</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Spend:</span>
            <span className="font-semibold text-slate-200">${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-slate-400">Total Conv:</span>
            <span className="font-semibold text-slate-200">{totalConversions} (${overallCPA.toFixed(2)} CPA)</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Full account search query audit</span>
        </div>
      </div>

      {/* Card 2: PROMOTE (Winners) */}
      <div 
        onClick={() => onFilterByStatus && onFilterByStatus('promote')}
        className="bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Promote to Keywords
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {promotePercent}% of queries
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{promoteCount}</span>
            <span className="text-xs text-emerald-400/80">high performers</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">Conversions:</span>
            <span className="font-semibold text-emerald-300">{promotedConversions}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-slate-400">Avg Winner CPA:</span>
            <span className="font-semibold text-emerald-300">
              {promotedConversions > 0 ? `$${promotedCPA.toFixed(2)}` : '--'}
              {promotedROAS > 0 && ` (${promotedROAS.toFixed(1)}x ROAS)`}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-emerald-400/90 flex items-center justify-between">
          <span>Add as exact match keywords</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Card 3: BLOCK (Bleeders) */}
      <div 
        onClick={() => onFilterByStatus && onFilterByStatus('block')}
        className="bg-slate-900/80 border border-rose-500/30 hover:border-rose-500/60 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" />
            Block as Negatives
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {blockPercent}% of queries
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">{blockCount}</span>
            <span className="text-xs text-rose-400/80">budget bleeders</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">Wasted Spend:</span>
            <span className="font-bold text-rose-300">
              ${bleederSpendSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-slate-400">Budget Waste:</span>
            <span className="font-semibold text-rose-300">{bleederSpendPercent.toFixed(1)}% of total spend</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-rose-400/90 flex items-center justify-between">
          <span>Eliminate 100% of this waste</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Card 4: IGNORE (Inconclusive) */}
      <div 
        onClick={() => onFilterByStatus && onFilterByStatus('ignore')}
        className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Ignore / Monitor
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {ignorePercent}% of queries
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-200">{ignoreCount}</span>
            <span className="text-xs text-slate-400">low volume</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">Testing Spend:</span>
            <span className="font-semibold text-slate-300">
              ${ignoredSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-slate-400">Status:</span>
            <span className="font-medium text-amber-400">Gathering more data</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Leave running for observation</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

    </div>
  );
}
