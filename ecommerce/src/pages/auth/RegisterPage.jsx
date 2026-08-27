import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { FormInput } from '@/components/ui/Field'
import { applyServerErrors } from '@/lib/formErrors'
import { AuthShell } from './AuthShell'

/**
 * Yehi rules backend par bhi lagane hain. Frontend validation sirf achhe UX
 * ke liye hai — koi bhi Postman se seedha API hit kar sakta hai.
 */
const schema = z
  .object({
    firstName: z.string().min(2, 'Kam se kam 2 characters.').max(50),
    lastName: z.string().min(2, 'Kam se kam 2 characters.').max(50),
    email: z.string().min(1, 'Email required hai.').email('Valid email likhein.'),
    phone: z
      .string()
      .optional()
      .refine((value) => !value || /^[\d\s+()-]{7,20}$/.test(value), 'Phone number theek nahi hai.'),
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

export function RegisterPage() {
  const { register: signUp } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await signUp(values)
      toast.success('Account ban gaya! Ab shopping shuru karein.')
      navigate('/', { replace: true })
    } catch (error) {
      applyServerErrors(error, setError)
    }
  }

  return (
    <AuthShell
      title="Account banayein"
      subtitle="Sign up karne par aapko Customer role milta hai."
      footer={
        <>
          Pehle se account hai?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in karein
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="First name"
            required
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <FormInput
            label="Last name"
            required
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <FormInput
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <FormInput
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="+92 300 1234567"
          hint="Optional"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <FormInput
          label="Password"
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
          Account banayein
        </Button>
      </form>
    </AuthShell>
  )
}
