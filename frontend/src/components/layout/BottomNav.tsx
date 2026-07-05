import { Link, useRouterState } from '@tanstack/react-router'
import { Calendar, Users, Trophy, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/app/matches' as const, labelKey: 'nav.matches', Icon: Calendar },
  { to: '/app/groups' as const, labelKey: 'nav.groups', Icon: Users },
  { to: '/app/leaderboard' as const, labelKey: 'nav.leaderboard', Icon: Trophy },
  { to: '/app/profile' as const, labelKey: 'nav.profile', Icon: User },
]

export function BottomNav() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 flex flex-col">
      <div className="h-16 flex">
        {NAV_ITEMS.map(({ to, labelKey, Icon }) => {
          const isActive = pathname.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
                isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon size={22} />
              <span className="text-xs">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
      {/* 5px buffer + home indicator area on iOS/Android */}
      <div
        className="bg-zinc-950/95"
        style={{ height: 'calc(5px + env(safe-area-inset-bottom))' }}
      />
    </nav>
  )
}
