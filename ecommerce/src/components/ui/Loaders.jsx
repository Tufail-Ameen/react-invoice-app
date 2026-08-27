import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className }) {
  return <Loader2 className={cn('size-5 animate-spin text-brand-600', className)} />
}

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Spinner className="size-7" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className={cn('skeleton h-4 rounded', columnIndex === 0 ? 'w-1/4' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="skeleton mb-3 h-3 w-20 rounded" />
          <div className="skeleton h-7 w-28 rounded" />
        </div>
      ))}
    </div>
  )
}
