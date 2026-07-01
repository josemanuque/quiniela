import { Skeleton } from '@/components/ui/skeleton'

function MatchCardSkeleton() {
  return (
    <div className="bg-zinc-900 rounded-lg px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Skeleton className="w-5 h-4 rounded-sm" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <Skeleton className="h-5 w-12 rounded" />
        <div className="flex-1 flex items-center justify-end gap-2">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="w-5 h-4 rounded-sm" />
        </div>
      </div>
      <Skeleton className="h-2.5 w-24 rounded mx-auto" />
    </div>
  )
}

export function MatchListSkeleton() {
  return (
    <div className="px-4 py-3 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  )
}
