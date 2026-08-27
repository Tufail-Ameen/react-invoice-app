import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Truck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'
import { storefrontApi } from '@/api/endpoints'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/Card'
import { FormInput } from '@/components/ui/Field'
import { useCart } from '@/store/CartContext'
import { applyServerErrors } from '@/lib/formErrors'
import { cn, formatMoney } from '@/lib/utils'

const schema = z.object({
  line1: z.string().min(5, 'Poora address likhein.').max(120),
  city: z.string().min(2, 'City required hai.').max(60),
  postalCode: z.string().regex(/^\d{5}$/, 'Postal code 5 digits ka hona chahiye.'),
  country: z.string().min(2, 'Country required hai.').max(60),
  paymentMethod: z.enum(['card', 'cash_on_delivery']),
})

export function CheckoutPage() {
  const { user } = useAuth()
  const { items, subtotal, isEmpty, clear } = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      line1: '',
      city: '',
      postalCode: '',
      country: 'Pakistan',
      paymentMethod: 'cash_on_delivery',
    },
  })

  const paymentMethod = watch('paymentMethod')

  const mutation = useMutation({
    mutationFn: ({ paymentMethod: method, ...address }) =>
      storefrontApi.checkout({
        // Server ko sirf ID aur quantity bhejte hain — qeemat wo khud nikalega.
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        shippingAddress: address,
        paymentMethod: method,
      }),
    onSuccess: (result) => {
      clear()
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['storefront-products'] })
      toast.success(`Order ${result.order.orderNumber} lag gaya!`)
      navigate(`/account/orders/${result.order.id}`, { replace: true })
    },
    onError: (error) => {
      // Server field errors "shippingAddress.city" bhejta hai, form field "city" hai.
      const normalized = {
        ...error,
        fieldErrors: Object.fromEntries(
          Object.entries(error.fieldErrors ?? {}).map(([field, message]) => [
            field.replace('shippingAddress.', ''),
            message,
          ])
        ),
        message: error.message,
      }
      applyServerErrors(normalized, setError)
    },
  })

  if (isEmpty) return <Navigate to="/cart" replace />

  const tax = Math.round(subtotal * 0.17)
  const shipping = subtotal >= 10_000 ? 0 : 350
  const total = subtotal + tax + shipping

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader title="Checkout" description={`${user?.email} ke tor par order kar rahe hain.`} />

      <form onSubmit={handleSubmit((values) => mutation.mutateAsync(values))} noValidate>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Shipping address" />
              <CardBody className="space-y-4">
                <FormInput
                  label="Street address"
                  required
                  placeholder="House 12, Block A, Gulberg III"
                  error={errors.line1?.message}
                  {...register('line1')}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormInput
                    label="City"
                    required
                    placeholder="Lahore"
                    error={errors.city?.message}
                    {...register('city')}
                  />
                  <FormInput
                    label="Postal code"
                    required
                    placeholder="54000"
                    error={errors.postalCode?.message}
                    {...register('postalCode')}
                  />
                  <FormInput
                    label="Country"
                    required
                    error={errors.country?.message}
                    {...register('country')}
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Payment method" />
              <CardBody className="grid gap-3 sm:grid-cols-2">
                <PaymentOption
                  value="cash_on_delivery"
                  selected={paymentMethod === 'cash_on_delivery'}
                  icon={Truck}
                  title="Cash on delivery"
                  description="Product milne par payment."
                  register={register}
                />
                <PaymentOption
                  value="card"
                  selected={paymentMethod === 'card'}
                  icon={CreditCard}
                  title="Card"
                  description="Abhi pay karein (demo — koi asli charge nahi)."
                  register={register}
                />
              </CardBody>
            </Card>
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <CardHeader title="Order summary" description={`${items.length} products`} />
            <CardBody className="space-y-4">
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {formatMoney(item.price)}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums text-slate-800">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="tabular-nums">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax (17%)</span>
                  <span className="tabular-nums">{formatMoney(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span className={shipping === 0 ? 'text-emerald-600' : 'tabular-nums'}>
                    {shipping === 0 ? 'Free' : formatMoney(shipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(total)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Order place karein
              </Button>

              <p className="text-center text-[11px] leading-relaxed text-slate-400">
                Server stock dobara check karta hai, totals khud calculate karta hai aur stock
                kam karta hai — sab ek transaction mein.
              </p>
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  )
}

function PaymentOption({ value, selected, icon: Icon, title, description, register }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors',
        selected ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500' : 'border-slate-200 hover:bg-slate-50'
      )}
    >
      <input type="radio" value={value} className="sr-only" {...register('paymentMethod')} />
      <Icon className={cn('mt-0.5 size-5 shrink-0', selected ? 'text-brand-600' : 'text-slate-400')} />
      <span>
        <span className="block text-sm font-medium text-slate-900">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
    </label>
  )
}
