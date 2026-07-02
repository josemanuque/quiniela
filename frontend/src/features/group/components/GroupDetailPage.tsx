import { useState } from 'react'
import { ArrowLeft, Copy, Check, LogOut, Trophy, Pencil, X } from 'lucide-react'
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
  const [editingStakes, setEditingStakes] = useState(false)
  const [stakesInput, setStakesInput] = useState('')
  const [savingStakes, setSavingStakes] = useState(false)

  const { data: members, isLoading } = useGroupMembers(groupId)
  const { data: groups } = useMyGroups()
  const group = groups?.find(g => g.id === groupId)

  const isOwner = group?.owner_id === user?.id

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

  function startEditStakes() {
    setStakesInput(group?.stakes ?? '')
    setEditingStakes(true)
  }

  async function saveStakes() {
    if (savingStakes) return
    setSavingStakes(true)
    try {
      await groupService.updateGroupStakes(groupId, stakesInput)
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() })
      setEditingStakes(false)
    } finally {
      setSavingStakes(false)
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

      {/* Stakes banner */}
      {group && (group.stakes || isOwner) && (
        <div className="mx-4 mt-4 bg-amber-500/8 border border-amber-500/20 rounded-lg px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Trophy size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wide">Stakes</p>
                {isOwner && !editingStakes && (
                  <button
                    onClick={startEditStakes}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                    aria-label="Edit stakes"
                  >
                    <Pencil size={11} />
                  </button>
                )}
              </div>

              {editingStakes ? (
                <div className="mt-1.5 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={stakesInput}
                    onChange={e => setStakesInput(e.target.value)}
                    maxLength={200}
                    placeholder="e.g. Last place buys pizza 🍕"
                    className="flex-1 h-8 px-2.5 rounded-lg bg-zinc-800 border border-zinc-600 text-white text-xs placeholder:text-zinc-600 outline-none focus:border-amber-500 transition-colors"
                    onKeyDown={e => { if (e.key === 'Enter') void saveStakes(); if (e.key === 'Escape') setEditingStakes(false) }}
                  />
                  <button
                    onClick={() => void saveStakes()}
                    disabled={savingStakes}
                    className="h-8 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {savingStakes ? '…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingStakes(false)}
                    className="h-8 w-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center justify-center"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : group.stakes ? (
                <p className="text-amber-200/70 text-sm mt-0.5">{group.stakes}</p>
              ) : (
                <button
                  onClick={startEditStakes}
                  className="text-zinc-600 hover:text-zinc-400 text-xs mt-0.5 transition-colors"
                >
                  Add stakes or prize for this group…
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                {m.user_id === group?.owner_id && (
                  <span className="text-[10px] text-amber-500/70 uppercase tracking-wide">Owner</span>
                )}
                {m.user_id === user?.id && m.user_id !== group?.owner_id && (
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wide">You</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
