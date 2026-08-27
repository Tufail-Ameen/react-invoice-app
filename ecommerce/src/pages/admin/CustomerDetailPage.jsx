import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, Mail, MapPin, Phone, ShoppingBag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { customersApi, queryKeys } from '@/api/endpoints'
import { Avatar } from '@/components/layout/UserMenu'
import { StatusBadge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { FullPageLoader } from '@/components/ui/Loaders'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { formatDate, formatMoney } from '@/lib/utils'

export function CustomerDetailPage() {
  const { id } = useParams()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => customersApi.detail(id),
  })

  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (isPending) return <FullPageLoader label="Customer load ho raha hai…" />

  const { customer, orders } = data

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link
            to="/admin/customers"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="size-4" />
            Customers
          </Link>
        }
        title={customer.fullName}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        actions={<StatusBadge status={customer.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardBody className="flex items-center gap-4">
              <Avatar name={customer.fullName} className="size-14 text-base" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">{customer.fullName}</p>
                <p className="truncate text-sm text-slate-500">{customer.email}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Contact" />
            <CardBody className="space-y-3 text-sm">
              <DetailRow icon={Mail} label="Email" value={customer.email} />
              <DetailRow icon={Phone} label="Phone" value={customer.phone} />
              <DetailRow icon={Building2} label="Company" value={customer.company} />
              <DetailRow
                icon={MapPin}
                label="Address"
                value={
                  [
                    customer.address?.line1,
                    customer.address?.city,
                    customer.address?.postalCode,
                    customer.address?.country,
                  ]
                    .filter(Boolean)
                    .join(', ') || null
                }
              />
            </CardBody>
          </Card>

          {customer.notes && (
            <Card>
              <CardHeader title="Internal notes" />
              <CardBody className="whitespace-pre-wrap text-sm text-slate-600">
                {customer.notes}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Orders" value={customer.ordersCount} icon={ShoppingBag} />
            <StatCard
              label="Total spent"
              value={formatMoney(customer.totalSpent)}
              tone="success"
            />
            <StatCard
              label="Last order"
              value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}
            />
          </div>

          <Card>
            <CardHeader title="Order history" description={`${orders.length} orders`} />
            {orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Abhi tak koi order nahi"
                description="Is customer ne ab tak kuch order nahi kiya."
              />
            ) : (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Order</TH>
                    <TH>Date</TH>
                    <TH align="right">Items</TH>
                    <TH>Status</TH>
                    <TH>Payment</TH>
                    <TH align="right">Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {orders.map((order) => (
                    <TR key={order.id}>
                      <TD>
                        <Link
                          to={`/admin/orders/${order.id}`}
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
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="break-words text-slate-800">{value || '—'}</p>
      </div>
    </div>
  )
}
