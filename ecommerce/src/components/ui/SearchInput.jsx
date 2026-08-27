import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Local state turant update hoti hai (typing lag na ho) aur `onChange`
 * debounce ke baad chalti hai taake har keystroke par API call na jaye.
 */
export function SearchInput({ value = '', onChange, placeholder = 'Search…', delay = 350, className }) {
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    if (draft === value) return undefined
    const timer = setTimeout(() => onChange(draft), delay)
    return () => clearTimeout(timer)
  }, [draft, delay, onChange, value])

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="focus-ring h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm placeholder:text-slate-400"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Clear search"
          className="focus-ring absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-slate-400 hover:text-slate-600"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
