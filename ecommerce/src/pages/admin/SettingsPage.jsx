import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { queryKeys, settingsApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { Checkbox, FormInput } from '@/components/ui/Field'
import { FullPageLoader } from '@/components/ui/Loaders'
import { applyServerErrors } from '@/lib/formErrors'
import { numberField } from '@/lib/zodHelpers'

const schema = z.object({
  storeName: z.string().min(2, 'Kam se kam 2 characters.').max(60),
  supportEmail: z.string().email('Valid email likhein.'),
  currency: z.string().length(3, '3-letter code, jaise PKR.'),
  taxRate: z.preprocess(
    (value) => (value === '' ? undefined : Number(value)),
    z.number({ invalid_type_error: 'Sirf number likhein.' }).min(0, '0 se kam nahi.').max(100, '100 se zyada nahi.')
  ),
  freeShippingThreshold: numberField({ integer: true, label: 'Free shipping threshold' }),
  lowStockAlerts: z.boolean(),
})

export function SettingsPage() {
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (data?.settings) reset(data.settings)
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (result) => {
      toast.success('Settings save ho gayin.')
      reset(result.settings)
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
    onError: (mutationError) => applyServerErrors(mutationError, setError),
  })

  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (isPending) return <FullPageLoader label="Settings load ho rahi hain…" />

  return (
    <>
      <PageHeader title="Settings" description="Store-wide configuration." />

      <div className="grid max-w-3xl gap-6">
        <form onSubmit={handleSubmit((values) => mutation.mutateAsync(values))} noValidate>
          <Card>
            <CardHeader
              title="Store"
              description="Ye values checkout par totals calculate karne mein istemal hoti hain."
            />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Store name"
                  required
                  error={errors.storeName?.message}
                  {...register('storeName')}
                />
                <FormInput
                  label="Support email"
                  type="email"
                  required
                  error={errors.supportEmail?.message}
                  {...register('supportEmail')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormInput
                  label="Currency"
                  required
                  placeholder="PKR"
                  error={errors.currency?.message}
                  {...register('currency')}
                />
                <FormInput
                  label="Tax rate (%)"
                  type="number"
                  step="0.01"
                  required
                  error={errors.taxRate?.message}
                  {...register('taxRate')}
                />
                <FormInput
                  label="Free shipping over"
                  type="number"
                  step="1"
                  error={errors.freeShippingThreshold?.message}
                  {...register('freeShippingThreshold')}
                />
              </div>

              <Checkbox label="Low stock alerts on karein" {...register('lowStockAlerts')} />
            </CardBody>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => reset(data.settings)}
                disabled={!isDirty}
              >
                Reset
              </Button>
              <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                Save settings
              </Button>
            </div>
          </Card>
        </form>

      </div>
    </>
  )
}
