import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { inventoryApi, queryKeys } from '@/api/endpoints'
import { Can } from '@/auth/guards'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { TableSkeleton } from '@/components/ui/Loaders'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination, SortableTH, TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { useListParams } from '@/hooks/useListParams'
import { PERMISSIONS as P } from '@/lib/permissions'
import { cn, formatDate, formatMoney, formatNumber } from '@/lib/utils'

export function InventoryPage() {
  const queryClient = useQueryClient()
  const { params, setParams, setPage, setSearch, setSort, reset, activeFilterCount } =
    useListParams({ sort: 'stock' })
  const [adjusting, setAdjusting] = useState(null)
  const [delta, setDelta] = useState(0)
  const [reason, setReason] = useState('')

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.inventory(params),
    queryFn: () => inventoryApi.list(params),
    placeholderData: (previous) => previous,
  })

  const { data: movementData } = useQuery({
    queryKey: queryKeys.inventoryMovements({ per_page: 8 }),
    queryFn: () => inventoryApi.movements({ per_page: 8 }),
  })

  const adjustMutation = useMutation({
    mutationFn: () =>
      inventoryApi.adjust({ productId: adjusting.id, quantity: Number(delta), reason }),
    onSuccess: () => {
      toast.success('Stock adjust ho gaya.')
      closeAdjust()
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  const openAdjust = (row) => {
    setAdjusting(row)
    setDelta(0)
    setReason('')
  }

  const closeAdjust = () => {
    setAdjusting(null)
    setDelta(0)
    setReason('')
  }

  return (
    <>
      <PageHeader title="Inventory" description="Stock levels aur har movement ka record." />

      {data?.summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total units" value={formatNumber(data.summary.totalUnits)} icon={Boxes} />
          <StatCard label="Stock value" value={formatMoney(data.summary.stockValue)} tone="success" />
          <StatCard
            label="Low stock"
            value={data.summary.lowStock}
            tone="warning"
            footer="threshold se neeche"
          />
          <StatCard label="Out of stock" value={data.summary.outOfStock} tone="danger" />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <SearchInput
              value={params.search ?? ''}
              onChange={setSearch}
              placeholder="Product ya SKU…"
              className="min-w-48 flex-1"
            />
            <Select
              value={params.state ?? ''}
              onChange={(event) => setParams({ state: event.target.value })}
              className="w-auto min-w-36"
            >
              <option value="">Sab</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
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
            <EmptyState icon={Boxes} title="Koi item nahi mila" />
          ) : (
            <>
              <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <SortableTH field="name" sort={params.sort} onSort={setSort}>
                        Product
                      </SortableTH>
                      <SortableTH field="stock" sort={params.sort} onSort={setSort} align="right">
                        On hand
                      </SortableTH>
                      <TH align="right">Threshold</TH>
                      <TH>State</TH>
                      <TH align="right">Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.items.map((row) => (
                      <TR key={row.id}>
                        <TD>
                          <p className="font-medium text-slate-900">{row.name}</p>
                          <p className="text-xs text-slate-500">{row.sku}</p>
                        </TD>
                        <TD align="right">
                          <span
                            className={cn(
                              'font-semibold tabular-nums',
                              row.state === 'out'
                                ? 'text-rose-600'
                                : row.state === 'low'
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                            )}
                          >
                            {row.stock}
                          </span>
                        </TD>
                        <TD align="right" className="tabular-nums text-slate-500">
                          {row.lowStockThreshold}
                        </TD>
                        <TD>
                          <StatusBadge status={row.state} />
                        </TD>
                        <TD align="right">
                          <Can permission={P.INVENTORY_ADJUST}>
                            <Button variant="secondary" size="sm" onClick={() => openAdjust(row)}>
                              Adjust
                            </Button>
                          </Can>
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

        <Card>
          <CardHeader title="Recent movements" description="Har stock change ka ledger" />
          <ul className="divide-y divide-slate-100">
            {movementData?.items.map((movement) => (
              <li key={movement.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {movement.productName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{movement.reason}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      movement.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                    )}
                  >
                    {movement.quantity > 0 ? '+' : ''}
                    {movement.quantity}
                  </span>
                </div>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                  {movement.type} · {formatDate(movement.createdAt)} · balance{' '}
                  {movement.balanceAfter}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal
        open={Boolean(adjusting)}
        onClose={closeAdjust}
        title="Stock adjust karein"
        description={adjusting ? `${adjusting.name} — abhi ${adjusting.stock} units` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeAdjust}>
              Cancel
            </Button>
            <Button
              loading={adjustMutation.isPending}
              disabled={!Number(delta) || !reason.trim()}
              onClick={() => adjustMutation.mutate()}
            >
              Adjustment save karein
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Quantity change"
            hint="Add karne ke liye positive, nikalne ke liye negative."
          >
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                aria-label="Decrease"
                onClick={() => setDelta((previous) => Number(previous) - 1)}
              >
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                step="1"
                value={delta}
                onChange={(event) => setDelta(event.target.value)}
                className="text-center"
              />
              <Button
                variant="secondary"
                size="icon"
                aria-label="Increase"
                onClick={() => setDelta((previous) => Number(previous) + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </Field>

          {adjusting && Number(delta) !== 0 && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">Naya balance: </span>
              <span className="font-semibold text-slate-900">
                {adjusting.stock + Number(delta)}
              </span>
            </div>
          )}

          <Field label="Wajah" hint="Audit trail ke liye zaroori hai.">
            <Textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Stock count correction, damaged goods, supplier delivery…"
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
