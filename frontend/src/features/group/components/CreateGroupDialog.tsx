import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCreateGroup } from '../hooks/useCreateGroup'
import type { GroupWithMemberCount } from '../services/groupService'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  competitionId: string
}

export function CreateGroupDialog({ open, onOpenChange, competitionId }: Props) {
  const [name, setName] = useState('')
  const [created, setCreated] = useState<GroupWithMemberCount | null>(null)
  const [copied, setCopied] = useState(false)

  const { mutate: createGroup, isPending, error } = useCreateGroup()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createGroup(
      { name: name.trim(), competitionId },
      {
        onSuccess: (group) => setCreated(group),
      },
    )
  }

  function handleCopy() {
    if (!created) return
    navigator.clipboard.writeText(created.invite_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setName('')
      setCreated(null)
      setCopied(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {created ? 'Group created!' : 'Create a group'}
          </DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
              Share the invite code with friends so they can join.
            </p>
            <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-4 py-3">
              <span className="flex-1 text-lg font-mono font-bold tracking-widest text-emerald-400">
                {created.invite_code}
              </span>
              <button
                onClick={handleCopy}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Copy invite code"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Group name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              autoFocus
              maxLength={60}
            />
            {error && (
              <p className="text-red-400 text-sm">{(error as Error).message}</p>
            )}
            <Button
              type="submit"
              disabled={!name.trim() || isPending}
              className="w-full"
            >
              {isPending ? 'Creating…' : 'Create group'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
