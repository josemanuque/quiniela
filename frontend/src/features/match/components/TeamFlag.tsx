import { cn } from '@/lib/utils'

interface TeamFlagProps {
  flagUrl: string | null
  name: string
  size?: 'sm' | 'md'
}

const sizeClasses = {
  sm: 'w-5 h-4',
  md: 'w-7 h-5',
}

export function TeamFlag({ flagUrl, name, size = 'sm' }: TeamFlagProps) {
  if (!flagUrl) {
    return (
      <div className={cn('rounded-sm bg-zinc-700 flex-shrink-0', sizeClasses[size])} />
    )
  }

  return (
    <img
      src={flagUrl}
      alt={name}
      className={cn('rounded-sm object-cover flex-shrink-0', sizeClasses[size])}
      loading="lazy"
    />
  )
}
