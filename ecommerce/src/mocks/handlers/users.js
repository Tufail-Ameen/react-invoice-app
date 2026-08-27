import { delay, http } from 'msw'
import { ALL_PERMISSIONS, PERMISSIONS as P } from '@/lib/permissions'
import { db, nextId } from '../db'
import {
  audit,
  badRequest,
  conflict,
  forbidden,
  guard,
  latency,
  matchesSearch,
  noContent,
  notFound,
  ok,
  paginate,
  searchParams,
  slugify,
  url,
} from '../http'
import { serializeUser } from './auth'

export const userHandlers = [
  http.get(url('/users'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.USERS_VIEW)
    if (response) return response

    const params = searchParams(request)
    const search = params.get('search')
    const roleId = params.get('role_id')
    const status = params.get('status')

    const filtered = db.data.users.filter((user) => {
      if (!matchesSearch(user, search, ['firstName', 'lastName', 'email', 'phone'])) return false
      if (roleId && user.roleId !== roleId) return false
      if (status && user.status !== status) return false
      return true
    })

    const { rows, meta } = paginate(filtered, request, { defaultSort: '-createdAt' })
    return ok({ items: rows.map(serializeUser), meta })
  }),

  http.post(url('/users'), async ({ request }) => {
    await delay(latency())
    const { user: actor, response } = guard(request, P.USERS_CREATE)
    if (response) return response

    const body = await request.json()
    const errors = {}
    if (!body.firstName?.trim()) errors.firstName = ['First name is required.']
    if (!body.lastName?.trim()) errors.lastName = ['Last name is required.']
    if (!/^\S+@\S+\.\S+$/.test(body.email ?? '')) errors.email = ['Valid email is required.']
    if (!body.roleId) errors.roleId = ['Role is required.']
    if ((body.password ?? '').length < 8) errors.password = ['Password must be at least 8 characters.']
    if (Object.keys(errors).length) return badRequest('User create nahi ho saka.', errors)

    const email = body.email.toLowerCase().trim()
    if (db.data.users.some((candidate) => candidate.email.toLowerCase() === email))
      return conflict('Is email se user pehle se mojood hai.')

    const role = db.data.roles.find((candidate) => candidate.id === body.roleId)
    if (!role) return badRequest('Role invalid hai.', { roleId: ['Unknown role.'] })

    // Privilege escalation se bachao: sirf super admin hi super admin bana sakta hai.
    const actorRole = db.data.roles.find((candidate) => candidate.id === actor.roleId)
    if (role.slug === 'super_admin' && actorRole?.slug !== 'super_admin')
      return forbidden('Sirf Super Admin hi doosra Super Admin bana sakta hai.')

    const user = {
      id: nextId('usr'),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email,
      password: body.password,
      phone: body.phone ?? null,
      roleId: body.roleId,
      status: body.status ?? 'active',
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    }
    db.data.users.push(user)
    db.commit()
    audit(actor, 'user.created', 'user', user.id, { email, role: role.slug })

    return ok({ user: serializeUser(user) }, 201)
  }),

  http.get(url('/users/:id'), async ({ request, params }) => {
    await delay(latency())
    const { response } = guard(request, P.USERS_VIEW)
    if (response) return response

    const user = db.data.users.find((candidate) => candidate.id === params.id)
    if (!user) return notFound('User')
    return ok({ user: serializeUser(user) })
  }),

  http.patch(url('/users/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user: actor, response } = guard(request, P.USERS_UPDATE)
    if (response) return response

    const user = db.data.users.find((candidate) => candidate.id === params.id)
    if (!user) return notFound('User')

    const body = await request.json()
    const actorRole = db.data.roles.find((candidate) => candidate.id === actor.roleId)
    const targetRole = db.data.roles.find((candidate) => candidate.id === user.roleId)

    if (targetRole?.slug === 'super_admin' && actorRole?.slug !== 'super_admin')
      return forbidden('Super Admin ko sirf Super Admin edit kar sakta hai.')

    if (body.roleId && body.roleId !== user.roleId) {
      const nextRole = db.data.roles.find((candidate) => candidate.id === body.roleId)
      if (!nextRole) return badRequest('Role invalid hai.', { roleId: ['Unknown role.'] })
      if (nextRole.slug === 'super_admin' && actorRole?.slug !== 'super_admin')
        return forbidden('Sirf Super Admin hi Super Admin role de sakta hai.')

      // Aakhri super admin ka role hatana account lockout bana deta hai.
      const superAdmins = db.data.users.filter(
        (candidate) => candidate.roleId === 'role_super_admin' && candidate.status === 'active'
      )
      if (user.roleId === 'role_super_admin' && superAdmins.length === 1)
        return conflict('Ye aakhri Super Admin hai — iska role nahi badla ja sakta.')
    }

    if (body.status === 'suspended' && user.id === actor.id)
      return conflict('Aap apna hi account suspend nahi kar sakte.')

    Object.assign(user, {
      firstName: body.firstName?.trim() ?? user.firstName,
      lastName: body.lastName?.trim() ?? user.lastName,
      phone: body.phone !== undefined ? body.phone : user.phone,
      roleId: body.roleId ?? user.roleId,
      status: body.status ?? user.status,
    })
    if (body.password) user.password = body.password

    if (user.status === 'suspended')
      db.data.sessions = db.data.sessions.filter((session) => session.userId !== user.id)

    db.commit()
    audit(actor, 'user.updated', 'user', user.id, { email: user.email })
    return ok({ user: serializeUser(user) })
  }),

  http.delete(url('/users/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user: actor, response } = guard(request, P.USERS_DELETE)
    if (response) return response

    const user = db.data.users.find((candidate) => candidate.id === params.id)
    if (!user) return notFound('User')
    if (user.id === actor.id) return conflict('Aap apna hi account delete nahi kar sakte.')
    if (user.roleId === 'role_super_admin') return forbidden('Super Admin delete nahi ho sakta.')

    db.data.users = db.data.users.filter((candidate) => candidate.id !== user.id)
    db.data.sessions = db.data.sessions.filter((session) => session.userId !== user.id)
    db.commit()
    audit(actor, 'user.deleted', 'user', user.id, { email: user.email })
    return noContent()
  }),

  // -------------------------------------------------------------------------
  // Roles & permissions
  // -------------------------------------------------------------------------
  http.get(url('/roles'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, [P.ROLES_VIEW, P.USERS_VIEW])
    if (response) return response

    const items = db.data.roles.map((role) => ({
      ...role,
      userCount: db.data.users.filter((user) => user.roleId === role.id).length,
      permissionCount: role.permissions.includes('*')
        ? ALL_PERMISSIONS.length
        : role.permissions.length,
    }))
    return ok({ items, availablePermissions: ALL_PERMISSIONS })
  }),

  http.post(url('/roles'), async ({ request }) => {
    await delay(latency())
    const { user: actor, response } = guard(request, P.ROLES_MANAGE)
    if (response) return response

    const body = await request.json()
    if (!body.name?.trim())
      return badRequest('Role name required hai.', { name: ['Name is required.'] })

    const slug = slugify(body.name)
    if (db.data.roles.some((role) => role.slug === slug))
      return conflict('Is naam ka role pehle se mojood hai.')

    const unknown = (body.permissions ?? []).filter(
      (permission) => !ALL_PERMISSIONS.includes(permission)
    )
    if (unknown.length)
      return badRequest('Kuch permissions valid nahi hain.', { permissions: unknown })

    const role = {
      id: nextId('role'),
      name: body.name.trim(),
      slug,
      description: body.description ?? '',
      isSystem: false,
      permissions: body.permissions ?? [],
    }
    db.data.roles.push(role)
    db.commit()
    audit(actor, 'role.created', 'role', role.id, { name: role.name })
    return ok({ role: { ...role, userCount: 0, permissionCount: role.permissions.length } }, 201)
  }),

  http.patch(url('/roles/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user: actor, response } = guard(request, P.ROLES_MANAGE)
    if (response) return response

    const role = db.data.roles.find((candidate) => candidate.id === params.id)
    if (!role) return notFound('Role')
    if (role.slug === 'super_admin')
      return forbidden('Super Admin ki permissions badli nahi ja saktin.')

    const body = await request.json()
    if (body.permissions) {
      const unknown = body.permissions.filter(
        (permission) => !ALL_PERMISSIONS.includes(permission)
      )
      if (unknown.length)
        return badRequest('Kuch permissions valid nahi hain.', { permissions: unknown })
      role.permissions = body.permissions
    }
    if (body.name !== undefined) {
      role.name = body.name.trim()
      if (!role.isSystem) role.slug = slugify(body.name)
    }
    if (body.description !== undefined) role.description = body.description

    db.commit()
    audit(actor, 'role.updated', 'role', role.id, {
      name: role.name,
      permissionCount: role.permissions.length,
    })

    return ok({
      role: {
        ...role,
        userCount: db.data.users.filter((user) => user.roleId === role.id).length,
        permissionCount: role.permissions.length,
      },
    })
  }),

  http.delete(url('/roles/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user: actor, response } = guard(request, P.ROLES_MANAGE)
    if (response) return response

    const role = db.data.roles.find((candidate) => candidate.id === params.id)
    if (!role) return notFound('Role')
    if (role.isSystem) return forbidden('System role delete nahi ho sakta.')

    const userCount = db.data.users.filter((user) => user.roleId === role.id).length
    if (userCount > 0)
      return conflict(`Is role par ${userCount} users hain. Pehle unhe doosra role dein.`)

    db.data.roles = db.data.roles.filter((candidate) => candidate.id !== role.id)
    db.commit()
    audit(actor, 'role.deleted', 'role', role.id, { name: role.name })
    return noContent()
  }),
]
