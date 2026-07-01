import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeft, Star, CheckCheck, Check, Minus, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'group' | 'knockout'

interface Tier {
  id:          string
  Icon:        React.ElementType
  title:       string
  desc:        string
  pickHome:    number
  pickAway:    number
  resultHome:  number
  resultAway:  number
  groupPts:    number
  accent:      { border: string; bg: string; text: string; badge: string; scoreBg: string }
}

const RESULT = { home: 2, away: 0 }

const TIERS: Tier[] = [
  {
    id: 'exact',
    Icon: Star,
    title: 'Exact Score',
    desc: 'Predicted the exact final score for both teams',
    pickHome: 2, pickAway: 0,
    resultHome: RESULT.home, resultAway: RESULT.away,
    groupPts: 5,
    accent: { border: 'border-amber-500', bg: 'bg-amber-500/8', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300', scoreBg: 'bg-amber-500' },
  },
  {
    id: 'partial_correct',
    Icon: CheckCheck,
    title: 'Partial + Correct Winner',
    desc: 'One score matches and picked the right winner',
    pickHome: 2, pickAway: 1,
    resultHome: RESULT.home, resultAway: RESULT.away,
    groupPts: 3,
    accent: { border: 'border-emerald-500', bg: 'bg-emerald-500/8', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', scoreBg: 'bg-emerald-500' },
  },
  {
    id: 'correct_winner',
    Icon: Check,
    title: 'Correct Winner',
    desc: 'Right winner or draw — no exact scores match',
    pickHome: 3, pickAway: 1,
    resultHome: RESULT.home, resultAway: RESULT.away,
    groupPts: 2,
    accent: { border: 'border-sky-500', bg: 'bg-sky-500/8', text: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300', scoreBg: 'bg-sky-500' },
  },
  {
    id: 'partial_wrong',
    Icon: Minus,
    title: 'Partial + Wrong Winner',
    desc: 'One score matches but predicted the wrong winner',
    pickHome: 0, pickAway: 0,
    resultHome: RESULT.home, resultAway: RESULT.away,
    groupPts: 1,
    accent: { border: 'border-orange-500', bg: 'bg-orange-500/8', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300', scoreBg: 'bg-orange-500' },
  },
  {
    id: 'miss',
    Icon: X,
    title: 'Miss',
    desc: 'Nothing matches — wrong winner, no scores in common',
    pickHome: 1, pickAway: 2,
    resultHome: RESULT.home, resultAway: RESULT.away,
    groupPts: 0,
    accent: { border: 'border-zinc-700', bg: 'bg-zinc-800/40', text: 'text-zinc-500', badge: 'bg-zinc-700/60 text-zinc-400', scoreBg: 'bg-zinc-600' },
  },
]

function winnerLabel(home: number, away: number): string {
  if (home > away) return 'Home wins'
  if (away > home) return 'Away wins'
  return 'Draw'
}

function ScoreBox({ value, highlight, scoreBg }: { value: number; highlight: boolean; scoreBg: string }) {
  return (
    <span
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold tabular-nums transition-colors',
        highlight ? `${scoreBg} text-white` : 'bg-zinc-800 text-zinc-400',
      )}
    >
      {value}
    </span>
  )
}

function TierCard({ tier, multiplier }: { tier: Tier; multiplier: number }) {
  const { Icon, title, desc, pickHome, pickAway, resultHome, resultAway, groupPts, accent } = tier
  const pts = groupPts * multiplier
  const homeMatch = pickHome === resultHome
  const awayMatch = pickAway === resultAway
  const pickWinner  = winnerLabel(pickHome, pickAway)
  const resultWinner = winnerLabel(resultHome, resultAway)
  const winnerMatch = pickWinner === resultWinner

  return (
    <div className={cn('rounded-xl border-l-4 overflow-hidden', accent.border, accent.bg)}>
      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Icon size={16} className={accent.text} />
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          <span className={cn('text-sm font-bold tabular-nums px-2 py-0.5 rounded-full flex-shrink-0', accent.badge)}>
            {pts > 0 ? `+${pts} pts` : '0 pts'}
          </span>
        </div>

        <p className="text-xs text-zinc-500 mt-1.5 ml-[26px]">{desc}</p>

        {/* Score comparison */}
        <div className="mt-3.5 flex items-center gap-5 ml-[26px]">
          {/* Pick */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Your Pick</span>
            <div className="flex items-center gap-1.5">
              <ScoreBox value={pickHome} highlight={homeMatch} scoreBg={accent.scoreBg} />
              <span className="text-zinc-600 text-sm font-medium">–</span>
              <ScoreBox value={pickAway} highlight={awayMatch} scoreBg={accent.scoreBg} />
            </div>
            <span className={cn('text-[10px] font-medium', winnerMatch ? accent.text : 'text-zinc-600')}>
              {pickWinner}
            </span>
          </div>

          <span className="text-zinc-700 text-xs mt-1">vs</span>

          {/* Result */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Result</span>
            <div className="flex items-center gap-1.5">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold tabular-nums bg-zinc-800/60 text-zinc-300">
                {resultHome}
              </span>
              <span className="text-zinc-600 text-sm font-medium">–</span>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold tabular-nums bg-zinc-800/60 text-zinc-300">
                {resultAway}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">{resultWinner}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RulesPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('group')
  const multiplier = phase === 'group' ? 1 : 2

  return (
    <div className="flex flex-col min-h-full bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.history.back()}
          className="text-zinc-400 hover:text-white transition-colors p-0.5 -ml-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-white font-semibold text-base">Scoring Rules</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Phase toggle */}
        <div className="flex items-center gap-1.5 bg-zinc-900 rounded-full p-1">
          {(['group', 'knockout'] as Phase[]).map(p => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-colors',
                phase === p ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {p === 'knockout' && <Zap size={11} className="text-amber-400" />}
              {p === 'group' ? 'Group Stage' : 'Knockout ×2'}
            </button>
          ))}
        </div>

        {phase === 'knockout' && (
          <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2.5">
            <Zap size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">
              All knockout rounds (R32 onward) apply a <span className="font-semibold text-amber-300">×2 multiplier</span>. Same tiers, double the points.
            </p>
          </div>
        )}

        {/* Tier cards */}
        {TIERS.map(tier => (
          <TierCard key={tier.id} tier={tier} multiplier={multiplier} />
        ))}

        {/* Footer note */}
        <p className="text-[11px] text-zinc-600 text-center pb-2">
          Tiers are evaluated top-down — exact score takes precedence over partial matches.
        </p>
      </div>
    </div>
  )
}
