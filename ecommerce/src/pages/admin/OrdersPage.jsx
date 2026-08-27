import { useQuery } from '@tanstack/react-query'
import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ordersApi, queryKeys } from '@/api/endpoints'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Field'
import { TableSkeleton } from '@/components/ui/Loaders'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination, SortableTH, TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { useListParams } from '@/hooks/useListParams'
import { formatDate, formatMoney } from '@/lib/utils'

export function OrdersPage() {
  const { params, setParams, setPage, setSearch, setSort, reset, activeFilterCount } =
    useListParams({ sort: '-placedAt' })

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => ordersApi.list(params),
    placeholderData: (previous) => previous,
  })

  return (
    <>
      <PageHeader
        title="Orders"
        description="Order lifecycle track karein aur status update karein."
        actions={
          data?.totals ? (
            <div className="rounded-lg bg-white px-4 py-2 ring-1 ring-slate-200">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Filtered revenue
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {formatMoney(data.totals.revenue)}
              </p>
            </div>
          ) : null
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput
            value={params.search ?? ''}
            onChange={setSearch}
            placeholder="Order number, naam ya email…"
            className="min-w-56 flex-1"
          />

          <Select
            value={params.status ?? ''}
            onChange={(event) => setParams({ status: event.target.value })}
            className="w-auto min-w-32"
          >
            <option value="">Sab status</option>
            {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(
              (status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              )
            )}
          </Select>

          <Select
            value={params.payment_status ?? ''}
            onChange={(event) => setParams({ payment_status: event.target.value })}
            className="w-auto min-w-32"
          >
            <option value="">Sab payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="refunded">Refunded</option>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={params.from ?? ''}
              onChange={(event) => setParams({ from: event.target.value })}
              className="w-auto"
              aria-label="From date"
            />
            <span className="text-xs text-slate-400">to</span>
            <Input
              type="date"
              value={params.to ?? ''}
              onChange={(event) => setParams({ to: event.target.value })}
              className="w-auto"
              aria-label="To date"
            />
          </div>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Clear
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <TableSkeleton columns={6} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Koi order nahi mila"
            description="Filters badal kar dekhein, ya storefront se ek test order lagayein."
            action={
              <Link to="/">
                <Button variant="secondary">Storefront kholein</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <SortableTH field="orderNumber" sort={params.sort} onSort={setSort}>
                      Order
                    </SortableTH>
                    <TH>Customer</TH>
                    <SortableTH field="placedAt" sort={params.sort} onSort={setSort}>
                      Placed
                    </SortableTH>
                    <TH align="right">Items</TH>
                    <TH>Status</TH>
                    <TH>Payment</TH>
                    <SortableTH field="grandTotal" sort={params.sort} onSort={setSort} align="right">
                      Total
                    </SortableTH>
                  </TR>
                </THead>
                <TBody>
                  {data.items.map((order) => (
                    <TR key={order.id}>
                      <TD>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-medium text-slate-900 hover:text-brand-600"
                        >
                          {order.orderNumber}
                        </Link>
                      </TD>
                      <TD>
                        <p className="truncate text-slate-800">{order.customerName}</p>
                        <p className="truncate text-xs text-slate-500">{order.customerEmail}</p>
                      </TD>
                      <TD className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(order.placedAt)}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {order.itemCount}
                      </TD>
                      <TD>
                        <StatusBadge status={order.status} kind="order" />
                      </TD>
                      <TD>
                        <StatusBadge status={order.paymentStatus} kind="payment" />
                      </TD>
                      <TD align="right" className="font-medium tabular-nums text-slate-900">
                        {formatMoney(order.grandTotal, order.currency)}
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
