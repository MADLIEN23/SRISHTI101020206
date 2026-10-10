export const TRIAGE_STATUS = {
  PROMOTE: 'promote',
  BLOCK: 'block',
  IGNORE: 'ignore',
};

export const DEFAULT_CONFIG = {
  targetCPA: 40.0,
  maxCPA: 85.0,
  minConversionsForPromote: 2,
  bleederSpendThreshold: 50.0,
  maxClicksWithoutConversion: 20,
  targetROAS: 2.5,
  minSpendForHighCPA: 60.0,
  lowCtrThreshold: 0.35, // percentage
  negativeStopwords: [
    'free',
    'crack',
    'torrent',
    'nulled',
    'warez',
    'hack',
    'jobs',
    'job',
    'careers',
    'career',
    'internship',
    'salary',
    'salaries',
    'login',
    'portal',
    'sign in',
    'log in',
    'pdf download',
    'template free',
    'meaning',
    'definition',
    'wikipedia',
    'youtube',
    'customer service',
    'customer care',
    'phone number',
    'support number',
    'complaints',
    'refund',
    'diy',
  ],
};

export const MATCH_TYPES = {
  EXACT: 'Exact',
  PHRASE: 'Phrase',
  BROAD: 'Broad',
};

export const STATUS_COLORS = {
  promote: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500 text-slate-950 font-semibold',
    iconColor: '#10b981',
    lightBg: 'bg-emerald-950/40',
  },
  block: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    badge: 'bg-rose-500 text-white font-semibold',
    iconColor: '#f43f5e',
    lightBg: 'bg-rose-950/40',
  },
  ignore: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-slate-700 text-slate-200 font-semibold',
    iconColor: '#94a3b8',
    lightBg: 'bg-slate-800/40',
  },
};
