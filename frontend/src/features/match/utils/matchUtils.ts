import type { MatchStatus } from '@/types/domain.types'

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

export function formatKickoffTime(kickoffAt: string): string {
  return timeFormatter.format(new Date(kickoffAt))
}

export function formatKickoffDate(kickoffAt: string): string {
  return dateFormatter.format(new Date(kickoffAt))
}

export function isMatchEditable(kickoffAt: string): boolean {
  return new Date(kickoffAt) > new Date()
}

export function getScoreDisplay(
  status: MatchStatus,
  homeScore: number | null,
  awayScore: number | null
): string {
  if (status === 'upcoming') return 'vs'
  if (homeScore === null || awayScore === null) return '-'
  return `${homeScore.toString()} – ${awayScore.toString()}`
}
