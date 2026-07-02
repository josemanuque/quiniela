import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/notificationService'
import type { NotificationPreferences } from '../types/notification.types'

const QUERY_KEY = ['notification-preferences']

export function useNotificationPreferences() {
  const queryClient = useQueryClient()

  const { data: preferences, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationService.getPreferences(),
    // Default all true when no row exists yet
    select: (data): NotificationPreferences =>
      data ?? { enabled: true, daily: true, pre_1h: true, pre_5m: true },
  })

  const { mutate: savePreferences, isPending } = useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) =>
      notificationService.savePreferences(prefs),
    onMutate: async (prefs) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const prev = queryClient.getQueryData<NotificationPreferences>(QUERY_KEY)
      queryClient.setQueryData(QUERY_KEY, (old: NotificationPreferences | undefined) => ({
        enabled: true,
        daily: true,
        pre_1h: true,
        pre_5m: true,
        ...old,
        ...prefs,
      }))
      return { prev }
    },
    onError: (_err, _prefs, ctx) => {
      queryClient.setQueryData(QUERY_KEY, ctx?.prev)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return { preferences, isLoading, savePreferences, isPending }
}
