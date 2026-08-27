import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Package } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'
import { categoriesApi, productsApi, queryKeys } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/Field'
import { FullPageLoader } from '@/components/ui/Loaders'
import { applyServerErrors } from '@/lib/formErrors'
import { formatMoney } from '@/lib/utils'
import { numberField, positiveMoney } from '@/lib/zodHelpers'

const schema = z.object({
  name: z.string().min(3, 'Kam se kam 3 characters.').max(120),
  sku: z.string().min(2, 'SKU required hai.').max(40),
  categoryId: z.string().min(1, 'Category chunein.'),
  description: z.string().max(2000).optional().or(z.literal('')),
  price: positiveMoney('Price'),
  compareAtPrice: numberField({ required: false, label: 'Compare-at price' }),
  cost: numberField({ required: false, label: 'Cost' }),
  stock: numberField({ integer: true, label: 'Stock' }),
  lowStockThreshold: numberField({ integer: true, label: 'Threshold' }),
  status: z.enum(['draft', 'active', 'archived']),
  imageUrl: z.string().url('Valid URL likhein.').optional().or(z.literal('')),
})

const EMPTY = {
  name: '',
  sku: '',
  categoryId: '',
  description: '',
  price: '',
  compareAtPrice: '',
  cost: '',
  stock: 0,
  lowStockThreshold: 10,
  status: 'draft',
  imageUrl: '',
}

export function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: categoryData } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.list,
  })

  const {
    data: productData,
    isPending: isLoadingProduct,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => productsApi.detail(id),
    enabled: isEdit,
  })

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setError,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (!productData?.product) return
    const product = productData.product
    resetForm({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      description: product.description ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? '',
      cost: product.cost ?? '',
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      status: product.status,
      imageUrl: product.imageUrl ?? '',
    })
  }, [productData, resetForm])

  const mutation = useMutation({
    mutationFn: (values) => (isEdit ? productsApi.update({ id, ...values }) : productsApi.create(values)),
    onSuccess: () => {
      toast.success(isEdit ? 'Product update ho gaya.' : 'Product ban gaya.')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      navigate('/admin/products')
    },
    onError: (error) => applyServerErrors(error, setError),
  })

  const price = Number(watch('price')) || 0
  const cost = Number(watch('cost')) || 0
  const imageUrl = watch('imageUrl')
  const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null

  if (isEdit && loadError) return <ErrorState error={loadError} onRetry={refetch} />
  if (isEdit && isLoadingProduct) return <FullPageLoader label="Product load ho raha hai…" />

  const onSubmit = (values) =>
    mutation.mutateAsync({
      ...values,
      compareAtPrice: values.compareAtPrice ?? null,
      cost: values.cost ?? null,
      imageUrl: values.imageUrl || null,
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader
        breadcrumb={
          <Link
            to="/admin/products"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="size-4" />
            Products
          </Link>
        }
        title={isEdit ? 'Product edit karein' : 'Naya product'}
        description={isEdit ? productData?.product.name : 'Catalog mein naya item shamil karein.'}
        actions={
          <>
            <Link to="/admin/products">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={isSubmitting} disabled={isEdit && !isDirty}>
              {isEdit ? 'Changes save karein' : 'Product banayein'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Basic details" />
            <CardBody className="space-y-4">
              <FormInput
                label="Product name"
                required
                placeholder="Vitamin C Brightening Serum"
                error={errors.name?.message}
                {...register('name')}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="SKU"
                  required
                  placeholder="NX-0001"
                  hint="Har product ka unique code."
                  error={errors.sku?.message}
                  {...register('sku')}
                />
                <FormSelect
                  label="Category"
                  required
                  error={errors.categoryId?.message}
                  {...register('categoryId')}
                >
                  <option value="">Category chunein…</option>
                  {categoryData?.items.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <FormTextarea
                label="Description"
                placeholder="Product ki tafseel…"
                error={errors.description?.message}
                {...register('description')}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Pricing" description="Sab qeematein PKR mein." />
            <CardBody className="grid gap-4 sm:grid-cols-3">
              <FormInput
                label="Selling price"
                type="number"
                step="1"
                required
                error={errors.price?.message}
                {...register('price')}
              />
              <FormInput
                label="Compare-at price"
                type="number"
                step="1"
                hint="Discount dikhane ke liye."
                error={errors.compareAtPrice?.message}
                {...register('compareAtPrice')}
              />
              <FormInput
                label="Cost per item"
                type="number"
                step="1"
                hint={margin !== null ? `Margin: ${margin}%` : 'Profit calculate karne ke liye.'}
                error={errors.cost?.message}
                {...register('cost')}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Inventory" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Stock quantity"
                type="number"
                step="1"
                required
                error={errors.stock?.message}
                {...register('stock')}
              />
              <FormInput
                label="Low stock threshold"
                type="number"
                step="1"
                hint="Is se neeche jaane par alert."
                error={errors.lowStockThreshold?.message}
                {...register('lowStockThreshold')}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Visibility" />
            <CardBody>
              <FormSelect label="Status" error={errors.status?.message} {...register('status')}>
                <option value="draft">Draft — storefront par nahi</option>
                <option value="active">Active — bikri ke liye</option>
                <option value="archived">Archived — chhupa hua</option>
              </FormSelect>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Image" description="Abhi URL. Baad mein upload endpoint banayein." />
            <CardBody className="space-y-3">
              <div className="grid aspect-square place-items-center overflow-hidden rounded-lg bg-slate-100">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Package className="size-8 text-slate-300" />
                )}
              </div>
              <FormInput
                label="Image URL"
                placeholder="https://…"
                error={errors.imageUrl?.message}
                {...register('imageUrl')}
              />
            </CardBody>
          </Card>

          <Card className="border-brand-200 bg-brand-50/50">
            <CardBody className="text-xs leading-relaxed text-brand-900">
              <p className="font-semibold">Backend note</p>
              <p className="mt-1.5">
                Ye form <code className="font-mono">POST /products</code> aur{' '}
                <code className="font-mono">PATCH /products/:id</code> hit karta hai. Yehi
                validation rules server par bhi lagayein — SKU uniqueness ka check DB level par
                unique index se karein.
              </p>
              {price > 0 && (
                <p className="mt-2">
                  Preview: {formatMoney(price)}
                  {cost > 0 && ` · cost ${formatMoney(cost)}`}
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </form>
  )
}
