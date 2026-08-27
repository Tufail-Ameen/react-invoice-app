import { cn } from '@/lib/utils'

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
}

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

const ORDER_STATUS_TONES = {
  pending: 'warning',
  processing: 'info',
  shipped: 'brand',
  delivered: 'success',
  cancelled: 'neutral',
  refunded: 'danger',
}

const PAYMENT_STATUS_TONES = {
  paid: 'success',
  unpaid: 'warning',
  refunded: 'danger',
}

const GENERIC_TONES = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'danger',
  draft: 'neutral',
  archived: 'neutral',
  out: 'danger',
  low: 'warning',
  healthy: 'success',
}

export function StatusBadge({ status, kind = 'generic', className }) {
  if (!status) return null
  const map =
    kind === 'order' ? ORDER_STATUS_TONES : kind === 'payment' ? PAYMENT_STATUS_TONES : GENERIC_TONES
  return (
    <Badge tone={map[status] ?? 'neutral'} className={cn('capitalize', className)}>
      {String(status).replace(/_/g, ' ')}
    </Badge>
  )
}
