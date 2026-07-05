import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowLeft, Star, CheckCheck, Check, Minus, X, Zap, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type Phase = 'group' | 'knockout'
type WinnerKey = 'home' | 'away' | 'draw'

interface Tier {
  id: string
  Icon: React.ElementType
  pickHome: number
  pickAway: number
  resultHome: number
  resultAway: number
  groupPts: number
  accent: { border: string; bg: string; text: string; badge: string; scoreBg: string }
}

const RESULT = { home: 2, away: 0 }

const TIERS: Tier[] = [
  {
    id: 'exact',
    Icon: Star,
    pickHome: 2,
    pickAway: 0,
    resultHome: RESULT.home,
    resultAway: RESULT.away,
    groupPts: 5,
    accent: {
      border: 'border-amber-500',
      bg: 'bg-amber-500/8',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300',
      scoreBg: 'bg-amber-500',
    },
  },
  {
    id: 'partial_correct',
    Icon: CheckCheck,
    pickHome: 2,
    pickAway: 1,
    resultHome: RESULT.home,
    resultAway: RESULT.away,
    groupPts: 3,
    accent: {
      border: 'border-green-500',
      bg: 'bg-green-500/8',
      text: 'text-green-400',
      badge: 'bg-green-500/20 text-green-300',
      scoreBg: 'bg-green-500',
    },
  },
  {
    id: 'correct_winner',
    Icon: Check,
    pickHome: 3,
    pickAway: 1,
    resultHome: RESULT.home,
    resultAway: RESULT.away,
    groupPts: 2,
    accent: {
      border: 'border-blue-500',
      bg: 'bg-blue-500/8',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300',
      scoreBg: 'bg-blue-500',
    },
  },
  {
    id: 'partial_wrong',
    Icon: Minus,
    pickHome: 0,
    pickAway: 0,
    resultHome: RESULT.home,
    resultAway: RESULT.away,
    groupPts: 1,
    accent: {
      border: 'border-violet-500',
      bg: 'bg-violet-500/8',
      text: 'text-violet-400',
      badge: 'bg-violet-500/20 text-violet-300',
      scoreBg: 'bg-violet-500',
    },
  },
  {
    id: 'miss',
    Icon: X,
    pickHome: 1,
    pickAway: 2,
    resultHome: RESULT.home,
    resultAway: RESULT.away,
    groupPts: 0,
    accent: {
      border: 'border-red-700',
      bg: 'bg-red-900/20',
      text: 'text-red-500',
      badge: 'bg-red-900/30 text-red-400',
      scoreBg: 'bg-red-700',
    },
  },
]

function winnerKey(home: number, away: number): WinnerKey {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

function ScoreBox({
  value,
  highlight,
  scoreBg,
}: {
  value: number
  highlight: boolean
  scoreBg: string
}) {
  return (
    <span
      className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold tabular-nums transition-colors',
        highlight ? `${scoreBg} text-white` : 'bg-zinc-800 text-zinc-400'
      )}
    >
      {value}
    </span>
  )
}

function TierCard({ tier, multiplier }: { tier: Tier; multiplier: number }) {
  const { t } = useTranslation()
  const { Icon, id, pickHome, pickAway, resultHome, resultAway, groupPts, accent } = tier
  const pts = groupPts * multiplier
  const homeMatch = pickHome === resultHome
  const awayMatch = pickAway === resultAway
  const pickKey = winnerKey(pickHome, pickAway)
  const resultKey = winnerKey(resultHome, resultAway)
  const winnerMatch = pickKey === resultKey

  const title = t(`rules.tier.${id}.title`)
  const desc = t(`rules.tier.${id}.desc`)

  return (
    <div className={cn('rounded-xl border-l-4 overflow-hidden', accent.border, accent.bg)}>
      <div className="px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Icon size={16} className={accent.text} />
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          <span
            className={cn(
              'text-sm font-bold tabular-nums px-2 py-0.5 rounded-full flex-shrink-0',
              accent.badge
            )}
          >
            {pts > 0 ? `+${pts.toString()} pts` : '0 pts'}
          </span>
        </div>

        <p className="text-xs text-zinc-500 mt-1.5 ml-[26px]">{desc}</p>

        {/* Score comparison */}
        <div className="mt-3.5 flex items-center gap-5 ml-[26px]">
          {/* Pick */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
              {t('rules.yourPick')}
            </span>
            <div className="flex items-center gap-1.5">
              <ScoreBox value={pickHome} highlight={homeMatch} scoreBg={accent.scoreBg} />
              <span className="text-zinc-600 text-sm font-medium">–</span>
              <ScoreBox value={pickAway} highlight={awayMatch} scoreBg={accent.scoreBg} />
            </div>
            <span
              className={cn('text-[10px] font-medium', winnerMatch ? accent.text : 'text-zinc-600')}
            >
              {t(`rules.winner.${pickKey}`)}
            </span>
          </div>

          <span className="text-zinc-700 text-xs mt-1">vs</span>

          {/* Result */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
              {t('rules.result')}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold tabular-nums bg-zinc-800/60 text-zinc-300">
                {resultHome}
              </span>
              <span className="text-zinc-600 text-sm font-medium">–</span>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold tabular-nums bg-zinc-800/60 text-zinc-300">
                {resultAway}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">{t(`rules.winner.${resultKey}`)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RulesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('knockout')
  const multiplier = phase === 'group' ? 1 : 2

  return (
    <div className="flex flex-col min-h-full bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            router.history.back()
          }}
          className="text-zinc-400 hover:text-white transition-colors p-0.5 -ml-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-white font-semibold text-base">{t('rules.title')}</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Phase toggle */}
        <div className="flex items-center gap-1.5 bg-zinc-900 rounded-full p-1">
          {(['group', 'knockout'] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPhase(p)
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-colors',
                phase === p ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {p === 'knockout' && <Zap size={11} className="text-amber-400" />}
              {t(`rules.phase.${p}`)}
            </button>
          ))}
        </div>

        {phase === 'knockout' && (
          <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2.5">
            <Zap size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">{t('rules.knockoutNote')}</p>
          </div>
        )}

        {/* Tier cards */}
        {TIERS.map((tier) => (
          <TierCard key={tier.id} tier={tier} multiplier={multiplier} />
        ))}

        {/* Penalty bonus — knockout only */}
        {phase === 'knockout' && (
          <div className="rounded-xl border-l-4 border-amber-500 bg-amber-500/8 overflow-hidden">
            <div className="px-4 pt-4 pb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <Target size={16} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">{t('scoring.penBonus')}</span>
                </div>
                <span className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-full flex-shrink-0 bg-amber-500/20 text-amber-300">
                  +1 / +2
                </span>
              </div>
              <p className="text-xs text-zinc-500 ml-[26px] mb-3">{t('rules.penBonusDesc')}</p>
              <div className="ml-[26px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{t('scoring.penWinner')}</span>
                  <span className="text-xs font-bold text-amber-400 tabular-nums">+1 pt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{t('scoring.penExact')}</span>
                  <span className="text-xs font-bold text-amber-400 tabular-nums">+2 pts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-[11px] text-zinc-600 text-center pb-2">{t('rules.tiersNote')}</p>
      </div>
    </div>
  )
}
