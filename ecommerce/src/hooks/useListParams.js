import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * List screens ki state URL mein rakhti hai (?page=2&search=serum&sort=-price).
 *
 * Faida: refresh, back button aur link share — sab kaam karte hain, aur ye
 * bilkul wahi query params hain jo backend expect karega.
 */
export function useListParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => {
    const result = { page: 1, per_page: 10, ...defaults }
    searchParams.forEach((value, key) => {
      result[key] = key === 'page' || key === 'per_page' ? Number(value) || result[key] : value
    })
    return result
  }, [searchParams, defaults])

  const setParams = useCallback(
    (updates, { resetPage = true } = {}) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          Object.entries(updates).forEach(([key, value]) => {
            if (value === '' || value === null || value === undefined) next.delete(key)
            else next.set(key, String(value))
          })
          if (resetPage && !('page' in updates)) next.delete('page')
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const reset = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams])

  const activeFilterCount = useMemo(
    () =>
      [...searchParams.keys()].filter((key) => !['page', 'per_page', 'sort'].includes(key)).length,
    [searchParams]
  )

  return {
    params,
    setParams,
    reset,
    activeFilterCount,
    setPage: (page) => setParams({ page }, { resetPage: false }),
    setSort: (sort) => setParams({ sort }),
    setSearch: (search) => setParams({ search }),
  }
}
