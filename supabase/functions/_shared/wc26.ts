// Shared WC 2026 helpers — used by sync-scores Edge Function.
// Pure TypeScript, no Node or Deno APIs.

export interface WC26Match {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: string
  away_score: string
  home_penalty_score?: string
  away_penalty_score?: string
  group: string
  local_date: string   // "MM/DD/YYYY HH:MM" in venue local time
  finished: string     // "TRUE" | "FALSE"
  time_elapsed: string // "notstarted" | "finished" | live minutes
  type: string         // "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final"
  stadium_id: string
}

// UTC offset (hours) per stadium during WC 2026 (June–July)
// Mexico abolished DST in 2023 — always UTC-6 (CST), never UTC-5
export const STADIUM_UTC_OFFSET: Record<string, number> = {
  '1':  -6,  // Estadio Azteca        — Mexico City  (CST)
  '2':  -6,  // Estadio Akron         — Guadalajara  (CST)
  '3':  -6,  // Estadio BBVA          — Monterrey    (CST)
  '4':  -5,  // AT&T Stadium          — Dallas       (CDT)
  '5':  -5,  // NRG Stadium           — Houston      (CDT)
  '6':  -5,  // Arrowhead             — Kansas City  (CDT)
  '7':  -4,  // Mercedes-Benz         — Atlanta      (EDT)
  '8':  -4,  // Hard Rock             — Miami        (EDT)
  '9':  -4,  // Gillette              — Boston       (EDT)
  '10': -4,  // Lincoln Financial     — Philadelphia (EDT)
  '11': -4,  // MetLife               — New York     (EDT)
  '12': -4,  // BMO Field             — Toronto      (EDT)
  '13': -7,  // BC Place              — Vancouver    (PDT)
  '14': -7,  // Lumen Field           — Seattle      (PDT)
  '15': -7,  // Levi's Stadium        — San Francisco(PDT)
  '16': -7,  // SoFi Stadium          — Los Angeles  (PDT)
}

const GROUP_ROUND_IDS: Record<string, string> = {
  A: 'c0000000-0000-0000-0000-000000000001',
  B: 'c0000000-0000-0000-0000-000000000002',
  C: 'c0000000-0000-0000-0000-000000000003',
  D: 'c0000000-0000-0000-0000-000000000004',
  E: 'c0000000-0000-0000-0000-000000000005',
  F: 'c0000000-0000-0000-0000-000000000006',
  G: 'c0000000-0000-0000-0000-000000000007',
  H: 'c0000000-0000-0000-0000-000000000008',
  I: 'c0000000-0000-0000-0000-000000000009',
  J: 'c0000000-0000-0000-0000-000000000010',
  K: 'c0000000-0000-0000-0000-000000000011',
  L: 'c0000000-0000-0000-0000-000000000012',
}

const KNOCKOUT_ROUND_IDS: Record<string, string> = {
  r32:   'c0000000-0000-0000-0000-000000000013',
  r16:   'c0000000-0000-0000-0000-000000000014',
  qf:    'c0000000-0000-0000-0000-000000000015',
  sf:    'c0000000-0000-0000-0000-000000000016',
  third: 'c0000000-0000-0000-0000-000000000017',
  final: 'c0000000-0000-0000-0000-000000000018',
}

export function getRoundId(m: WC26Match): string | null {
  if (m.type === 'group') return GROUP_ROUND_IDS[m.group] ?? null
  return KNOCKOUT_ROUND_IDS[m.type] ?? null
}

export function mapStatus(m: WC26Match): 'upcoming' | 'live' | 'completed' {
  if (m.finished === 'TRUE') return 'completed'
  if (m.time_elapsed === 'notstarted') return 'upcoming'
  return 'live'
}

// "MM/DD/YYYY HH:MM" + stadium_id → UTC ISO string
export function parseKickoff(localDate: string, stadiumId: string): string {
  const [datePart, timePart] = localDate.split(' ')
  const [mm, dd, yyyy] = datePart.split('/')
  const offset = STADIUM_UTC_OFFSET[stadiumId] ?? -6
  const sign = offset <= 0 ? '-' : '+'
  const abs = String(Math.abs(offset)).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${timePart}:00${sign}${abs}:00`
}
