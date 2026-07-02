import { useState } from 'react'
import { Plus, UserPlus, Users } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useMyGroups } from '../hooks/useMyGroups'
import { useActiveCompetition } from '@/features/competition/hooks/useActiveCompetition'
import { GroupCard } from './GroupCard'
import { CreateGroupDialog } from './CreateGroupDialog'
import { JoinGroupDialog } from './JoinGroupDialog'

export function GroupsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const navigate = useNavigate()

  const { data: competition } = useActiveCompetition()
  const { data: groups, isLoading } = useMyGroups()

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-h-full pb-14">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-semibold text-base">Groups</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowJoin(true)
            }}
            className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <UserPlus size={15} />
            Join
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-3 space-y-2 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-zinc-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : groups?.length ? (
          groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => {
                void navigate({ to: '/app/groups/$groupId', params: { groupId: group.id } })
              }}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="bg-zinc-800 rounded-full p-5">
              <Users size={28} className="text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">No groups yet</p>
              <p className="text-zinc-500 text-sm mt-1">
                Create a group or join one with an invite code
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowJoin(true)
                }}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-600 transition-colors"
              >
                Join group
              </button>
              <button
                onClick={() => {
                  setShowCreate(true)
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
              >
                Create group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      {(groups?.length ?? 0) > 0 && (
        <button
          onClick={() => {
            setShowCreate(true)
          }}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg flex items-center justify-center transition-colors z-40"
          aria-label="Create group"
        >
          <Plus size={22} />
        </button>
      )}

      <CreateGroupDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        competitionId={competition?.id ?? 'a0000000-0000-0000-0000-000000000001'}
      />
      <JoinGroupDialog open={showJoin} onOpenChange={setShowJoin} />
    </div>
  )
}
