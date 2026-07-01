import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { groupService } from '../services/groupService'

export function useMyGroups() {
  return useQuery({
    queryKey: queryKeys.groups(),
    queryFn:  groupService.getMyGroups,
  })
}
