import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { queryKeys, storefrontApi } from '@/api/endpoints'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { FullPageLoader, TableSkeleton } from '@/components/ui/Loaders'
import { Pagination, TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { useListParams } from '@/hooks/useListParams'
import { formatDate, formatMoney } from '@/lib/utils'

export function MyOrdersPage() {
  const { params, setPage } = useListParams({ per_page: 10, sort: '-placedAt' })

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.myOrders(params),
    queryFn: () => storefrontApi.myOrders(params),
    placeholderData: (previous) => previous,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader title="My Orders" description="Apne tamam orders aur unka status." />

      <Card>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <TableSkeleton columns={5} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Abhi tak koi order nahi"
            description="Jo order aap karenge wo yahan nazar aayega."
            action={
              <Link to="/">
                <Button>Shopping shuru karein</Button>
              </Link>
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Order</TH>
                  <TH>Date</TH>
                  <TH align="right">Items</TH>
                  <TH>Status</TH>
                  <TH align="right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((order) => (
                  <TR key={order.id}>
                    <TD>
                      <Link
                        to={`/account/orders/${order.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {order.orderNumber}
                      </Link>
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
                    <TD align="right" className="font-medium tabular-nums text-slate-900">
                      {formatMoney(order.grandTotal, order.currency)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  )
}

export function MyOrderDetailPage() {
  const { id } = useParams()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.myOrder(id),
    queryFn: () => storefrontApi.myOrder(id),
  })

  if (error) return <ErrorState error={error} onRetry={refetch} className="min-h-[60vh]" />
  if (isPending) return <FullPageLoader label="Order load ho raha hai…" />

  const { order } = data

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader
        breadcrumb={
          <Link
            to="/account/orders"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="size-4" />
            My Orders
          </Link>
        }
        title={order.orderNumber}
        description={formatDate(order.placedAt, { withTime: true })}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} kind="order" />
            <StatusBadge status={order.paymentStatus} kind="payment" />
          </div>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Items" />
          <ul className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
                  <Package className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity} × {formatMoney(item.unitPrice, order.currency)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-slate-900">
                  {formatMoney(item.lineTotal, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm">
            <SummaryRow label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
            <SummaryRow label="Tax" value={formatMoney(order.taxTotal, order.currency)} />
            <SummaryRow
              label="Shipping"
              value={
                order.shippingTotal === 0 ? 'Free' : formatMoney(order.shippingTotal, order.currency)
              }
            />
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(order.grandTotal, order.currency)}</span>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader title="Shipping address" />
            <CardBody className="text-sm text-slate-700">
              {[
                order.shippingAddress?.line1,
                order.shippingAddress?.city,
                order.shippingAddress?.postalCode,
                order.shippingAddress?.country,
              ]
                .filter(Boolean)
                .join(', ') || '—'}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <CardBody>
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {order.timeline.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="relative">
                    <span className="absolute -left-[23px] top-1.5 size-2.5 rounded-full border-2 border-white bg-brand-500" />
                    <StatusBadge status={entry.status} kind="order" />
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(entry.at, { withTime: true })}
                    </p>
                    {entry.note && <p className="mt-0.5 text-sm text-slate-600">{entry.note}</p>}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums text-slate-800">{value}</span>
    </div>
  )
}
