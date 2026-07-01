import { useState, useEffect, useRef } from 'react'
import { Lock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatchWithTeams } from '@/types/domain.types'
import { isMatchEditable } from '@/features/match/utils/matchUtils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMyPrediction } from '../hooks/useMyPrediction'
import { useSavePrediction } from '../hooks/useSavePrediction'

interface Props {
  match: MatchWithTeams
}

const INPUT_CLASS =
  'w-10 h-7 text-center text-sm font-medium tabular-nums bg-zinc-800 border border-zinc-700 ' +
  'rounded text-white outline-none focus:border-emerald-500 transition-colors ' +
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

export function PredictionInput({ match }: Props) {
  const { user } = useAuth()
  const editable = isMatchEditable(match.kickoff_at)

  const { data: prediction } = useMyPrediction(match.id)
  const { mutate: save, isPending, isSuccess } = useSavePrediction(match.id)

  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const initialised = useRef(false)

  // Populate inputs from saved prediction once loaded
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
        <div className="flex items-center justify-center gap-1 mt-2 text-zinc-600">
          <Lock size={10} />
          <span className="text-[10px]">No prediction</span>
        </div>
      )
    }
    return (
      <div className="text-center mt-2">
        <span className="text-[11px] text-zinc-500">
          Your pick:{' '}
          <span className="text-zinc-300 font-semibold tabular-nums">
            {prediction.home_score} – {prediction.away_score}
          </span>
          {prediction.points_earned !== null && (
            <span className="ml-2 text-emerald-400 font-semibold">
              +{prediction.points_earned}pts
            </span>
          )}
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
    <div className="flex items-center justify-center gap-2 mt-2.5">
      <span className="text-[10px] text-zinc-600 uppercase tracking-wide">Predict</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={e => setHome(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className={INPUT_CLASS}
        />
        <span className="text-zinc-500 text-sm font-medium">–</span>
        <input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={e => setAway(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className={INPUT_CLASS}
        />
      </div>
      <div
        className={cn(
          'transition-opacity duration-700',
          isSuccess && !isPending ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Check size={12} className="text-emerald-400" />
      </div>
    </div>
  )
}
