import { useState } from 'react'
import { ArrowLeft, Copy, Check, LogOut } from 'lucide-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useGroupMembers } from '../hooks/useGroupMembers'
import { useMyGroups } from '../hooks/useMyGroups'
import { groupService } from '../services/groupService'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'

function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function GroupDetailPage() {
  const { groupId } = useParams({ from: '/app/groups/$groupId' })
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const { data: members, isLoading } = useGroupMembers(groupId)
  const { data: groups } = useMyGroups()
  const group = groups?.find(g => g.id === groupId)

  function handleCopy() {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleLeave() {
    if (leaving) return
    setLeaving(true)
    try {
      await groupService.leaveGroup(groupId)
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() })
      navigate({ to: '/app/groups' })
    } catch {
      setLeaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-h-full pb-14">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/app/groups' })}
          className="text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-semibold text-base flex-1 truncate">
          {group?.name ?? 'Group'}
        </h1>
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="text-zinc-600 hover:text-red-400 transition-colors"
          aria-label="Leave group"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Content — constrained width */}
      <div className="max-w-2xl mx-auto w-full">

      {/* Invite code */}
      {group && (
        <div className="mx-4 mt-4 bg-zinc-900 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Invite code</p>
            <p className="text-emerald-400 font-mono font-bold text-lg tracking-widest">
              {group.invite_code}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="text-zinc-500 hover:text-white transition-colors"
            aria-label="Copy invite code"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
        </div>
      )}

      {/* Members */}
      <div className="px-4 mt-4 pb-6">
        <p className="text-zinc-500 text-xs uppercase tracking-wide mb-3">
          Members · {members?.length ?? 0}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {members?.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-2.5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.profile.avatar_url ?? undefined} alt={m.profile.display_name} />
                  <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                    {initials(m.profile.display_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-white flex-1">{m.profile.display_name}</span>
                {m.user_id === user?.id && (
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wide">You</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>{/* /max-w-2xl */}
    </div>
  )
}
