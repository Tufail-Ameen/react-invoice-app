import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'
import { authApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { FormInput } from '@/components/ui/Field'
import { applyServerErrors } from '@/lib/formErrors'
import { AuthShell } from './AuthShell'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Kam se kam 8 characters.')
      .regex(/[A-Z]/, 'Ek capital letter zaroori hai.')
      .regex(/[0-9]/, 'Ek number zaroori hai.'),
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'Passwords match nahi kar rahe.',
    path: ['passwordConfirmation'],
  })

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', passwordConfirmation: '' },
  })

  const onSubmit = async (values) => {
    try {
      await authApi.resetPassword({ token, ...values })
      toast.success('Password badal gaya. Ab naye password se login karein.')
      navigate('/login', { replace: true })
    } catch (error) {
      applyServerErrors(error, setError)
    }
  }

  if (!token) {
    return (
      <AuthShell title="Link theek nahi" subtitle="Is reset link mein token nahi hai.">
        <Link to="/forgot-password">
          <Button className="w-full" size="lg">
            Naya reset link mangwayein
          </Button>
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Naya password rakhein"
      subtitle="Password badalne par baqi tamam devices se logout ho jayenge."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Login par wapas jayein
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormInput
          label="Naya password"
          type="password"
          required
          autoComplete="new-password"
          hint="8+ characters, ek capital letter aur ek number."
          error={errors.password?.message}
          {...register('password')}
        />
        <FormInput
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          Password reset karein
        </Button>
      </form>
    </AuthShell>
  )
}
