import type { MatchWithTeams } from '@/types/domain.types'
import { MatchCard } from './MatchCard'
import { MatchListSkeleton } from './MatchListSkeleton'

interface MatchListProps {
  matches: MatchWithTeams[] | undefined
  isLoading: boolean
}

export function MatchList({ matches, isLoading }: MatchListProps) {
  if (isLoading) return <MatchListSkeleton />

  if (!matches || matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <p className="text-zinc-600 text-sm">No matches in this round.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
