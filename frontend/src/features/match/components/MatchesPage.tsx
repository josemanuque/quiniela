import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useActiveCompetition } from '@features/competition/hooks/useActiveCompetition'
import { useRounds } from '@features/competition/hooks/useRounds'
import { useMatchesByRound } from '../hooks/useMatchesByRound'
import { RoundTabs } from './RoundTabs'
import { MatchList } from './MatchList'

export function MatchesPage() {
  const navigate = useNavigate()
  const { round: selectedRoundId } = useSearch({ from: '/app/matches' })

  const { data: competition } = useActiveCompetition()
  const { data: rounds } = useRounds(competition?.id)
  const { data: matches, isLoading: matchesLoading } = useMatchesByRound(selectedRoundId)

  // Auto-select the first round when no round is in the URL
  useEffect(() => {
    if (rounds && rounds.length > 0 && !selectedRoundId) {
      void navigate({
        to: '/app/matches',
        search: { round: rounds[0].id },
        replace: true,
      })
    }
  }, [rounds, selectedRoundId, navigate])

  function handleRoundSelect(roundId: string) {
    void navigate({ to: '/app/matches', search: { round: roundId } })
  }

  return (
    <div className="flex flex-col min-h-full">
      {rounds && rounds.length > 0 && (
        <RoundTabs
          rounds={rounds}
          selectedRoundId={selectedRoundId}
          onSelect={handleRoundSelect}
        />
      )}

      <MatchList matches={matches} isLoading={matchesLoading} />
    </div>
  )
}
