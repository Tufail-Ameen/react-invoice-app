import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Checkbox, FormInput } from '@/components/ui/Field'
import { useAuth } from '@/auth/useAuth'
import { applyServerErrors } from '@/lib/formErrors'
import { AuthShell } from './AuthShell'

const schema = z.object({
  email: z.string().min(1, 'Email required hai.').email('Valid email likhein.'),
  password: z.string().min(1, 'Password required hai.'),
})

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'owner@nexa.test', note: 'Sab kuch' },
  { label: 'Admin', email: 'admin@nexa.test', note: 'Roles/settings ke ilawa sab' },
  { label: 'Store Manager', email: 'manager@nexa.test', note: 'Catalog, orders, stock' },
  { label: 'Support Staff', email: 'staff@nexa.test', note: 'Sirf view + order status' },
  { label: 'Customer', email: 'customer@nexa.test', note: 'Sirf storefront' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values) => {
    try {
      const user = await login(values)
      toast.success(`Khush aamdeed, ${user.firstName}!`)
      const fallback = user.permissions?.length ? '/admin' : '/'
      navigate(location.state?.from?.pathname ?? fallback, { replace: true })
    } catch (error) {
      applyServerErrors(error, setError)
    }
  }

  const fillDemo = (email) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', 'Password123!', { shouldValidate: true })
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Apne account mein dakhil hon."
      footer={
        <>
          Account nahi hai?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Sign up karein
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Bhool gaye?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password) || undefined}
              className={`focus-ring h-10 w-full rounded-lg border bg-white px-3 pr-10 text-sm placeholder:text-slate-400 ${
                errors.password ? 'border-rose-300' : 'border-slate-200'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="focus-ring absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-rose-600">{errors.password.message}</p>
          )}
        </div>

        <Checkbox label="Mujhe yaad rakhein" defaultChecked />

        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          Log in
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Demo accounts — password: Password123!
        </p>
        <ul className="mt-3 space-y-1">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => fillDemo(account.email)}
                className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white"
              >
                <span className="text-sm font-medium text-slate-700">{account.label}</span>
                <span className="text-[11px] text-slate-400">{account.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AuthShell>
  )
}
