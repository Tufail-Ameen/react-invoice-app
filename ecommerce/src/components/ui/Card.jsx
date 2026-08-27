import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4',
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <div className="mb-6">
      {breadcrumb}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function StatCard({ label, value, change, icon: Icon, tone = 'brand', footer }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', tones[tone])}>
            <Icon className="size-5" />
          </span>
        )}
      </div>
      {(change !== undefined && change !== null) || footer ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change !== undefined && change !== null && (
            <span
              className={cn(
                'font-medium',
                change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </span>
          )}
          {footer && <span className="text-slate-500">{footer}</span>}
        </div>
      ) : null}
    </Card>
  )
}
