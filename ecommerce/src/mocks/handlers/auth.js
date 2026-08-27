import { delay, http } from 'msw'
import { db, nextId } from '../db'
import {
  audit,
  badRequest,
  conflict,
  guard,
  issueTokens,
  latency,
  noContent,
  ok,
  permissionsOf,
  unauthorized,
  url,
  verifyToken,
} from '../http'

export function serializeUser(user) {
  const role = db.data.roles.find((candidate) => candidate.id === user.roleId)
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    role: role ? { id: role.id, name: role.name, slug: role.slug } : null,
    permissions: role?.permissions ?? [],
  }
}

export const authHandlers = [
  http.post(url('/auth/register'), async ({ request }) => {
    await delay(latency())
    const body = await request.json()
    const errors = {}

    if (!body.firstName?.trim()) errors.firstName = ['First name is required.']
    if (!body.lastName?.trim()) errors.lastName = ['Last name is required.']
    if (!/^\S+@\S+\.\S+$/.test(body.email ?? '')) errors.email = ['Valid email is required.']
    if ((body.password ?? '').length < 8) errors.password = ['Password must be at least 8 characters.']
    if (body.password !== body.passwordConfirmation)
      errors.passwordConfirmation = ['Passwords do not match.']

    if (Object.keys(errors).length) return badRequest('Please fix the errors below.', errors)

    const email = body.email.toLowerCase().trim()
    if (db.data.users.some((user) => user.email.toLowerCase() === email))
      return conflict('Is email se account pehle se mojood hai.')

    const user = {
      id: nextId('usr'),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email,
      password: body.password,
      phone: body.phone ?? null,
      roleId: 'role_customer',
      status: 'active',
      emailVerifiedAt: null,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    db.data.users.push(user)

    // Self-registered user ka customer record bhi banta hai — admin panel isi
    // table ko dikhata hai. Backend mein ye ek transaction hona chahiye.
    db.data.customers.unshift({
      id: nextId('cus'),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      company: null,
      status: 'active',
      notes: 'Storefront se khud register hua.',
      address: { line1: '', city: '', postalCode: '', country: '' },
      userId: user.id,
      createdBy: null,
      createdAt: user.createdAt,
      updatedAt: user.createdAt,
    })
    db.commit()
    audit(user, 'auth.registered', 'user', user.id, { email })

    const tokens = issueTokens(user.id)
    return ok({ user: serializeUser(user), tokens }, 201)
  }),

  http.post(url('/auth/login'), async ({ request }) => {
    await delay(latency())
    const { email, password } = await request.json()

    const user = db.data.users.find(
      (candidate) => candidate.email.toLowerCase() === String(email ?? '').toLowerCase().trim()
    )

    // Email galat hai ya password — dono par ek hi message. Warna attacker
    // pata kar sakta hai ki kaun se emails registered hain (user enumeration).
    if (!user || user.password !== password)
      return unauthorized('Email ya password ghalat hai.')

    if (user.status === 'suspended')
      return unauthorized('Aapka account suspend kar diya gaya hai. Admin se rabta karein.')

    user.lastLoginAt = new Date().toISOString()
    db.commit()
    audit(user, 'auth.logged_in', 'user', user.id)

    return ok({ user: serializeUser(user), tokens: issueTokens(user.id) })
  }),

  http.post(url('/auth/refresh'), async ({ request }) => {
    await delay(120)
    const { refreshToken } = await request.json()
    const payload = refreshToken ? verifyToken(refreshToken) : null

    if (!payload || payload.type !== 'refresh')
      return unauthorized('Refresh token invalid ya expire ho chuka hai.')

    const session = db.data.sessions.find((candidate) => candidate.token === refreshToken)
    if (!session) return unauthorized('Session revoke ho chuki hai. Dobara login karein.')

    const user = db.data.users.find((candidate) => candidate.id === payload.sub)
    if (!user || user.status !== 'active') return unauthorized('Account ab active nahi hai.')

    // Rotation: purana refresh token turant mar jata hai.
    db.data.sessions = db.data.sessions.filter((candidate) => candidate.token !== refreshToken)
    db.commit()

    return ok({ user: serializeUser(user), tokens: issueTokens(user.id) })
  }),

  http.post(url('/auth/logout'), async ({ request }) => {
    await delay(120)
    const body = await request.json().catch(() => ({}))
    if (body.refreshToken) {
      db.data.sessions = db.data.sessions.filter((session) => session.token !== body.refreshToken)
      db.commit()
    }
    return noContent()
  }),

  http.get(url('/auth/me'), async ({ request }) => {
    await delay(latency())
    const { user, response } = guard(request)
    if (response) return response
    return ok({ user: serializeUser(user), permissions: permissionsOf(user) })
  }),

  http.patch(url('/auth/profile'), async ({ request }) => {
    await delay(latency())
    const { user, response } = guard(request)
    if (response) return response

    const body = await request.json()
    if (body.firstName !== undefined) user.firstName = body.firstName.trim()
    if (body.lastName !== undefined) user.lastName = body.lastName.trim()
    if (body.phone !== undefined) user.phone = body.phone
    db.commit()
    audit(user, 'profile.updated', 'user', user.id)

    return ok({ user: serializeUser(user) })
  }),

  http.post(url('/auth/change-password'), async ({ request }) => {
    await delay(latency())
    const { user, response } = guard(request)
    if (response) return response

    const body = await request.json()
    if (user.password !== body.currentPassword)
      return badRequest('Current password ghalat hai.', {
        currentPassword: ['Current password ghalat hai.'],
      })
    if ((body.newPassword ?? '').length < 8)
      return badRequest('Password kam se kam 8 characters ka hona chahiye.', {
        newPassword: ['Password must be at least 8 characters.'],
      })

    user.password = body.newPassword
    // Password badalne par baqi sab sessions kill — asli backend mein zaroori hai.
    db.data.sessions = db.data.sessions.filter((session) => session.userId !== user.id)
    db.commit()
    audit(user, 'auth.password_changed', 'user', user.id)

    return ok({ tokens: issueTokens(user.id) })
  }),

  http.post(url('/auth/forgot-password'), async ({ request }) => {
    await delay(latency())
    const { email } = await request.json()
    const user = db.data.users.find(
      (candidate) => candidate.email.toLowerCase() === String(email ?? '').toLowerCase().trim()
    )

    // Email mojood ho ya na ho — jawab hamesha ek jaisa (user enumeration se bachao).
    if (user) {
      const token = nextId('rst')
      db.data.passwordResetTokens = db.data.passwordResetTokens
        .filter((entry) => entry.userId !== user.id)
        .concat({
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
      db.commit()
      audit(user, 'auth.password_reset_requested', 'user', user.id)
      // Asli backend email bhejta hai. Mock mein token response mein aata hai
      // taake aap reset flow test kar sakein.
      return ok({
        message: 'Agar ye email registered hai to reset link bhej diya gaya hai.',
        devToken: token,
      })
    }

    return ok({ message: 'Agar ye email registered hai to reset link bhej diya gaya hai.' })
  }),

  http.post(url('/auth/reset-password'), async ({ request }) => {
    await delay(latency())
    const body = await request.json()
    const entry = db.data.passwordResetTokens.find((candidate) => candidate.token === body.token)

    if (!entry || new Date(entry.expiresAt) < new Date())
      return badRequest('Reset link invalid hai ya expire ho chuka hai.', {
        token: ['Invalid or expired token.'],
      })
    if ((body.password ?? '').length < 8)
      return badRequest('Password kam se kam 8 characters ka hona chahiye.', {
        password: ['Password must be at least 8 characters.'],
      })
    if (body.password !== body.passwordConfirmation)
      return badRequest('Passwords match nahi kar rahe.', {
        passwordConfirmation: ['Passwords do not match.'],
      })

    const user = db.data.users.find((candidate) => candidate.id === entry.userId)
    user.password = body.password
    db.data.passwordResetTokens = db.data.passwordResetTokens.filter(
      (candidate) => candidate.token !== body.token
    )
    db.data.sessions = db.data.sessions.filter((session) => session.userId !== user.id)
    db.commit()
    audit(user, 'auth.password_reset', 'user', user.id)

    return ok({ message: 'Password reset ho gaya. Ab login karein.' })
  }),
]
