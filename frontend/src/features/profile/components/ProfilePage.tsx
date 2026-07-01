import { useState, useEffect } from 'react'
import { Check, LogOut, Star, Trophy, Target, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useProfile } from '@/features/auth/hooks/useProfile'
import { authService } from '@/features/auth/services/authService'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { useMyStats } from '../hooks/useMyStats'
import { AvatarPicker } from './AvatarPicker'

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="bg-zinc-900 rounded-xl px-4 py-3.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className={accent} />
        <span className="text-[11px] text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
    </div>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: stats } = useMyStats()
  const { mutate: updateProfile, isPending, isSuccess } = useUpdateProfile()

  const [displayName, setDisplayName] = useState('')
  const nameChanged = displayName.trim() !== (profile?.display_name ?? '')
  const canSave = nameChanged && displayName.trim().length > 0 && displayName.trim().length <= 50

  // Sync input when profile loads
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name)
  }, [profile?.display_name])

  const googleAvatarUrl: string | null =
    (user?.user_metadata?.avatar_url as string | undefined) ?? null

  const accuracy =
    stats && stats.scored_predictions > 0
      ? Math.round((stats.correct_predictions / stats.scored_predictions) * 100)
      : null

  async function handleSignOut() {
    await authService.signOut()
  }

  return (
    <div className="flex flex-col min-h-full bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <h1 className="text-white font-semibold text-base">Profile</h1>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 max-w-lg">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-zinc-700">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">
                {profile?.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">{profile?.display_name}</p>
            <p className="text-zinc-500 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Avatar picker */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Avatar
          </h2>
          {user && (
            <AvatarPicker
              userId={user.id}
              googleUrl={googleAvatarUrl}
              currentUrl={profile?.avatar_url ?? null}
              onSelect={url => updateProfile({ avatar_url: url })}
              isPending={isPending}
            />
          )}
        </section>

        {/* Display name */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Display Name
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
              className="flex-1 h-10 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              onClick={() => updateProfile({ display_name: displayName.trim() })}
              disabled={!canSave || isPending}
              className={cn(
                'h-10 px-4 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                canSave && !isPending
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
              )}
            >
              {isSuccess && !nameChanged ? (
                <>
                  <Check size={13} />
                  Saved
                </>
              ) : isPending ? (
                'Saving…'
              ) : (
                'Save'
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-1.5">{displayName.length}/50</p>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            My Stats
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard
              icon={Star}
              label="Total Points"
              value={stats ? String(stats.total_points) : '—'}
              accent="text-amber-400"
            />
            <StatCard
              icon={Trophy}
              label="Global Rank"
              value={stats?.global_rank ? `#${stats.global_rank}` : '—'}
              accent="text-yellow-400"
            />
            <StatCard
              icon={Target}
              label="Predictions"
              value={stats ? String(stats.predictions_made) : '—'}
              accent="text-sky-400"
            />
            <StatCard
              icon={Percent}
              label="Accuracy"
              value={accuracy !== null ? `${accuracy}%` : '—'}
              accent="text-emerald-400"
            />
          </div>
          {stats && stats.scored_predictions > 0 && (
            <p className="text-xs text-zinc-600 mt-2 text-center">
              {stats.correct_predictions} correct out of {stats.scored_predictions} scored predictions
            </p>
          )}
        </section>

        {/* Sign out */}
        <section className="pt-2 pb-6">
          <div className="border-t border-zinc-800 pt-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-900/20 transition-colors text-sm font-medium"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
