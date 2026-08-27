import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, RotateCcw, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ordersApi, queryKeys } from '@/api/endpoints'
import { Can } from '@/auth/guards'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { Field, Select, Textarea } from '@/components/ui/Field'
import { FullPageLoader } from '@/components/ui/Loaders'
import { Modal } from '@/components/ui/Modal'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { PERMISSIONS as P } from '@/lib/permissions'
import { formatDate, formatMoney } from '@/lib/utils'

export function OrderDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [nextStatus, setNextStatus] = useState('')
  const [note, setNote] = useState('')
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => ordersApi.detail(id),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.order(id) })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
  }

  const statusMutation = useMutation({
    mutationFn: () => ordersApi.updateStatus({ id, status: nextStatus, note }),
    onSuccess: () => {
      toast.success(`Order ab "${nextStatus}" hai.`)
      setNextStatus('')
      setNote('')
      invalidate()
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  const refundMutation = useMutation({
    mutationFn: () => ordersApi.refund({ id, reason: refundReason }),
    onSuccess: () => {
      toast.success('Refund ho gaya aur stock wapas add kar diya gaya.')
      setRefundOpen(false)
      setRefundReason('')
      invalidate()
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (isPending) return <FullPageLoader label="Order load ho raha hai…" />

  const { order, customer, allowedTransitions } = data

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link
            to="/admin/orders"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="size-4" />
            Orders
          </Link>
        }
        title={order.orderNumber}
        description={`${formatDate(order.placedAt, { withTime: true })} · ${order.paymentMethod.replace(/_/g, ' ')}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} kind="order" />
            <StatusBadge status={order.paymentStatus} kind="payment" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Items" description={`${order.items.length} line items`} />
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Product</TH>
                  <TH align="right">Unit price</TH>
                  <TH align="right">Qty</TH>
                  <TH align="right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {order.items.map((item) => (
                  <TR key={item.productId}>
                    <TD>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {formatMoney(item.unitPrice, order.currency)}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {item.quantity}
                    </TD>
                    <TD align="right" className="font-medium tabular-nums text-slate-900">
                      {formatMoney(item.lineTotal, order.currency)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm">
              <TotalRow label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
              <TotalRow label="Tax" value={formatMoney(order.taxTotal, order.currency)} />
              <TotalRow
                label="Shipping"
                value={
                  order.shippingTotal === 0
                    ? 'Free'
                    : formatMoney(order.shippingTotal, order.currency)
                }
              />
              {order.discountTotal > 0 && (
                <TotalRow
                  label="Discount"
                  value={`− ${formatMoney(order.discountTotal, order.currency)}`}
                  tone="success"
                />
              )}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
                <span>Grand total</span>
                <span className="tabular-nums">
                  {formatMoney(order.grandTotal, order.currency)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Timeline" description="Order ne ab tak kaun se stages dekhe" />
            <CardBody>
              <ol className="relative space-y-5 border-l border-slate-200 pl-6">
                {order.timeline.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="relative">
                    <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-white bg-brand-500 ring-1 ring-brand-200" />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={entry.status} kind="order" />
                      <span className="text-xs text-slate-500">
                        {formatDate(entry.at, { withTime: true })} · {entry.by}
                      </span>
                    </div>
                    {entry.note && <p className="mt-1 text-sm text-slate-600">{entry.note}</p>}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Can permission={P.ORDERS_UPDATE}>
            <Card>
              <CardHeader
                title="Status update"
                description="Sirf valid transitions allowed hain."
              />
              <CardBody className="space-y-3">
                {allowedTransitions.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Ye order <span className="font-medium">{order.status}</span> hai — yahan se aage
                    koi transition nahi.
                  </p>
                ) : (
                  <>
                    <Field label="Naya status">
                      <Select
                        value={nextStatus}
                        onChange={(event) => setNextStatus(event.target.value)}
                      >
                        <option value="">Chunein…</option>
                        {allowedTransitions.map((status) => (
                          <option key={status} value={status} className="capitalize">
                            {status}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Note" hint="Optional — timeline par nazar aayega.">
                      <Textarea
                        rows={2}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Courier ko de diya…"
                      />
                    </Field>
                    <Button
                      className="w-full"
                      disabled={!nextStatus}
                      loading={statusMutation.isPending}
                      onClick={() => statusMutation.mutate()}
                    >
                      Status update karein
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>
          </Can>

          <Can permission={P.ORDERS_REFUND}>
            {order.paymentStatus === 'paid' && (
              <Card className="border-rose-200">
                <CardHeader title="Refund" description="Stock automatically wapas add hoga." />
                <CardBody>
                  <Button variant="danger" className="w-full" onClick={() => setRefundOpen(true)}>
                    <RotateCcw className="size-4" />
                    Refund issue karein
                  </Button>
                </CardBody>
              </Card>
            )}
          </Can>

          <Card>
            <CardHeader title="Customer" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  {customer ? (
                    <Link
                      to={`/admin/customers/${customer.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {order.customerName}
                    </Link>
                  ) : (
                    <p className="font-medium text-slate-900">{order.customerName}</p>
                  )}
                  <p className="truncate text-slate-500">{order.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Shipping address</p>
                  <p className="text-slate-800">
                    {[
                      order.shippingAddress?.line1,
                      order.shippingAddress?.city,
                      order.shippingAddress?.postalCode,
                      order.shippingAddress?.country,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Refund issue karein"
        description={`${formatMoney(order.grandTotal, order.currency)} wapas kiya jayega.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={refundMutation.isPending}
              onClick={() => refundMutation.mutate()}
            >
              Refund confirm karein
            </Button>
          </>
        }
      >
        <Field label="Wajah" hint="Audit log mein record hogi.">
          <Textarea
            rows={3}
            value={refundReason}
            onChange={(event) => setRefundReason(event.target.value)}
            placeholder="Customer ne product wapas kar diya…"
          />
        </Field>
      </Modal>
    </>
  )
}

function TotalRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={tone === 'success' ? 'tabular-nums text-emerald-600' : 'tabular-nums text-slate-800'}>
        {value}
      </span>
    </div>
  )
}
