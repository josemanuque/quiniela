import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { groupService } from '../services/groupService'

export function useJoinGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) => groupService.joinGroupByCode(inviteCode),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups() })
    },
  })
}
