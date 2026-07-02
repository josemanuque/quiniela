import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/notificationService'

type SubscribeState = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed'

export function useSubscribePush() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<SubscribeState>('unsubscribed')
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!notificationService.isSupported()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    void notificationService.getCurrentSubscription().then((sub) => {
      setState(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  const subscribe = useCallback(async () => {
    setIsPending(true)
    try {
      await notificationService.subscribe()
      setState('subscribed')
      void queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    } catch {
      if (Notification.permission === 'denied') setState('denied')
    } finally {
      setIsPending(false)
    }
  }, [queryClient])

  const unsubscribe = useCallback(async () => {
    setIsPending(true)
    try {
      await notificationService.unsubscribe()
      setState('unsubscribed')
    } finally {
      setIsPending(false)
    }
  }, [])

  return { state, subscribe, unsubscribe, isPending }
}
