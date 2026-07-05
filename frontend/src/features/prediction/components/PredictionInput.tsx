import { useState, useEffect, useRef } from 'react'
import { Lock, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { MatchWithTeams, PredictionTier, RoundPhase } from '@/types/domain.types'
import { isMatchEditable } from '@/features/match/utils/matchUtils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMyPrediction } from '../hooks/useMyPrediction'
import { useSavePrediction } from '../hooks/useSavePrediction'
import { TIER_TEXT_CLASSES, computeLiveTier } from '../utils/tierUtils'
import {
  useScoringConfig,
  getScoringForPhase,
  tierToPoints,
} from '@/features/competition/hooks/useScoringConfig'

interface Props {
  match: MatchWithTeams
}

const KNOCKOUT_PHASES: RoundPhase[] = [
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place',
  'final',
]

const INPUT_CLASS =
  'w-14 h-10 text-center text-base font-medium tabular-nums bg-zinc-800 border border-zinc-700 ' +
  'rounded text-white outline-none focus:border-emerald-500 transition-colors ' +
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

const PEN_INPUT_CLASS =
  'w-10 h-8 text-center text-sm font-medium tabular-nums bg-zinc-800/60 border border-zinc-700/60 ' +
  'rounded text-white outline-none focus:border-amber-500/70 transition-colors ' +
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

export function PredictionInput({ match }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const editable =
    isMatchEditable(match.kickoff_at) && match.home_team !== null && match.away_team !== null
  const isKnockout = KNOCKOUT_PHASES.includes(match.round.phase)

  const { data: prediction } = useMyPrediction(match.id)
  const { mutate: saveRaw, isSuccess } = useSavePrediction(match.id)
  const { data: scoringConfigs } = useScoringConfig(match.round.competition_id)

  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [penHome, setPenHome] = useState('')
  const [penAway, setPenAway] = useState('')
  const initialised = useRef(false)

  useEffect(() => {
    if (prediction && !initialised.current) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setHome(String(prediction.home_score))
      setAway(String(prediction.away_score))
      if (prediction.penalty_home_score != null) setPenHome(String(prediction.penalty_home_score))
      if (prediction.penalty_away_score != null) setPenAway(String(prediction.penalty_away_score))
      /* eslint-enable react-hooks/set-state-in-effect */
      initialised.current = true
    }
  }, [prediction])

  if (!user) return null

  // Derived state — recalculated from inputs on every render
  const homeInt = parseInt(home, 10)
  const awayInt = parseInt(away, 10)
  const validMain = !isNaN(homeInt) && !isNaN(awayInt) && homeInt >= 0 && awayInt >= 0
  const isDraw = validMain && homeInt === awayInt
  const showPenalty = isKnockout && editable && isDraw

  function buildSaveArgs() {
    const ph = parseInt(penHome, 10)
    const pa = parseInt(penAway, 10)
    const hasPenalty = isDraw && isKnockout && !isNaN(ph) && !isNaN(pa) && ph >= 0 && pa >= 0
    return {
      homeScore: homeInt,
      awayScore: awayInt,
      penaltyHomeScore: hasPenalty ? ph : null,
      penaltyAwayScore: hasPenalty ? pa : null,
    }
  }

  function save(args: ReturnType<typeof buildSaveArgs>) {
    const homeName = match.home_team?.short_name ?? match.home_team_label ?? '?'
    const awayName = match.away_team?.short_name ?? match.away_team_label ?? '?'
    saveRaw(args, {
      onSuccess: () => {
        toast.success(`${homeName} vs ${awayName}`, {
          description: t('prediction.saved'),
          duration: 2000,
          id: `pred-${match.id}`,
        })
      },
    })
  }

  function handleBlur() {
    if (!validMain) return
    if (!isDraw) {
      setPenHome('')
      setPenAway('')
    }
    save(buildSaveArgs())
  }

  if (!editable) {
    if (!prediction) {
      return (
        <div className="flex items-center justify-center gap-1 mt-2.5 text-zinc-600">
          <Lock size={12} />
          <span className="text-xs">{t('prediction.noPrediction')}</span>
        </div>
      )
    }

    const tier = prediction.tier as PredictionTier | null
    const hasPenPrediction =
      prediction.penalty_home_score != null && prediction.penalty_away_score != null

    // Compute projected tier + points for live matches
    let projTier: PredictionTier | null = null
    let projPts: number | null = null
    if (
      match.status === 'live' &&
      match.home_score != null &&
      match.away_score != null &&
      prediction.points_earned === null
    ) {
      projTier = computeLiveTier(
        { home_score: prediction.home_score, away_score: prediction.away_score },
        { home_score: match.home_score, away_score: match.away_score }
      )
      if (scoringConfigs) {
        const config = getScoringForPhase(scoringConfigs, match.round.phase)
        if (config) projPts = tierToPoints(projTier, config)
      }
    }

    const displayTier = tier ?? projTier
    const ptsClass = displayTier ? TIER_TEXT_CLASSES[displayTier] : 'text-zinc-400'

    return (
      <div className="text-center mt-2.5">
        <span className="text-xs text-zinc-500">
          {t('prediction.yourPick')}{' '}
          <span className="text-zinc-300 font-semibold tabular-nums">
            {prediction.home_score} – {prediction.away_score}
          </span>
          {hasPenPrediction && (
            <span className="text-zinc-500">
              {' · '}
              <span className="text-zinc-500">{t('prediction.pens')}:</span>{' '}
              <span className="text-zinc-300 font-semibold tabular-nums">
                {prediction.penalty_home_score}–{prediction.penalty_away_score}
              </span>
            </span>
          )}
          {prediction.points_earned !== null ? (
            <span className={cn('ml-2 font-semibold', ptsClass)}>
              +{prediction.points_earned}
              {t('prediction.pts')}
            </span>
          ) : projTier !== null && projPts !== null ? (
            <span className={cn('ml-2 font-semibold', ptsClass)}>
              +{projPts} {t('prediction.proj')}
            </span>
          ) : null}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center mt-3 gap-2">
      {/* Main score row */}
      <div className="relative flex items-center justify-center w-full">
        <span className="absolute left-0 text-xs text-zinc-600 uppercase tracking-wide">
          {t('prediction.predict')}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            value={home}
            onChange={(e) => {
              setHome(e.target.value)
            }}
            onBlur={handleBlur}
            placeholder="0"
            className={INPUT_CLASS}
          />
          <span className="text-zinc-500 text-base font-medium">–</span>
          <input
            type="number"
            min={0}
            max={20}
            value={away}
            onChange={(e) => {
              setAway(e.target.value)
            }}
            onBlur={handleBlur}
            placeholder="0"
            className={INPUT_CLASS}
          />
        </div>
        <div
          className={cn(
            'absolute right-0 transition-opacity duration-700',
            isSuccess ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Check size={14} className="text-emerald-400" />
        </div>
      </div>

      {/* Penalty shootout row — only for knockout draws */}
      {showPenalty && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-500/70 uppercase tracking-wide">
            {t('prediction.pens')}
          </span>
          <input
            type="number"
            min={0}
            max={30}
            value={penHome}
            onChange={(e) => {
              setPenHome(e.target.value)
            }}
            onBlur={handleBlur}
            placeholder="–"
            className={PEN_INPUT_CLASS}
          />
          <span className="text-zinc-600 text-xs">–</span>
          <input
            type="number"
            min={0}
            max={30}
            value={penAway}
            onChange={(e) => {
              setPenAway(e.target.value)
            }}
            onBlur={handleBlur}
            placeholder="–"
            className={PEN_INPUT_CLASS}
          />
          <span className="text-[10px] text-zinc-600">{t('prediction.pensBonus')}</span>
        </div>
      )}
    </div>
  )
}
