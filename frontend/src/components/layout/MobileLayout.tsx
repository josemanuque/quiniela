import { Outlet } from '@tanstack/react-router'
import { AuthGuard } from '@features/auth/components/AuthGuard'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'
import { DesktopSidebar } from './DesktopSidebar'

export function MobileLayout() {
  return (
    <AuthGuard>
      <div className="flex min-h-svh bg-zinc-950 text-white">
        <DesktopSidebar />
        <div className="flex flex-col flex-1 min-w-0 md:pl-60">
          <AppHeader />
          <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </div>
    </AuthGuard>
  )
}
