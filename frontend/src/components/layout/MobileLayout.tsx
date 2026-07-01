import { Outlet } from '@tanstack/react-router'
import { AuthGuard } from '@features/auth/components/AuthGuard'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'

export function MobileLayout() {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-svh bg-zinc-950 text-white max-w-md mx-auto relative">
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-16">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
