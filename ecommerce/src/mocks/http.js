import { HttpResponse } from 'msw'
import { hasPermission } from '@/lib/permissions'
import { db } from './db'

export const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

export const url = (path) => `${API}${path}`

const ACCESS_TOKEN_TTL = 15 * 60 * 1000
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000

/** Network latency ka ehsaas — taake loading states asli lagein. */
export const latency = () => 220 + Math.random() * 320

function base64UrlEncode(value) {
  return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return decodeURIComponent(escape(atob(padded)))
}

/**
 * Fake JWT. Signature verify nahi hoti — sirf shape asli JWT jaisi hai taake
 * aapka frontend code asli backend ke saath bina badle chal jaye.
 */
export function signToken(payload, ttl) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + ttl })
  )
  return `${header}.${body}.mock-signature`
}

export function verifyToken(token) {
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function issueTokens(userId) {
  const accessToken = signToken({ sub: userId, type: 'access' }, ACCESS_TOKEN_TTL)
  const refreshToken = signToken({ sub: userId, type: 'refresh' }, REFRESH_TOKEN_TTL)
  db.data.sessions.push({
    token: refreshToken,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL).toISOString(),
  })
  db.commit()
  return { accessToken, refreshToken, expiresIn: Math.floor(ACCESS_TOKEN_TTL / 1000) }
}

// ---------------------------------------------------------------------------
// Response helpers — poori app ka response envelope yahin decide hota hai.
// ---------------------------------------------------------------------------

export const ok = (data, status = 200) => HttpResponse.json({ data }, { status })

export const noContent = () => new HttpResponse(null, { status: 204 })

export function fail(status, code, message, details) {
  return HttpResponse.json({ error: { code, message, details } }, { status })
}

export const badRequest = (message, details) => fail(400, 'VALIDATION_ERROR', message, details)
export const unauthorized = (message = 'Authentication required.') =>
  fail(401, 'UNAUTHENTICATED', message)
export const forbidden = (message = 'Aapke paas is action ki permission nahi hai.') =>
  fail(403, 'FORBIDDEN', message)
export const notFound = (resource = 'Resource') => fail(404, 'NOT_FOUND', `${resource} nahi mila.`)
export const conflict = (message) => fail(409, 'CONFLICT', message)

// ---------------------------------------------------------------------------
// Auth + RBAC middleware
// ---------------------------------------------------------------------------

export function currentUser(request) {
  const header = request.headers.get('Authorization') || ''
  if (!header.startsWith('Bearer ')) return null
  const payload = verifyToken(header.slice(7))
  if (!payload || payload.type !== 'access') return null
  const user = db.data.users.find((candidate) => candidate.id === payload.sub)
  if (!user || user.status !== 'active') return null
  return user
}

export function permissionsOf(user) {
  const role = db.data.roles.find((candidate) => candidate.id === user.roleId)
  return role?.permissions ?? []
}

/**
 * Har protected handler ki pehli line.
 * Returns `{ user, permissions }` ya `{ response }` jise seedha return kar dein.
 */
export function guard(request, requiredPermission) {
  const user = currentUser(request)
  if (!user) return { response: unauthorized('Access token missing ya expire ho gaya hai.') }

  const permissions = permissionsOf(user)
  if (requiredPermission && !hasPermission(permissions, requiredPermission)) {
    return {
      response: forbidden(
        `Is kaam ke liye "${[requiredPermission].flat().join(' ya ')}" permission chahiye.`
      ),
    }
  }
  return { user, permissions }
}

// ---------------------------------------------------------------------------
// Query helpers — pagination / search / sort / filter
// ---------------------------------------------------------------------------

export function paginate(items, request, { defaultSort = '-createdAt' } = {}) {
  const params = new URL(request.url).searchParams
  const page = Math.max(1, Number(params.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(params.get('per_page')) || 10))
  const sort = params.get('sort') || defaultSort

  const descending = sort.startsWith('-')
  const field = descending ? sort.slice(1) : sort

  const sorted = [...items].sort((a, b) => {
    const left = a[field]
    const right = b[field]
    if (left === right) return 0
    if (left === null || left === undefined) return 1
    if (right === null || right === undefined) return -1
    const result = typeof left === 'number' ? left - right : String(left).localeCompare(String(right))
    return descending ? -result : result
  })

  const total = sorted.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage

  return {
    rows: sorted.slice(start, start + perPage),
    meta: { page, perPage, total, lastPage, sort },
  }
}

export const searchParams = (request) => new URL(request.url).searchParams

export function matchesSearch(item, term, fields) {
  if (!term) return true
  const needle = term.toLowerCase().trim()
  return fields.some((field) => String(item[field] ?? '').toLowerCase().includes(needle))
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export function audit(user, action, resourceType, resourceId, meta = {}) {
  db.data.auditLogs.unshift({
    id: `aud_${Math.random().toString(36).slice(2, 10)}`,
    actorId: user?.id ?? null,
    actorName: user ? `${user.firstName} ${user.lastName}` : 'System',
    action,
    resourceType,
    resourceId,
    meta,
    ip: '127.0.0.1',
    createdAt: new Date().toISOString(),
  })
  db.data.auditLogs = db.data.auditLogs.slice(0, 500)
  db.commit()
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
