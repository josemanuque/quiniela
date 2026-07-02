import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import type { GlobalLeaderboardRow } from '../services/leaderboardService'

interface Props {
  rows: GlobalLeaderboardRow[]
  currentUserId: string | undefined
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  labelStyle: { color: '#e4e4e7', fontSize: 12 },
  itemStyle: { color: '#a1a1aa', fontSize: 12 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

export function ExactCountChart({ rows, currentUserId }: Props) {
  const { t } = useTranslation()
  const data = [...rows]
    .sort((a, b) => b.exact_count - a.exact_count)
    .map((r) => ({
      name: r.display_name,
      count: r.exact_count,
      isMe: r.user_id === currentUserId,
    }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }} barCategoryGap="30%">
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} />
        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} allowDecimals={false} width={36} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v) => {
            const n = typeof v === 'number' ? v : 0
            return [t('leaderboard.exactCount', { count: n }), ''] as [string, string]
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => {
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            return <Cell key={i} fill={entry.isMe ? '#f59e0b' : '#52525b'} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
