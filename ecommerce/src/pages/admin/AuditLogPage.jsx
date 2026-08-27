import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { auditApi, queryKeys } from '@/api/endpoints'
import { Avatar } from '@/components/layout/UserMenu'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Field'
import { TableSkeleton } from '@/components/ui/Loaders'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination, TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { useListParams } from '@/hooks/useListParams'
import { formatDate, formatRelative } from '@/lib/utils'

const ACTION_TONES = [
  [/deleted|refunded/, 'danger'],
  [/created|registered|placed/, 'success'],
  [/updated|changed|adjusted/, 'info'],
]

const toneFor = (action) =>
  ACTION_TONES.find(([pattern]) => pattern.test(action))?.[1] ?? 'neutral'

export function AuditLogPage() {
  const { params, setParams, setPage, setSearch, reset, activeFilterCount } = useListParams({
    sort: '-createdAt',
    per_page: 20,
  })

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => auditApi.list(params),
    placeholderData: (previous) => previous,
  })

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Kis ne, kab, kya kiya — sab record hai. Ye table kabhi edit nahi hoti, sirf append hoti hai."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput
            value={params.search ?? ''}
            onChange={setSearch}
            placeholder="Actor ya action…"
            className="min-w-48 flex-1"
          />
          <Select
            value={params.action ?? ''}
            onChange={(event) => setParams({ action: event.target.value })}
            className="w-auto min-w-44"
          >
            <option value="">Sab actions</option>
            {data?.facets.actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Select>
          <Select
            value={params.resource_type ?? ''}
            onChange={(event) => setParams({ resource_type: event.target.value })}
            className="w-auto min-w-36"
          >
            <option value="">Sab resources</option>
            {data?.facets.resourceTypes.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </Select>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Clear
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <TableSkeleton columns={5} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Koi activity nahi mili"
            description="Admin panel mein kuch change karein — wo yahan turant nazar aayega."
          />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Actor</TH>
                    <TH>Action</TH>
                    <TH>Resource</TH>
                    <TH>Details</TH>
                    <TH>When</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.items.map((log) => (
                    <TR key={log.id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={log.actorName} className="size-7 text-[10px]" />
                          <span className="truncate text-slate-800">{log.actorName}</span>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone={toneFor(log.action)}>
                          <code className="font-mono text-[11px]">{log.action}</code>
                        </Badge>
                      </TD>
                      <TD className="text-slate-600">
                        {log.resourceType}
                        {log.resourceId && (
                          <code className="ml-1.5 rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-500">
                            {log.resourceId}
                          </code>
                        )}
                      </TD>
                      <TD className="max-w-xs">
                        <span className="block truncate text-xs text-slate-500">
                          {Object.entries(log.meta ?? {})
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(' · ') || '—'}
                        </span>
                      </TD>
                      <TD className="whitespace-nowrap">
                        <span className="text-slate-700">{formatRelative(log.createdAt)}</span>
                        <span className="block text-[11px] text-slate-400">
                          {formatDate(log.createdAt, { withTime: true })}
                        </span>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </Card>
    </>
  )
}
