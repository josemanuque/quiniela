import { useTranslation } from 'react-i18next'
import { useProfile } from '@features/auth/hooks/useProfile'
import { ScoringRulesPopover } from '@/components/ScoringRulesPopover'
import { ProfileMenu } from '@/components/ProfileMenu'

export function AppHeader() {
  const { data: profile } = useProfile()
  const { t } = useTranslation()

  return (
    <header className="md:hidden sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 h-14 flex items-center justify-between px-4">
      <span className="text-xl font-bold text-white tracking-tight">{t('appTitle')} 2026</span>

      <div className="flex items-center gap-3">
        <ScoringRulesPopover size={20} />

        {profile && (
          <ProfileMenu>
            <button
              className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label={t('auth.accountMenu')}
            >
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
            </button>
          </ProfileMenu>
        )}
      </div>
    </header>
  )
}
