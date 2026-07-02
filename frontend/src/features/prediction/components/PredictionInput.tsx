import { useState, useEffect, useRef } from 'react'
import { Lock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatchWithTeams, PredictionTier } from '@/types/domain.types'
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

const INPUT_CLASS =
  'w-14 h-10 text-center text-base font-medium tabular-nums bg-zinc-800 border border-zinc-700 ' +
  'rounded text-white outline-none focus:border-emerald-500 transition-colors ' +
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

export function PredictionInput({ match }: Props) {
  const { user } = useAuth()
  const editable = isMatchEditable(match.kickoff_at)

  const { data: prediction } = useMyPrediction(match.id)
  const { mutate: save, isSuccess } = useSavePrediction(match.id)
  const { data: scoringConfigs } = useScoringConfig(match.round.competition_id)

  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const initialised = useRef(false)

  useEffect(() => {
    if (prediction && !initialised.current) {
      setHome(String(prediction.home_score))
      setAway(String(prediction.away_score))
      initialised.current = true
    }
  }, [prediction])

  if (!user) return null

  if (!editable) {
    if (!prediction) {
      return (
        <div className="flex items-center justify-center gap-1 mt-2.5 text-zinc-600">
          <Lock size={12} />
          <span className="text-xs">No prediction</span>
        </div>
      )
    }

    const tier = prediction.tier as PredictionTier | null

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
          Your pick:{' '}
          <span className="text-zinc-300 font-semibold tabular-nums">
            {prediction.home_score} – {prediction.away_score}
          </span>
          {prediction.points_earned !== null ? (
            <span className={cn('ml-2 font-semibold', ptsClass)}>
              +{prediction.points_earned}pts
            </span>
          ) : projTier !== null && projPts !== null ? (
            <span className={cn('ml-2 font-semibold', ptsClass)}>+{projPts} proj</span>
          ) : null}
        </span>
      </div>
    )
  }

  function handleBlur() {
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return
    save({ homeScore: h, awayScore: a })
  }

  return (
    <div className="relative flex items-center justify-center mt-3">
      <span className="absolute left-0 text-xs text-zinc-600 uppercase tracking-wide">Predict</span>
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
  )
}
