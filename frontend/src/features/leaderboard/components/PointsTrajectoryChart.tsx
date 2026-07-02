import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { TrajectoryRow, Granularity } from '../services/leaderboardService'

// Palette distinct from tier colors and the emerald UI chrome
const LINE_COLORS = [
  '#818cf8', // indigo
  '#f59e0b', // amber
  '#34d399', // emerald
  '#f87171', // red
  '#fb923c', // orange
  '#22d3ee', // cyan
  '#e879f9', // fuchsia
  '#a3e635', // lime
]

interface Props {
  rows:        TrajectoryRow[]
  granularity: Granularity
}

type DataPoint = { x_sort: string; x_label: string } & Record<string, number>

function buildData(rows: TrajectoryRow[]): { data: DataPoint[]; users: { user_id: string; display_name: string }[] } {
  const userMap = new Map<string, string>()
  const byXSort = new Map<string, DataPoint>()

  for (const row of rows) {
    userMap.set(row.user_id, row.display_name)
    if (!byXSort.has(row.x_sort)) {
      byXSort.set(row.x_sort, { x_sort: row.x_sort, x_label: row.x_label })
    }
    byXSort.get(row.x_sort)![row.user_id] = row.cumulative_points
  }

  const sorted = [...byXSort.values()].sort((a, b) => a.x_sort.localeCompare(b.x_sort))
  const users  = [...userMap.entries()].map(([user_id, display_name]) => ({ user_id, display_name }))

  // Forward-fill: each user's cumulative total persists to periods where they have no new points
  const lastSeen: Record<string, number> = {}
  for (const point of sorted) {
    for (const { user_id } of users) {
      if (point[user_id] !== undefined) {
        lastSeen[user_id] = point[user_id]
      } else if (lastSeen[user_id] !== undefined) {
        point[user_id] = lastSeen[user_id]
      }
    }
  }

  return { data: sorted, users }
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '8px 12px' },
  labelStyle:   { color: '#e4e4e7', fontSize: 12, marginBottom: 4 },
  itemStyle:    { color: '#a1a1aa', fontSize: 12 },
}

export function PointsTrajectoryChart({ rows, granularity }: Props) {
  const { data, users } = buildData(rows)

  const isMatch = granularity === 'match'

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: isMatch ? 56 : 4 }}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
        <XAxis
          dataKey="x_label"
          tick={{ fill: '#71717a', fontSize: 10 }}
          angle={isMatch ? -40 : 0}
          textAnchor={isMatch ? 'end' : 'middle'}
          interval={isMatch ? 'preserveStartEnd' : 0}
        />
        <YAxis
          tick={{ fill: '#71717a', fontSize: 10 }}
          allowDecimals={false}
          width={36}
        />
        <Tooltip {...TOOLTIP_STYLE} />
        {users.length <= 8 && (
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: isMatch ? 0 : 8 }}
            formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
          />
        )}
        {users.map(({ user_id, display_name }, i) => (
          <Line
            key={user_id}
            type="monotone"
            dataKey={user_id}
            name={display_name}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
