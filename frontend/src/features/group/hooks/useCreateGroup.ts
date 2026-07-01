import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { groupService } from '../services/groupService'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, competitionId }: { name: string; competitionId: string }) =>
      groupService.createGroup(name, competitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() })
    },
  })
}
