import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from './queryClient'
import { router } from './router'
import { AuthProvider } from '@features/auth/hooks/useAuth'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={300}>
          <RouterProvider router={router} />
          <Toaster position="bottom-center" richColors theme="dark" offset={72} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
