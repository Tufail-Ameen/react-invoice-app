import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'
import { customersApi, queryKeys } from '@/api/endpoints'
import { Can } from '@/auth/guards'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { FormInput, FormSelect, FormTextarea, Select } from '@/components/ui/Field'
import { TableSkeleton } from '@/components/ui/Loaders'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination, SortableTH, TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { Avatar } from '@/components/layout/UserMenu'
import { useListParams } from '@/hooks/useListParams'
import { applyServerErrors } from '@/lib/formErrors'
import { PERMISSIONS as P } from '@/lib/permissions'
import { formatDate, formatMoney } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(2, 'Kam se kam 2 characters.').max(50),
  lastName: z.string().min(2, 'Kam se kam 2 characters.').max(50),
  email: z.string().min(1, 'Email required hai.').email('Valid email likhein.'),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || /^[\d\s+()-]{7,20}$/.test(value), 'Phone number theek nahi hai.'),
  company: z.string().max(80).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
  notes: z.string().max(500).optional().or(z.literal('')),
  address: z.object({
    line1: z.string().max(120).optional().or(z.literal('')),
    city: z.string().max(60).optional().or(z.literal('')),
    postalCode: z
      .string()
      .optional()
      .refine((value) => !value || /^\d{5}$/.test(value), 'Postal code 5 digits ka hona chahiye.'),
    country: z.string().max(60).optional().or(z.literal('')),
  }),
})

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  status: 'active',
  notes: '',
  address: { line1: '', city: '', postalCode: '', country: 'Pakistan' },
}

export function CustomersPage() {
  const queryClient = useQueryClient()
  const { params, setParams, setPage, setSearch, setSort, reset, activeFilterCount } =
    useListParams({ sort: '-createdAt' })
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.customers(params),
    queryFn: () => customersApi.list(params),
    placeholderData: (previous) => previous,
  })

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (editing === null) return
    resetForm(editing.id ? { ...EMPTY, ...editing, address: { ...EMPTY.address, ...editing.address } } : EMPTY)
  }, [editing, resetForm])

  const saveMutation = useMutation({
    mutationFn: (values) =>
      editing?.id ? customersApi.update({ id: editing.id, ...values }) : customersApi.create(values),
    onSuccess: () => {
      toast.success(editing?.id ? 'Customer update ho gaya.' : 'Customer add ho gaya.')
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
    onError: (mutationError) => applyServerErrors(mutationError, setError),
  })

  const removeMutation = useMutation({
    mutationFn: customersApi.remove,
    onSuccess: () => {
      toast.success('Customer delete ho gaya.')
      setPendingDelete(null)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  return (
    <>
      <PageHeader
        title="Customers"
        description="Add kiya hua customer foran is list mein aa jata hai."
        actions={
          <Can permission={P.CUSTOMERS_CREATE}>
            <Button onClick={() => setEditing({})}>
              <Plus className="size-4" />
              Naya customer
            </Button>
          </Can>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput
            value={params.search ?? ''}
            onChange={setSearch}
            placeholder="Naam, email, phone ya company…"
            className="min-w-56 flex-1"
          />
          <Select
            value={params.status ?? ''}
            onChange={(event) => setParams({ status: event.target.value })}
            className="w-auto min-w-32"
          >
            <option value="">Sab status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
          <TableSkeleton columns={6} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Koi customer nahi mila"
            description={
              activeFilterCount > 0
                ? 'Filters badal kar dekhein.'
                : 'Pehla customer add karein — wo foran yahan nazar aa jayega.'
            }
            action={
              <Can permission={P.CUSTOMERS_CREATE}>
                <Button onClick={() => setEditing({})}>Naya customer</Button>
              </Can>
            }
          />
        ) : (
          <>
            <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <SortableTH field="firstName" sort={params.sort} onSort={setSort}>
                      Customer
                    </SortableTH>
                    <TH>Contact</TH>
                    <TH>Company</TH>
                    <TH align="right">Orders</TH>
                    <TH align="right">Total spent</TH>
                    <TH>Status</TH>
                    <SortableTH field="createdAt" sort={params.sort} onSort={setSort}>
                      Added
                    </SortableTH>
                    <TH align="right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.items.map((customer) => (
                    <TR key={customer.id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={customer.fullName} />
                          <div className="min-w-0">
                            <Link
                              to={`/admin/customers/${customer.id}`}
                              className="truncate font-medium text-slate-900 hover:text-brand-600"
                            >
                              {customer.fullName}
                            </Link>
                            <p className="truncate text-xs text-slate-500">
                              {customer.address?.city || '—'}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <p className="truncate text-slate-700">{customer.email}</p>
                        <p className="text-xs text-slate-500">{customer.phone || '—'}</p>
                      </TD>
                      <TD className="text-slate-600">{customer.company || '—'}</TD>
                      <TD align="right" className="tabular-nums">
                        {customer.ordersCount}
                      </TD>
                      <TD align="right" className="font-medium tabular-nums text-slate-900">
                        {formatMoney(customer.totalSpent)}
                      </TD>
                      <TD>
                        <StatusBadge status={customer.status} />
                      </TD>
                      <TD className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(customer.createdAt)}
                      </TD>
                      <TD align="right">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" aria-label="View">
                              <Eye className="size-4" />
                            </Button>
                          </Link>
                          <Can permission={P.CUSTOMERS_UPDATE}>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Edit"
                              onClick={() => setEditing(customer)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </Can>
                          <Can permission={P.CUSTOMERS_DELETE}>
                            <Button
                              variant="dangerGhost"
                              size="icon"
                              aria-label="Delete"
                              onClick={() => setPendingDelete(customer)}
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
        size="lg"
        title={editing?.id ? 'Customer edit karein' : 'Naya customer'}
        description="Ye form POST /customers par jata hai."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit((values) => saveMutation.mutateAsync(values))}
              loading={isSubmitting}
            >
              {editing?.id ? 'Save changes' : 'Customer add karein'}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Email"
              type="email"
              required
              placeholder="client@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <FormInput
              label="Phone"
              type="tel"
              placeholder="+92 300 1234567"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Company"
              placeholder="Tufail Traders"
              error={errors.company?.message}
              {...register('company')}
            />
            <FormSelect label="Status" error={errors.status?.message} {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Address
            </p>
            <div className="space-y-4">
              <FormInput
                label="Street address"
                placeholder="House 12, Block A"
                error={errors.address?.line1?.message}
                {...register('address.line1')}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormInput
                  label="City"
                  error={errors.address?.city?.message}
                  {...register('address.city')}
                />
                <FormInput
                  label="Postal code"
                  placeholder="54000"
                  error={errors.address?.postalCode?.message}
                  {...register('address.postalCode')}
                />
                <FormInput
                  label="Country"
                  error={errors.address?.country?.message}
                  {...register('address.country')}
                />
              </div>
            </div>
          </div>

          <FormTextarea
            label="Internal notes"
            rows={3}
            placeholder="Sirf team ke liye…"
            error={errors.notes?.message}
            {...register('notes')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => removeMutation.mutate(pendingDelete.id)}
        loading={removeMutation.isPending}
        title={`"${pendingDelete?.fullName}" delete karein?`}
        description="Jis customer ke orders hain wo delete nahi hota."
      />
    </>
  )
}
