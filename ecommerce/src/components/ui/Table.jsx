import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Table({ className, children }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className={cn('w-full min-w-[42rem] border-collapse text-sm', className)}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children }) {
  return <thead className="bg-slate-50/80">{children}</thead>
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function TR({ className, children, ...props }) {
  return (
    <tr className={cn('transition-colors hover:bg-slate-50/70', className)} {...props}>
      {children}
    </tr>
  )
}

export function TH({ className, align = 'left', children }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className
      )}
    >
      {children}
    </th>
  )
}

export function TD({ className, align = 'left', children, ...props }) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-slate-700',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

/**
 * Sortable column header.
 * `sort` string backend ko waise hi jata hai: `name` ya `-name` (descending).
 */
export function SortableTH({ field, sort, onSort, align = 'left', className, children }) {
  const active = sort === field || sort === `-${field}`
  const descending = sort === `-${field}`
  const Icon = !active ? ChevronsUpDown : descending ? ChevronDown : ChevronUp

  return (
    <TH align={align} className={cn('p-0', className)}>
      <button
        type="button"
        onClick={() => onSort(active && !descending ? `-${field}` : field)}
        className={cn(
          'focus-ring inline-flex w-full items-center gap-1 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-slate-900',
          align === 'right' && 'justify-end',
          align === 'center' && 'justify-center',
          active ? 'text-slate-900' : 'text-slate-500'
        )}
      >
        {children}
        <Icon className="size-3.5" />
      </button>
    </TH>
  )
}

export function Pagination({ meta, onPageChange, className }) {
  if (!meta) return null
  const { page, perPage, total, lastPage } = meta
  if (total === 0) return null

  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  const pages = []
  const windowStart = Math.max(1, Math.min(page - 2, lastPage - 4))
  const windowEnd = Math.min(lastPage, windowStart + 4)
  for (let index = windowStart; index <= windowEnd; index += 1) pages.push(index)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3',
        className
      )}
    >
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-700">
          {from}–{to}
        </span>{' '}
        of <span className="font-medium text-slate-700">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </PageButton>
        {windowStart > 1 && <span className="px-1 text-xs text-slate-400">…</span>}
        {pages.map((pageNumber) => (
          <PageButton
            key={pageNumber}
            active={pageNumber === page}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </PageButton>
        ))}
        {windowEnd < lastPage && <span className="px-1 text-xs text-slate-400">…</span>}
        <PageButton disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
          Next
        </PageButton>
      </div>
    </div>
  )
}

function PageButton({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'focus-ring min-w-8 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-brand-600 text-white'
          : 'text-slate-600 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40'
      )}
    >
      {children}
    </button>
  )
}
