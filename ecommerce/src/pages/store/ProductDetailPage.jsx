import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Minus, Package, Plus, ShoppingBag, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { queryKeys, storefrontApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/EmptyState'
import { FullPageLoader } from '@/components/ui/Loaders'
import { useCart } from '@/store/CartContext'
import { formatMoney } from '@/lib/utils'

export function ProductDetailPage() {
  const { slug } = useParams()
  const { add } = useCart()
  const [quantity, setQuantity] = useState(1)

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.storefrontProduct(slug),
    queryFn: () => storefrontApi.product(slug),
  })

  if (error) return <ErrorState error={error} onRetry={refetch} className="min-h-[60vh]" />
  if (isPending) return <FullPageLoader label="Product load ho raha hai…" />

  const { product, related } = data
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" />
        Shop par wapas
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="grid aspect-square place-items-center">
              <Package className="size-16 text-slate-300" />
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{product.category?.name}</Badge>
            {product.lowStock && <Badge tone="warning">Sirf {product.stock} bache</Badge>}
            {!product.inStock && <Badge tone="danger">Out of stock</Badge>}
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {product.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-400">SKU {product.sku}</p>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold text-slate-900">
              {formatMoney(product.price)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  {formatMoney(product.compareAtPrice)}
                </span>
                <Badge tone="danger">{discount}% off</Badge>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">{product.description}</p>

          {product.inStock && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg ring-1 ring-slate-200">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((previous) => Math.max(1, previous - 1))}
                  className="focus-ring grid size-10 place-items-center rounded-l-lg text-slate-500 hover:bg-slate-50"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((previous) => Math.min(product.stock, previous + 1))}
                  className="focus-ring grid size-10 place-items-center rounded-r-lg text-slate-500 hover:bg-slate-50"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <Button size="lg" onClick={() => add(product, quantity)}>
                <ShoppingBag className="size-4" />
                Cart mein daalein
              </Button>
            </div>
          )}

          <div className="mt-8 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="flex items-center gap-2.5">
              <Truck className="size-4 shrink-0 text-slate-400" />
              Rs 10,000 se upar free shipping.
            </p>
            <p className="flex items-center gap-2.5">
              <Package className="size-4 shrink-0 text-slate-400" />
              Stock real time hai — checkout par server dobara verify karta hai.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Isi category se</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link
                key={item.id}
                to={`/products/${item.slug}`}
                className="group overflow-hidden rounded-xl border border-slate-200 transition-shadow hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-slate-100">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatMoney(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
