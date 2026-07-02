import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useJoinGroup } from '../hooks/useJoinGroup'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinGroupDialog({ open, onOpenChange }: Props) {
  const [code, setCode] = useState('')
  const { mutate: join, isPending, error, isSuccess } = useJoinGroup()

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    join(code.trim(), {
      onSuccess: () => {
        setTimeout(() => {
          onOpenChange(false)
          setCode('')
        }, 800)
      },
    })
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setCode('')
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Join a group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Enter invite code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
            }}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 font-mono tracking-widest text-center text-lg"
            autoFocus
            maxLength={8}
          />
          {error && <p className="text-red-400 text-sm">{error.message}</p>}
          {isSuccess && <p className="text-emerald-400 text-sm text-center">Joined!</p>}
          <Button type="submit" disabled={code.length < 6 || isPending} className="w-full">
            {isPending ? 'Joining…' : 'Join group'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
