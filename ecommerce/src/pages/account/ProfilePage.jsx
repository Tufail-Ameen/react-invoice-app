import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { authApi } from '@/api/endpoints'
import { useAuth } from '@/auth/useAuth'
import { Avatar } from '@/components/layout/UserMenu'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/Card'
import { FormInput } from '@/components/ui/Field'
import { applyServerErrors } from '@/lib/formErrors'
import { tokenStore } from '@/lib/tokenStore'
import { PERMISSION_LABELS } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'

const profileSchema = z.object({
  firstName: z.string().min(2, 'Kam se kam 2 characters.').max(50),
  lastName: z.string().min(2, 'Kam se kam 2 characters.').max(50),
  phone: z.string().optional().or(z.literal('')),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password likhein.'),
    newPassword: z
      .string()
      .min(8, 'Kam se kam 8 characters.')
      .regex(/[A-Z]/, 'Ek capital letter zaroori hai.')
      .regex(/[0-9]/, 'Ek number zaroori hai.'),
    newPasswordConfirmation: z.string(),
  })
  .refine((values) => values.newPassword === values.newPasswordConfirmation, {
    message: 'Passwords match nahi kar rahe.',
    path: ['newPasswordConfirmation'],
  })

export function ProfilePage() {
  const { user, setUser } = useAuth()

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', newPasswordConfirmation: '' },
  })

  const profileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (result) => {
      setUser(result.user)
      profileForm.reset({
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        phone: result.user.phone ?? '',
      })
      toast.success('Profile update ho gayi.')
    },
    onError: (error) => applyServerErrors(error, profileForm.setError),
  })

  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      authApi.changePassword({ currentPassword, newPassword }),
    onSuccess: (result) => {
      tokenStore.set(result.tokens)
      passwordForm.reset()
      toast.success('Password badal gaya. Baqi devices se logout kar diya gaya.')
    },
    onError: (error) => applyServerErrors(error, passwordForm.setError),
  })

  if (!user) return null

  const permissions = user.permissions ?? []
  const isWildcard = permissions.includes('*')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader title="Profile" description="Apni details aur password manage karein." />

      <div className="space-y-6">
        <Card>
          <CardBody className="flex flex-wrap items-center gap-4">
            <Avatar name={user.fullName} className="size-14 text-base" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-slate-900">{user.fullName}</p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="text-right">
              <Badge tone="brand">{user.role?.name ?? 'Customer'}</Badge>
              <p className="mt-1 text-xs text-slate-400">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </CardBody>
        </Card>

        <form
          onSubmit={profileForm.handleSubmit((values) => profileMutation.mutateAsync(values))}
          noValidate
        >
          <Card>
            <CardHeader title="Personal details" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="First name"
                  required
                  error={profileForm.formState.errors.firstName?.message}
                  {...profileForm.register('firstName')}
                />
                <FormInput
                  label="Last name"
                  required
                  error={profileForm.formState.errors.lastName?.message}
                  {...profileForm.register('lastName')}
                />
              </div>
              <FormInput
                label="Email"
                value={user.email}
                disabled
                hint="Email badalne ke liye admin se rabta karein."
                readOnly
              />
              <FormInput
                label="Phone"
                type="tel"
                error={profileForm.formState.errors.phone?.message}
                {...profileForm.register('phone')}
              />
            </CardBody>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <Button
                type="submit"
                loading={profileForm.formState.isSubmitting}
                disabled={!profileForm.formState.isDirty}
              >
                Save changes
              </Button>
            </div>
          </Card>
        </form>

        <form
          onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutateAsync(values))}
          noValidate
        >
          <Card>
            <CardHeader
              title="Password"
              description="Badalne par tamam doosre devices se logout ho jayenge."
            />
            <CardBody className="space-y-4">
              <FormInput
                label="Current password"
                type="password"
                required
                autoComplete="current-password"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword')}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="New password"
                  type="password"
                  required
                  autoComplete="new-password"
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />
                <FormInput
                  label="Confirm new password"
                  type="password"
                  required
                  autoComplete="new-password"
                  error={passwordForm.formState.errors.newPasswordConfirmation?.message}
                  {...passwordForm.register('newPasswordConfirmation')}
                />
              </div>
            </CardBody>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                Password badlein
              </Button>
            </div>
          </Card>
        </form>

        <Card>
          <CardHeader
            title="Your permissions"
            description="Aapke role se aane wali permissions — backend har request par yehi check karta hai."
          />
          <CardBody>
            {isWildcard ? (
              <p className="text-sm text-slate-600">
                Aapke paas wildcard <code className="font-mono text-brand-600">*</code> hai — har
                permission mojood hai.
              </p>
            ) : permissions.length === 0 ? (
              <p className="text-sm text-slate-600">
                Koi admin permission nahi. Aap sirf storefront istemal kar sakte hain.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((permission) => (
                  <Badge key={permission} tone="neutral" title={PERMISSION_LABELS[permission]}>
                    <code className="font-mono text-[11px]">{permission}</code>
                  </Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
