import { Bell, BellOff, Calendar, Clock, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useSubscribePush } from '../hooks/useSubscribePush'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences'

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        onChange(!checked)
      }}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-emerald-500' : 'bg-zinc-700',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow',
          'transform transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

interface PrefRowProps {
  icon: React.ElementType
  label: string
  sublabel: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

function PrefRow({ icon: Icon, label, sublabel, checked, onChange, disabled }: PrefRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <Icon size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-zinc-200 leading-none">{label}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{sublabel}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

export function NotificationSettings() {
  const { t } = useTranslation()
  const {
    state,
    subscribe,
    unsubscribe,
    isPending: subPending,
    error: subError,
  } = useSubscribePush()
  const { preferences, savePreferences, isPending: prefPending } = useNotificationPreferences()

  if (state === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-600 py-2">
        <BellOff size={13} />
        {t('notifications.unsupported')}
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="text-xs text-zinc-500 py-2">
        <p>{t('notifications.denied')}</p>
      </div>
    )
  }

  if (state === 'unsubscribed') {
    return (
      <div className="space-y-2">
        <button
          onClick={() => {
            void subscribe()
          }}
          disabled={subPending}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          <Bell size={14} />
          {subPending ? t('notifications.enabling') : t('notifications.enable')}
        </button>
        {subError && <p className="text-xs text-red-400 text-center">{subError}</p>}
      </div>
    )
  }

  // subscribed
  const isDisabled = !preferences?.enabled || prefPending
  return (
    <div className="space-y-1">
      {/* Master toggle */}
      <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2.5">
          <Bell size={14} className="text-emerald-400" />
          <span className="text-sm font-medium text-zinc-200">{t('notifications.enabled')}</span>
        </div>
        <Toggle
          checked={preferences?.enabled ?? true}
          onChange={(v) => {
            savePreferences({ enabled: v })
          }}
          disabled={prefPending}
        />
      </div>

      <div className={cn('divide-y divide-zinc-800/60', isDisabled && 'opacity-50')}>
        <PrefRow
          icon={Calendar}
          label={t('notifications.daily')}
          sublabel={t('notifications.dailySub')}
          checked={preferences?.daily ?? true}
          onChange={(v) => {
            savePreferences({ daily: v })
          }}
          disabled={isDisabled}
        />
        <PrefRow
          icon={Clock}
          label={t('notifications.pre1h')}
          sublabel={t('notifications.pre1hSub')}
          checked={preferences?.pre_1h ?? true}
          onChange={(v) => {
            savePreferences({ pre_1h: v })
          }}
          disabled={isDisabled}
        />
        <PrefRow
          icon={Timer}
          label={t('notifications.pre5m')}
          sublabel={t('notifications.pre5mSub')}
          checked={preferences?.pre_5m ?? true}
          onChange={(v) => {
            savePreferences({ pre_5m: v })
          }}
          disabled={isDisabled}
        />
      </div>

      <button
        onClick={() => {
          void unsubscribe()
        }}
        disabled={subPending}
        className="mt-3 w-full text-xs text-zinc-600 hover:text-red-400 transition-colors py-1 disabled:opacity-40"
      >
        {t('notifications.disable')}
      </button>
    </div>
  )
}
