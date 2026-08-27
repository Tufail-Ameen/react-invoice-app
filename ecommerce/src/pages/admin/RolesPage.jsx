import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { queryKeys, rolesApi } from '@/api/endpoints'
import { Can } from '@/auth/guards'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { Checkbox, Field, FormInput, Textarea } from '@/components/ui/Field'
import { FullPageLoader } from '@/components/ui/Loaders'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { PERMISSIONS as P, PERMISSION_GROUPS } from '@/lib/permissions'
import { cn } from '@/lib/utils'

export function RolesPage() {
  const queryClient = useQueryClient()
  const { can } = useAuth()
  const canManage = can(P.ROLES_MANAGE)

  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newRole, setNewRole] = useState({ name: '', description: '' })
  const [pendingDelete, setPendingDelete] = useState(null)

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.roles,
    queryFn: rolesApi.list,
  })

  const roles = data?.items ?? []
  const selected = roles.find((role) => role.id === selectedId) ?? roles[0] ?? null

  // Draft us role ke saath bandha hua hai jise wo belong karta hai. Role badalte
  // hi checkbox state seedha render ke dauran reset ho jati hai — effect ki
  // zaroorat nahi.
  const [editState, setEditState] = useState({ roleId: null, permissions: [] })
  if (selected && editState.roleId !== selected.id) {
    setEditState({ roleId: selected.id, permissions: selected.permissions })
  }
  const draft = selected && editState.roleId === selected.id ? editState.permissions : []
  const setDraft = (updater) =>
    setEditState((previous) => ({
      ...previous,
      permissions: typeof updater === 'function' ? updater(previous.permissions) : updater,
    }))

  const isWildcard = selected?.permissions.includes('*')
  const isDirty =
    selected &&
    !isWildcard &&
    (draft.length !== selected.permissions.length ||
      draft.some((permission) => !selected.permissions.includes(permission)))

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.roles })
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.me })
  }

  const saveMutation = useMutation({
    mutationFn: () => rolesApi.update({ id: selected.id, permissions: draft }),
    onSuccess: () => {
      toast.success('Permissions save ho gayin. Us role ke users ko dobara login karna hoga.')
      invalidate()
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  const createMutation = useMutation({
    mutationFn: () => rolesApi.create({ ...newRole, permissions: [] }),
    onSuccess: (result) => {
      toast.success('Role ban gaya. Ab permissions chunein.')
      setCreating(false)
      setNewRole({ name: '', description: '' })
      setSelectedId(result.role.id)
      invalidate()
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  const removeMutation = useMutation({
    mutationFn: rolesApi.remove,
    onSuccess: () => {
      toast.success('Role delete ho gaya.')
      setPendingDelete(null)
      setSelectedId(null)
      invalidate()
    },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  const toggle = (permission) =>
    setDraft((previous) =>
      previous.includes(permission)
        ? previous.filter((entry) => entry !== permission)
        : [...previous, permission]
    )

  const toggleGroup = (group, checked) =>
    setDraft((previous) => {
      const keys = group.permissions.map((permission) => permission.key)
      return checked
        ? [...new Set([...previous, ...keys])]
        : previous.filter((entry) => !keys.includes(entry))
    })

  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (isPending) return <FullPageLoader label="Roles load ho rahe hain…" />

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Har role ke saath permissions bandhi hui hain. Users ko role milta hai, permissions nahi."
        actions={
          <Can permission={P.ROLES_MANAGE}>
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Naya role
            </Button>
          </Can>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Card className="h-fit">
          <CardHeader title="Roles" description={`${roles.length} roles`} />
          <ul className="divide-y divide-slate-100">
            {roles.map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(role.id)}
                  className={cn(
                    'focus-ring flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                    selected?.id === role.id ? 'bg-brand-50' : 'hover:bg-slate-50'
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      selected?.id === role.id ? 'text-brand-600' : 'text-slate-400'
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'truncate text-sm font-medium',
                          selected?.id === role.id ? 'text-brand-900' : 'text-slate-900'
                        )}
                      >
                        {role.name}
                      </span>
                      {role.isSystem && <Lock className="size-3 shrink-0 text-slate-400" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {role.userCount} users · {role.permissionCount} permissions
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {selected && (
          <Card>
            <CardHeader
              title={selected.name}
              description={selected.description}
              action={
                <div className="flex items-center gap-2">
                  <Can permission={P.ROLES_MANAGE}>
                    {!selected.isSystem && (
                      <Button
                        variant="dangerGhost"
                        size="sm"
                        onClick={() => setPendingDelete(selected)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    )}
                    {!isWildcard && (
                      <Button
                        size="sm"
                        disabled={!isDirty}
                        loading={saveMutation.isPending}
                        onClick={() => saveMutation.mutate()}
                      >
                        Save changes
                      </Button>
                    )}
                  </Can>
                </div>
              }
            />

            {isWildcard ? (
              <CardBody>
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                  <p className="text-sm font-medium text-brand-900">
                    Is role ke paas wildcard <code className="font-mono">*</code> permission hai.
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-800">
                    Har naya permission khud-ba-khud is role ko mil jata hai. Isi liye ye edit
                    nahi hota. Backend mein bhi yehi shortcut rakhein — warna har naye feature par
                    migration likhni padegi.
                  </p>
                </div>
              </CardBody>
            ) : (
              <CardBody className="space-y-6">
                {!canManage && (
                  <div className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800 ring-1 ring-amber-200">
                    Aap permissions dekh sakte hain lekin badal nahi sakte — iske liye
                    <code className="mx-1 font-mono">roles.manage</code> chahiye.
                  </div>
                )}

                {PERMISSION_GROUPS.map((group) => {
                  const keys = group.permissions.map((permission) => permission.key)
                  const selectedCount = keys.filter((key) => draft.includes(key)).length
                  const allChecked = selectedCount === keys.length

                  return (
                    <div key={group.key} className="rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                          <p className="text-xs text-slate-500">{group.description}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Badge tone={allChecked ? 'success' : selectedCount ? 'warning' : 'neutral'}>
                            {selectedCount}/{keys.length}
                          </Badge>
                          <Checkbox
                            checked={allChecked}
                            disabled={!canManage}
                            onChange={(event) => toggleGroup(group, event.target.checked)}
                            label="All"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.permissions.map((permission) => (
                          <Checkbox
                            key={permission.key}
                            checked={draft.includes(permission.key)}
                            disabled={!canManage}
                            onChange={() => toggle(permission.key)}
                            label={
                              <span>
                                <span className="block">{permission.label}</span>
                                <code className="block font-mono text-[10px] text-slate-400">
                                  {permission.key}
                                </code>
                              </span>
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardBody>
            )}
          </Card>
        )}
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Naya role"
        description="Role banane ke baad iski permissions chunein."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending}
              disabled={newRole.name.trim().length < 2}
              onClick={() => createMutation.mutate()}
            >
              Role banayein
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormInput
            label="Role name"
            required
            placeholder="Warehouse Staff"
            value={newRole.name}
            onChange={(event) => setNewRole((previous) => ({ ...previous, name: event.target.value }))}
          />
          <Field label="Description" hint="Team ko samajh aaye ki ye role kis ke liye hai.">
            <Textarea
              rows={3}
              value={newRole.description}
              onChange={(event) =>
                setNewRole((previous) => ({ ...previous, description: event.target.value }))
              }
              placeholder="Sirf stock aur shipping sambhalta hai."
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => removeMutation.mutate(pendingDelete.id)}
        loading={removeMutation.isPending}
        title={`"${pendingDelete?.name}" role delete karein?`}
        description="Jis role par users hain wo delete nahi hota."
      />
    </>
  )
}
