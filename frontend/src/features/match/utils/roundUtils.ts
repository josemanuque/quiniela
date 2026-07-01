import type { RoundPhase } from '@/types/domain.types'

// Short label shown in the horizontal pill strip (mobile-optimised)
export function getRoundTabLabel(phase: RoundPhase, name: string): string {
  if (phase === 'group') {
    // "Group A" → "A"
    return name.replace('Group ', '')
  }
  const labels: Record<RoundPhase, string> = {
    group:          name,
    round_of_32:    'R32',
    round_of_16:    'R16',
    quarter_final:  'QF',
    semi_final:     'SF',
    third_place:    '3rd',
    final:          'Final',
  }
  return labels[phase]
}

// Longer label for screen-reader / aria-label
export function getRoundDisplayLabel(phase: RoundPhase, name: string): string {
  if (phase === 'group') return name
  const labels: Record<RoundPhase, string> = {
    group:          name,
    round_of_32:    'Round of 32',
    round_of_16:    'Round of 16',
    quarter_final:  'Quarter-finals',
    semi_final:     'Semi-finals',
    third_place:    'Third-Place Playoff',
    final:          'Final',
  }
  return labels[phase]
}
