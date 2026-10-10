import React from 'react';
import { ShieldAlert, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function VisualBreakdown({ summary }) {
  if (!summary || summary.totalQueries === 0) return null;

  const {
    totalQueries,
    promoteCount,
    blockCount,
    ignoreCount,
    totalSpend,
    bleederSpendSaved,
    promotedSpend,
    ignoredSpend,
    bleederSpendPercent,
    promotedConversions
  } = summary;

  // Query counts percentages
  const pQueryPct = totalQueries > 0 ? (promoteCount / totalQueries) * 100 : 0;
  const bQueryPct = totalQueries > 0 ? (blockCount / totalQueries) * 100 : 0;
  const iQueryPct = totalQueries > 0 ? (ignoreCount / totalQueries) * 100 : 0;

  // Spend percentages
  const pSpendPct = totalSpend > 0 ? (promotedSpend / totalSpend) * 100 : 0;
  const bSpendPct = totalSpend > 0 ? (bleederSpendSaved / totalSpend) * 100 : 0;
  const iSpendPct = totalSpend > 0 ? (ignoredSpend / totalSpend) * 100 : 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      
      {/* Actionable Strategy Alert Banner */}
      <div className="p-3.5 rounded-lg bg-gradient-to-r from-rose-950/40 via-indigo-950/30 to-emerald-950/40 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5 sm:mt-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white">Algorithmic Recommendation: </span>
            {blockCount > 0 ? (
              <span>
                Blocking the <span className="font-bold text-rose-400">{blockCount} identified bleeders</span> immediately recovers <span className="font-bold text-rose-400">${bleederSpendSaved.toFixed(2)}</span> ({bleederSpendPercent.toFixed(1)}% of ad spend) with zero lost conversions. 
                Promoting the <span className="font-bold text-emerald-400">{promoteCount} converting terms</span> into exact match will maximize conversion volume.
              </span>
            ) : (
              <span>Your search terms are operating efficiently within target CPA thresholds. Continue monitoring testing queries.</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
        
        {/* Metric 1: Query Count Distribution Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-300">Query Distribution by Triage Status</span>
            <span className="text-slate-500 text-[11px]">{totalQueries} Total Queries</span>
          </div>

          <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            {pQueryPct > 0 && (
              <div 
                style={{ width: `${pQueryPct}%` }} 
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                title={`Promote: ${promoteCount} queries (${pQueryPct.toFixed(1)}%)`}
              />
            )}
            {bQueryPct > 0 && (
              <div 
                style={{ width: `${bQueryPct}%` }} 
                className="h-full bg-rose-500 transition-all duration-500"
                title={`Block: ${blockCount} queries (${bQueryPct.toFixed(1)}%)`}
              />
            )}
            {iQueryPct > 0 && (
              <div 
                style={{ width: `${iQueryPct}%` }} 
                className="h-full bg-slate-600 rounded-r-full transition-all duration-500"
                title={`Ignore: ${ignoreCount} queries (${iQueryPct.toFixed(1)}%)`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] mt-2 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Promote: <strong>{promoteCount}</strong> ({pQueryPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Block: <strong>{blockCount}</strong> ({bQueryPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Ignore: <strong>{ignoreCount}</strong> ({iQueryPct.toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Spend Allocation Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-300">Budget Spend Allocation</span>
            <span className="text-slate-500 text-[11px]">${totalSpend.toFixed(2)} Total Spend</span>
          </div>

          <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            {pSpendPct > 0 && (
              <div 
                style={{ width: `${pSpendPct}%` }} 
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                title={`Promoted Spend: $${promotedSpend.toFixed(2)} (${pSpendPct.toFixed(1)}%)`}
              />
            )}
            {bSpendPct > 0 && (
              <div 
                style={{ width: `${bSpendPct}%` }} 
                className="h-full bg-rose-500 transition-all duration-500"
                title={`Bleeder Wasted Spend: $${bleederSpendSaved.toFixed(2)} (${bSpendPct.toFixed(1)}%)`}
              />
            )}
            {iSpendPct > 0 && (
              <div 
                style={{ width: `${iSpendPct}%` }} 
                className="h-full bg-slate-600 rounded-r-full transition-all duration-500"
                title={`Testing Spend: $${ignoredSpend.toFixed(2)} (${iSpendPct.toFixed(1)}%)`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] mt-2 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Profitable: <strong>${promotedSpend.toFixed(0)}</strong> ({pSpendPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Wasted: <strong>${bleederSpendSaved.toFixed(0)}</strong> ({bSpendPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Testing: <strong>${ignoredSpend.toFixed(0)}</strong> ({iSpendPct.toFixed(0)}%)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
