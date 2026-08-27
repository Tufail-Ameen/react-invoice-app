import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import * as z from 'zod'
import { authApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { FormInput } from '@/components/ui/Field'
import { applyServerErrors } from '@/lib/formErrors'
import { AuthShell } from './AuthShell'

const schema = z.object({
  email: z.string().min(1, 'Email required hai.').email('Valid email likhein.'),
})

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = async (values) => {
    try {
      const result = await authApi.forgotPassword(values)
      setSent({ email: values.email, devToken: result.devToken })
    } catch (error) {
      applyServerErrors(error, setError)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Email bhej diya"
        subtitle="Agar ye email registered hai to reset link pohanch chuka hoga."
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <MailCheck className="size-5 text-emerald-600" />
          <p className="mt-2 text-sm text-emerald-900">
            <span className="font-medium">{sent.email}</span> par instructions bhej diye gaye hain.
            Link 30 minute mein expire ho jayega.
          </p>
        </div>

        {sent.devToken && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Dev only
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Mock backend email nahi bhej sakta, is liye token yahan dikha diya. Asli backend
              mein ye sirf email mein jana chahiye.
            </p>
            <Link
              to={`/reset-password?token=${sent.devToken}`}
              className="mt-3 inline-block break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
            >
              /reset-password?token={sent.devToken}
            </Link>
          </div>
        )}

        <Link to="/login" className="mt-6 block text-center text-sm text-brand-600 hover:text-brand-700">
          Login par wapas jayein
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Password bhool gaye?"
      subtitle="Apna email dein, hum reset link bhej denge."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Login par wapas jayein
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormInput
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          Reset link bhejein
        </Button>
      </form>
    </AuthShell>
  )
}
