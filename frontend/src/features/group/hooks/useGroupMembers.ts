import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { groupService } from '../services/groupService'

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groupMembers(groupId),
    queryFn:  () => groupService.getGroupMembers(groupId),
    enabled:  !!groupId,
  })
}
