import { Minus, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCart } from '@/store/CartContext'
import { formatMoney } from '@/lib/utils'

const TAX_RATE = 0.17
const FREE_SHIPPING_THRESHOLD = 10_000
const SHIPPING_FEE = 350

export function CartPage() {
  const { items, subtotal, isEmpty, setQuantity, remove, clear } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Sirf preview ke liye. Asli totals checkout par server calculate karta hai.
  const tax = Math.round(subtotal * TAX_RATE)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal + tax + shipping

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title="Aapka cart khali hai"
          description="Kuch products add karein phir checkout karein."
          action={
            <Link to="/">
              <Button>Shopping shuru karein</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Cart</h1>
          <p className="mt-1 text-sm text-slate-500">{items.length} products</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          Cart khali karein
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-4 p-4">
                <Link
                  to={`/products/${item.slug}`}
                  className="size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center">
                      <Package className="size-6 text-slate-300" />
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.slug}`}
                        className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-brand-600"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate-500">{formatMoney(item.price)}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => remove(item.productId)}
                      className="focus-ring grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-lg ring-1 ring-slate-200">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        className="focus-ring grid size-8 place-items-center rounded-l-lg text-slate-500 hover:bg-slate-50"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={item.quantity >= (item.maxStock ?? 99)}
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        className="focus-ring grid size-8 place-items-center rounded-r-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="lg:sticky lg:top-24">
            <CardHeader title="Order summary" />
            <CardBody className="space-y-3 text-sm">
              <Row label="Subtotal" value={formatMoney(subtotal)} />
              <Row label="Tax (17%)" value={formatMoney(tax)} />
              <Row
                label="Shipping"
                value={shipping === 0 ? 'Free' : formatMoney(shipping)}
                tone={shipping === 0 ? 'success' : undefined}
              />
              {shipping > 0 && (
                <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                  {formatMoney(FREE_SHIPPING_THRESHOLD - subtotal)} aur add karein, shipping free
                  ho jayegi.
                </p>
              )}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() =>
                  navigate(isAuthenticated ? '/checkout' : '/login', {
                    state: isAuthenticated ? undefined : { from: { pathname: '/checkout' } },
                  })
                }
              >
                {isAuthenticated ? 'Checkout karein' : 'Checkout ke liye login karein'}
              </Button>

              <p className="text-center text-[11px] leading-relaxed text-slate-400">
                Ye totals sirf preview hain. Server checkout par apne database se qeemat nikal kar
                dobara calculate karta hai.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={tone === 'success' ? 'font-medium text-emerald-600' : 'tabular-nums text-slate-800'}
      >
        {value}
      </span>
    </div>
  )
}
