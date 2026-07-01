import { useProfile } from '@features/auth/hooks/useProfile'

export function AppHeader() {
  const { data: profile } = useProfile()

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 h-12 flex items-center justify-between px-4">
      <span className="text-sm font-semibold text-white tracking-tight">
        Quiniela 2026
      </span>

      {profile && (
        <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
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
      )}
    </header>
  )
}
