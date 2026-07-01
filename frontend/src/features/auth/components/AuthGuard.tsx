import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      void navigate({ to: '/login' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
