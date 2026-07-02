import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { authService } from '../services/authService'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.profile(user?.id ?? ''),
    queryFn: () => authService.getProfile(user?.id ?? ''),
    enabled: !!user,
    staleTime: 5 * 60_000,
  })
}
