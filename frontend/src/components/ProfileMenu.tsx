import type { ReactNode } from 'react'
import { LogOut, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useProfile } from '@features/auth/hooks/useProfile'
import { useAuth } from '@features/auth/hooks/useAuth'
import { authService } from '@features/auth/services/authService'

interface Props {
  children: ReactNode
  align?: 'start' | 'center' | 'end'
}

export function ProfileMenu({ children, align = 'end' }: Props) {
  const { data: profile } = useProfile()
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  function initials(name: string) {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  function toggleLanguage() {
    const next = i18n.language.startsWith('es') ? 'en' : 'es'
    localStorage.setItem('quiniela-lang', next)
    void i18n.changeLanguage(next)
  }

  const currentLang = i18n.language.startsWith('es') ? 'ES' : 'EN'

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        className="w-56 bg-zinc-900 border-zinc-700 p-0 shadow-xl overflow-hidden"
        align={align}
        sideOffset={8}
      >
        {/* Identity */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} referrerPolicy="no-referrer" />
            <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
              {profile ? initials(profile.display_name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile?.display_name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-1">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Languages size={14} />
              {t('language')}
            </div>
            <span className="text-xs font-bold tracking-wide text-zinc-300">{currentLang}</span>
          </button>

          <button
            onClick={() => {
              void authService.signOut()
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={14} />
            {t('auth.signOut')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
