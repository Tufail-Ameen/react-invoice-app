import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { categoriesApi, productsApi, queryKeys } from '@/api/endpoints'
import { Can } from '@/auth/guards'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Field'
import { TableSkeleton } from '@/components/ui/Loaders'
import { ConfirmDialog } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination, SortableTH, TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { useListParams } from '@/hooks/useListParams'
import { PERMISSIONS as P } from '@/lib/permissions'
import { formatMoney, formatDate } from '@/lib/utils'

export function ProductsPage() {
  const queryClient = useQueryClient()
  const { params, setParams, setPage, setSearch, setSort, reset, activeFilterCount } =
    useListParams({ sort: '-createdAt' })
  const [pendingDelete, setPendingDelete] = useState(null)

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => productsApi.list(params),
    placeholderData: (previous) => previous,
  })

  const { data: categoryData } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.list,
  })

  const removeMutation = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => {
      toast.success('Product delete ho gaya.')
      setPendingDelete(null)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalog manage karein — qeemat, stock aur status."
        actions={
          <Can permission={P.PRODUCTS_CREATE}>
            <Link to="/admin/products/new">
              <Button>
                <Plus className="size-4" />
                Naya product
              </Button>
            </Link>
          </Can>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput
            value={params.search ?? ''}
            onChange={setSearch}
            placeholder="Naam ya SKU se dhoondein…"
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
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            value={params.status ?? ''}
            onChange={(event) => setParams({ status: event.target.value })}
            className="w-auto min-w-32"
          >
            <option value="">Sab status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>

          <Select
            value={params.stock ?? ''}
            onChange={(event) => setParams({ stock: event.target.value })}
            className="w-auto min-w-32"
          >
            <option value="">Sab stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Filters clear karein
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <TableSkeleton columns={6} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Koi product nahi mila"
            description={
              activeFilterCount > 0
                ? 'Filters badal kar dobara koshish karein.'
                : 'Apna pehla product add karein aur catalog shuru karein.'
            }
            action={
              activeFilterCount > 0 ? (
                <Button variant="secondary" onClick={reset}>
                  Filters clear karein
                </Button>
              ) : (
                <Can permission={P.PRODUCTS_CREATE}>
                  <Link to="/admin/products/new">
                    <Button>Naya product</Button>
                  </Link>
                </Can>
              )
            }
          />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <SortableTH field="name" sort={params.sort} onSort={setSort}>
                      Product
                    </SortableTH>
                    <TH>Category</TH>
                    <SortableTH field="price" sort={params.sort} onSort={setSort} align="right">
                      Price
                    </SortableTH>
                    <SortableTH field="stock" sort={params.sort} onSort={setSort} align="right">
                      Stock
                    </SortableTH>
                    <TH>Status</TH>
                    <SortableTH field="updatedAt" sort={params.sort} onSort={setSort}>
                      Updated
                    </SortableTH>
                    <TH align="right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.items.map((product) => (
                    <TR key={product.id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <ProductThumb product={product} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.sku}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-slate-600">{product.category?.name ?? '—'}</TD>
                      <TD align="right">
                        <span className="font-medium text-slate-900">
                          {formatMoney(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="ml-1.5 text-xs text-slate-400 line-through">
                            {formatMoney(product.compareAtPrice)}
                          </span>
                        )}
                      </TD>
                      <TD align="right">
                        <span
                          className={
                            product.stock === 0
                              ? 'font-semibold text-rose-600'
                              : product.lowStock
                                ? 'font-semibold text-amber-600'
                                : 'text-slate-700'
                          }
                        >
                          {product.stock}
                        </span>
                      </TD>
                      <TD>
                        <StatusBadge status={product.status} />
                      </TD>
                      <TD className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(product.updatedAt)}
                      </TD>
                      <TD align="right">
                        <div className="flex justify-end gap-1">
                          <Can permission={P.PRODUCTS_UPDATE}>
                            <Link to={`/admin/products/${product.id}/edit`}>
                              <Button variant="ghost" size="icon" aria-label="Edit">
                                <Pencil className="size-4" />
                              </Button>
                            </Link>
                          </Can>
                          <Can permission={P.PRODUCTS_DELETE}>
                            <Button
                              variant="dangerGhost"
                              size="icon"
                              aria-label="Delete"
                              onClick={() => setPendingDelete(product)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </Can>
                        </div>
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => removeMutation.mutate(pendingDelete.id)}
        loading={removeMutation.isPending}
        title={`"${pendingDelete?.name}" delete karein?`}
        description="Jis product par order lag chuka hai wo delete nahi hota — use archive karein."
      />
    </>
  )
}

function ProductThumb({ product }) {
  if (!product.imageUrl) {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
        <Package className="size-4" />
      </span>
    )
  }
  return (
    <img
      src={product.imageUrl}
      alt=""
      loading="lazy"
      className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
    />
  )
}
