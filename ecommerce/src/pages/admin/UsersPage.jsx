import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { queryKeys, rolesApi, usersApi } from '@/api/endpoints'
import { Can } from '@/auth/guards'
import { useAuth } from '@/auth/useAuth'
import { Avatar } from '@/components/layout/UserMenu'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { FormInput, FormSelect, Select } from '@/components/ui/Field'
import { TableSkeleton } from '@/components/ui/Loaders'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination, SortableTH, TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { useListParams } from '@/hooks/useListParams'
import { applyServerErrors } from '@/lib/formErrors'
import { PERMISSIONS as P } from '@/lib/permissions'
import { formatRelative } from '@/lib/utils'

const baseSchema = {
  firstName: z.string().min(2, 'Kam se kam 2 characters.').max(50),
  lastName: z.string().min(2, 'Kam se kam 2 characters.').max(50),
  email: z.string().min(1, 'Email required hai.').email('Valid email likhein.'),
  phone: z.string().optional().or(z.literal('')),
  roleId: z.string().min(1, 'Role chunein.'),
  status: z.enum(['active', 'suspended']),
}

const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(8, 'Kam se kam 8 characters.'),
})

const editSchema = z.object({
  ...baseSchema,
  password: z.string().optional().or(z.literal('')).refine(
    (value) => !value || value.length >= 8,
    'Kam se kam 8 characters.'
  ),
})

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  roleId: '',
  status: 'active',
  password: '',
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const { params, setParams, setPage, setSearch, setSort, reset, activeFilterCount } =
    useListParams({ sort: '-createdAt' })
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => usersApi.list(params),
    placeholderData: (previous) => previous,
  })

  const { data: roleData } = useQuery({ queryKey: queryKeys.roles, queryFn: rolesApi.list })

  const isEdit = Boolean(editing?.id)

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(isEdit ? editSchema : createSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (editing === null) return
    resetForm(
      editing.id
        ? {
            firstName: editing.firstName,
            lastName: editing.lastName,
            email: editing.email,
            phone: editing.phone ?? '',
            roleId: editing.role?.id ?? '',
            status: editing.status === 'suspended' ? 'suspended' : 'active',
            password: '',
          }
        : EMPTY
    )
  }, [editing, resetForm])

  const saveMutation = useMutation({
    mutationFn: (values) => {
      const payload = { ...values }
      if (isEdit && !payload.password) delete payload.password
      return isEdit ? usersApi.update({ id: editing.id, ...payload }) : usersApi.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'User update ho gaya.' : 'User ban gaya.')
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.roles })
    },
    onError: (mutationError) => applyServerErrors(mutationError, setError),
  })

  const removeMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      toast.success('User delete ho gaya.')
      setPendingDelete(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  return (
    <>
      <PageHeader
        title="Users"
        description="Team ke accounts aur unke roles."
        actions={
          <Can permission={P.USERS_CREATE}>
            <Button onClick={() => setEditing({})}>
              <Plus className="size-4" />
              User add karein
            </Button>
          </Can>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput
            value={params.search ?? ''}
            onChange={setSearch}
            placeholder="Naam ya email…"
            className="min-w-48 flex-1"
          />
          <Select
            value={params.role_id ?? ''}
            onChange={(event) => setParams({ role_id: event.target.value })}
            className="w-auto min-w-40"
          >
            <option value="">Sab roles</option>
            {roleData?.items.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
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
            <option value="suspended">Suspended</option>
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
          <TableSkeleton columns={5} />
        ) : data.items.length === 0 ? (
          <EmptyState icon={Users} title="Koi user nahi mila" />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <SortableTH field="firstName" sort={params.sort} onSort={setSort}>
                      User
                    </SortableTH>
                    <TH>Role</TH>
                    <TH align="right">Permissions</TH>
                    <TH>Status</TH>
                    <TH>Last login</TH>
                    <TH align="right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.items.map((user) => (
                    <TR key={user.id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={user.fullName} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 truncate font-medium text-slate-900">
                              {user.fullName}
                              {user.id === currentUser?.id && (
                                <Badge tone="brand" className="text-[10px]">
                                  Aap
                                </Badge>
                              )}
                            </p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone={user.role?.slug === 'super_admin' ? 'brand' : 'neutral'}>
                          {user.role?.name ?? '—'}
                        </Badge>
                      </TD>
                      <TD align="right" className="tabular-nums text-slate-600">
                        {user.permissions.includes('*') ? 'All' : user.permissions.length}
                      </TD>
                      <TD>
                        <StatusBadge status={user.status} />
                      </TD>
                      <TD className="whitespace-nowrap text-xs text-slate-500">
                        {user.lastLoginAt ? formatRelative(user.lastLoginAt) : 'Kabhi nahi'}
                      </TD>
                      <TD align="right">
                        <div className="flex justify-end gap-1">
                          <Can permission={P.USERS_UPDATE}>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Edit"
                              onClick={() => setEditing(user)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </Can>
                          <Can permission={P.USERS_DELETE}>
                            <Button
                              variant="dangerGhost"
                              size="icon"
                              aria-label="Delete"
                              disabled={user.id === currentUser?.id}
                              onClick={() => setPendingDelete(user)}
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

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isEdit ? 'User edit karein' : 'Naya user'}
        description="Role change karte hi us user ki permissions badal jayengi."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit((values) => saveMutation.mutateAsync(values))}
              loading={isSubmitting}
            >
              Save
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleSubmit((values) => saveMutation.mutateAsync(values))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="First name"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <FormInput
              label="Last name"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <FormInput
            label="Email"
            type="email"
            required
            disabled={isEdit}
            hint={isEdit ? 'Email badla nahi ja sakta.' : undefined}
            error={errors.email?.message}
            {...register('email')}
          />

          <FormInput
            label="Phone"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect label="Role" required error={errors.roleId?.message} {...register('roleId')}>
              <option value="">Role chunein…</option>
              {roleData?.items.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </FormSelect>
            <FormSelect label="Status" error={errors.status?.message} {...register('status')}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </FormSelect>
          </div>

          <FormInput
            label={isEdit ? 'Naya password' : 'Password'}
            type="password"
            required={!isEdit}
            autoComplete="new-password"
            hint={isEdit ? 'Khali chhorein agar badalna nahi hai.' : 'Kam se kam 8 characters.'}
            error={errors.password?.message}
            {...register('password')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => removeMutation.mutate(pendingDelete.id)}
        loading={removeMutation.isPending}
        title={`"${pendingDelete?.fullName}" delete karein?`}
      />
    </>
  )
}
