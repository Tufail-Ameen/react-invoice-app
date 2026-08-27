import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { categoriesApi, queryKeys } from '@/api/endpoints'
import { Can } from '@/auth/guards'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { FormInput, FormTextarea } from '@/components/ui/Field'
import { TableSkeleton } from '@/components/ui/Loaders'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/Table'
import { applyServerErrors } from '@/lib/formErrors'
import { PERMISSIONS as P } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Kam se kam 2 characters.').max(60),
  description: z.string().max(200).optional().or(z.literal('')),
})

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.list,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', description: '' } })

  useEffect(() => {
    if (editing === null) return
    reset({ name: editing.name ?? '', description: editing.description ?? '' })
  }, [editing, reset])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const saveMutation = useMutation({
    mutationFn: (values) =>
      editing?.id ? categoriesApi.update({ id: editing.id, ...values }) : categoriesApi.create(values),
    onSuccess: () => {
      toast.success(editing?.id ? 'Category update ho gayi.' : 'Category ban gayi.')
      setEditing(null)
      invalidate()
    },
    onError: (mutationError) => applyServerErrors(mutationError, setError),
  })

  const removeMutation = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => {
      toast.success('Category delete ho gayi.')
      setPendingDelete(null)
      invalidate()
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  return (
    <>
      <PageHeader
        title="Categories"
        description="Products ko groups mein baantein."
        actions={
          <Can permission={P.CATEGORIES_MANAGE}>
            <Button onClick={() => setEditing({})}>
              <Plus className="size-4" />
              Nayi category
            </Button>
          </Can>
        }
      />

      <Card>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <TableSkeleton columns={4} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Koi category nahi"
            description="Pehle category banayein, phir products usmein daalein."
            action={
              <Can permission={P.CATEGORIES_MANAGE}>
                <Button onClick={() => setEditing({})}>Nayi category</Button>
              </Can>
            }
          />
        ) : (
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Name</TH>
                <TH>Slug</TH>
                <TH>Description</TH>
                <TH align="right">Products</TH>
                <TH>Created</TH>
                <TH align="right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {data.items.map((category) => (
                <TR key={category.id}>
                  <TD className="font-medium text-slate-900">{category.name}</TD>
                  <TD>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                      {category.slug}
                    </code>
                  </TD>
                  <TD className="max-w-xs truncate text-slate-600">{category.description || '—'}</TD>
                  <TD align="right" className="tabular-nums">
                    {category.productCount}
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-slate-500">
                    {formatDate(category.createdAt)}
                  </TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1">
                      <Can permission={P.CATEGORIES_MANAGE}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit"
                          onClick={() => setEditing(category)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="dangerGhost"
                          size="icon"
                          aria-label="Delete"
                          onClick={() => setPendingDelete(category)}
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
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Category edit karein' : 'Nayi category'}
        description="Slug naam se khud ban jata hai."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit((values) => saveMutation.mutateAsync(values))} loading={isSubmitting}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit((values) => saveMutation.mutateAsync(values))} className="space-y-4" noValidate>
          <FormInput
            label="Name"
            required
            placeholder="Skincare"
            error={errors.name?.message}
            {...register('name')}
          />
          <FormTextarea
            label="Description"
            rows={3}
            placeholder="Is category mein kya aata hai…"
            error={errors.description?.message}
            {...register('description')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => removeMutation.mutate(pendingDelete.id)}
        loading={removeMutation.isPending}
        title={`"${pendingDelete?.name}" delete karein?`}
      />
    </>
  )
}
