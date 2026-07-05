import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useActiveCompetition } from '@features/competition/hooks/useActiveCompetition'
import { useRounds } from '@features/competition/hooks/useRounds'
import { useMatchesByRound } from '../hooks/useMatchesByRound'
import { useMatchesByMatchday } from '../hooks/useMatchesByMatchday'
import { useNowMatches, NOW_ROUND_ID } from '../hooks/useNowMatches'
import { RoundTabs } from './RoundTabs'
import { isGroupMatchdayId, matchdayFromId } from '../utils/matchdayUtils'
import { MatchList } from './MatchList'

export function MatchesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { round: selectedRoundId } = useSearch({ from: '/app/matches' })

  const { data: competition } = useActiveCompetition()
  const { data: rounds } = useRounds(competition?.id)

  const isNow = selectedRoundId === NOW_ROUND_ID
  const isMatchday = !!selectedRoundId && isGroupMatchdayId(selectedRoundId)
  const activeMatchday = isMatchday ? matchdayFromId(selectedRoundId) : undefined

  const { data: nowMatches, isLoading: nowLoading } = useNowMatches(competition?.id)
  const { data: roundMatches, isLoading: roundLoading } = useMatchesByRound(
    isNow || isMatchday ? undefined : selectedRoundId
  )
  const { data: matchdayMatches, isLoading: matchdayLoading } = useMatchesByMatchday(
    competition?.id,
    activeMatchday
  )

  const matches = isNow ? nowMatches : isMatchday ? matchdayMatches : roundMatches
  const isLoading = isNow ? nowLoading : isMatchday ? matchdayLoading : roundLoading

  // Default to "Now" on first load (no round in URL)
  useEffect(() => {
    if (!selectedRoundId && competition) {
      void navigate({
        to: '/app/matches',
        search: { round: NOW_ROUND_ID },
        replace: true,
      })
    }
  }, [selectedRoundId, competition, navigate])

  function handleRoundSelect(roundId: string) {
    void navigate({ to: '/app/matches', search: { round: roundId } })
  }

  return (
    <div className="flex flex-col min-h-full">
      {rounds && rounds.length > 0 && (
        <RoundTabs rounds={rounds} selectedRoundId={selectedRoundId} onSelect={handleRoundSelect} />
      )}

      {isNow && !isLoading && (!matches || matches.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 max-w-2xl mx-auto w-full">
          <p className="text-zinc-400 text-sm font-medium">{t('match.noMatchesToday')}</p>
          <p className="text-zinc-600 text-xs text-center">{t('match.browseRounds')}</p>
        </div>
      ) : (
        <MatchList matches={matches} isLoading={isLoading} />
      )}
    </div>
  )
}
