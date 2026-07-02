import { Link, useRouterState } from '@tanstack/react-router'
import { Calendar, Users, Trophy, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useProfile } from '@features/auth/hooks/useProfile'
import { ScoringRulesPopover } from '@/components/ScoringRulesPopover'
import { ProfileMenu } from '@/components/ProfileMenu'

const NAV_ITEMS = [
  { to: '/app/matches' as const, labelKey: 'nav.matches', Icon: Calendar },
  { to: '/app/groups' as const, labelKey: 'nav.groups', Icon: Users },
  { to: '/app/leaderboard' as const, labelKey: 'nav.leaderboard', Icon: Trophy },
  { to: '/app/profile' as const, labelKey: 'nav.profile', Icon: User },
]

export function DesktopSidebar() {
  const { data: profile } = useProfile()
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 bg-zinc-950 border-r border-zinc-800 z-40">
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 flex-shrink-0">
        <span className="text-white font-bold text-lg tracking-tight">{t('appTitle')} 2026</span>
        <ScoringRulesPopover align="start" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, labelKey, Icon }) => {
          const isActive = pathname.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              )}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{t(labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {profile && (
        <div className="p-4 border-t border-zinc-800 flex-shrink-0">
          <ProfileMenu align="start">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 font-medium">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{profile.display_name}</p>
              </div>
            </button>
          </ProfileMenu>
        </div>
      )}
    </aside>
  )
}
