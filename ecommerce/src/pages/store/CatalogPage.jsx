import { useQuery } from '@tanstack/react-query'
import { Package, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { queryKeys, storefrontApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Field'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Table'
import { useListParams } from '@/hooks/useListParams'
import { useCart } from '@/store/CartContext'
import { cn, formatMoney } from '@/lib/utils'

export function CatalogPage() {
  const { params, setParams, setPage, setSearch, reset, activeFilterCount } = useListParams({
    per_page: 9,
    sort: '-createdAt',
  })

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.storefrontProducts(params),
    queryFn: () => storefrontApi.products(params),
    placeholderData: (previous) => previous,
  })

  const { data: categoryData } = useQuery({
    queryKey: queryKeys.storefrontCategories,
    queryFn: storefrontApi.categories,
  })

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-brand-50/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <Badge tone="brand">Demo storefront</Badge>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Beauty essentials, backend seekhne ke liye.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
            Ye poora storefront ek REST API par chal raha hai. Product list, cart aur checkout —
            har step ke peeche ek endpoint hai jise aap khud bana sakte hain.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SearchInput
            value={params.search ?? ''}
            onChange={setSearch}
            placeholder="Products dhoondein…"
            className="min-w-56 flex-1"
          />
          <Select
            value={params.category_id ?? ''}
            onChange={(event) => setParams({ category_id: event.target.value })}
            className="w-auto min-w-40"
          >
            <option value="">Sab categories</option>
            {categoryData?.items.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.productCount})
              </option>
            ))}
          </Select>
          <Select
            value={params.sort ?? '-createdAt'}
            onChange={(event) => setParams({ sort: event.target.value })}
            className="w-auto min-w-40"
          >
            <option value="-createdAt">Newest first</option>
            <option value="price">Price: low to high</option>
            <option value="-price">Price: high to low</option>
            <option value="name">Name A–Z</option>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="skeleton aspect-square" />
                <div className="space-y-2 p-4">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Koi product nahi mila"
            description="Filters badal kar dobara koshish karein."
            action={
              <Button variant="secondary" onClick={reset}>
                Filters clear karein
              </Button>
            }
          />
        ) : (
          <>
            <div
              className={cn(
                'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
                isFetching && 'opacity-60 transition-opacity'
              )}
            >
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-slate-200 bg-white">
              <Pagination meta={data.meta} onPageChange={setPage} className="border-t-0" />
            </div>
          </>
        )}
      </section>
    </>
  )
}

function ProductCard({ product }) {
  const { add } = useCart()
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center">
              <Package className="size-10 text-slate-300" />
            </div>
          )}
          {discount && (
            <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
              −{discount}%
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 grid place-items-center bg-white/75">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                Out of stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">{product.category?.name}</p>
        <Link to={`/products/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-slate-900 transition-colors group-hover:text-brand-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <span className="text-base font-semibold text-slate-900">
              {formatMoney(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="ml-1.5 text-xs text-slate-400 line-through">
                {formatMoney(product.compareAtPrice)}
              </span>
            )}
          </div>
          <Button size="sm" disabled={!product.inStock} onClick={() => add(product)}>
            <ShoppingBag className="size-4" />
            Add
          </Button>
        </div>

        {product.lowStock && (
          <p className="mt-2 text-xs font-medium text-amber-600">
            Sirf {product.stock} bache hain
          </p>
        )}
      </div>
    </article>
  )
}
