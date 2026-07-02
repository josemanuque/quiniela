import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { authService } from '@/features/auth/services/authService'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: { display_name?: string; avatar_url?: string }) =>
      authService.updateProfile(user?.id ?? '', updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id ?? '') })
    },
  })
}
