import { Link, useRouterState } from '@tanstack/react-router'
import { Calendar, Users, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/app/matches',     label: 'Matches',     Icon: Calendar, enabled: true  },
  { to: '/app/groups',      label: 'Groups',      Icon: Users,    enabled: true  },
  { to: '/app/leaderboard', label: 'Leaderboard', Icon: Trophy,   enabled: true  },
  { to: '/app/profile',     label: 'Profile',     Icon: User,     enabled: false },
] as const

export function BottomNav() {
  const pathname = useRouterState({ select: s => s.location.pathname })

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 h-16 flex">
      {NAV_ITEMS.map(({ to, label, Icon, enabled }) => {
        const isActive = pathname.startsWith(to)

        if (!enabled) {
          return (
            <div
              key={to}
              className="flex-1 flex flex-col items-center justify-center gap-1 opacity-40 cursor-not-allowed"
            >
              <Icon size={22} className="text-zinc-500" />
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
          )
        }

        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
              isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
