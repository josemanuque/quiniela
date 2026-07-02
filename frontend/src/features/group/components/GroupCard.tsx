import { useState } from 'react'
import { Users, Copy, Check, ChevronRight, Trophy } from 'lucide-react'
import type { GroupWithMemberCount } from '../services/groupService'

interface Props {
  group: GroupWithMemberCount
  onClick: () => void
}

export function GroupCard({ group, onClick }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(group.invite_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="bg-zinc-900 rounded-lg px-4 py-3 cursor-pointer hover:bg-zinc-800 active:bg-zinc-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{group.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-zinc-500 text-xs">
              <Users size={11} />
              <span>{group.member_count}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
              aria-label="Copy invite code"
            >
              {copied ? (
                <Check size={11} className="text-emerald-400" />
              ) : (
                <Copy size={11} />
              )}
              <span className="font-mono">{group.invite_code}</span>
            </button>
          </div>
          {group.stakes && (
            <div className="flex items-center gap-1 mt-1.5">
              <Trophy size={10} className="text-amber-400 flex-shrink-0" />
              <p className="text-amber-300/70 text-xs truncate">{group.stakes}</p>
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
      </div>
    </div>
  )
}
