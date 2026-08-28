import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithEnvelope } from '@/lib/rtkBaseQuery'

const AUTH_API_URL = import.meta.env.VITE_REGISTER_API_URL || 'http://localhost:5002'

function normalizeAuthUser(data) {
  return {
    id: data.id ?? data._id,
    firstName: data.firstname ?? data.firstName,
    lastName: data.lastname ?? data.lastName,
    email: data.email,
    phone: data.phone,
    permissions: data.permissions ?? [],
  }
}

function normalizeLoginTokens(data) {
  if (data.tokens) return data.tokens

  const accessToken = data.accessToken ?? data.token ?? data.access_token
  const refreshToken = data.refreshToken ?? data.refresh_token ?? null

  if (!accessToken) return null
  return { accessToken, refreshToken }
}

function normalizeLoginResponse(data) {
  const userSource = data.user ?? data
  return {
    user: normalizeAuthUser(userSource),
    tokens: normalizeLoginTokens(data),
  }
}

function mapRegisterBody(body) {
  return {
    firstname: body.firstName.trim(),
    lastname: body.lastName.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    password: body.password,
    confirmpassword: body.passwordConfirmation,
  }
}

function externalAuthError(status, message, fields = ['email', 'phone', 'password']) {
  const details = {}
  if (fields.includes('email') && /email/i.test(message)) details.email = [message]
  if (fields.includes('phone') && /phone/i.test(message)) details.phone = [message]
  if (fields.includes('password') && /password/i.test(message)) details.password = [message]

  return {
    status,
    data: {
      message,
      details: Object.keys(details).length ? details : null,
    },
  }
}

function mapLoginBody(body) {
  return {
    email: body.email.trim(),
    password: body.password,
  }
}

export const authApiSlice = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithEnvelope,
  endpoints: (builder) => ({
    register: builder.mutation({
      queryFn: async (body) => {
        if (import.meta.env.VITE_USE_MOCK_REGISTER === 'true') {
          const result = await baseQueryWithEnvelope(
            { url: '/auth/register', method: 'POST', body },
            {},
            {}
          )
          if (result.error) return { error: result.error }
          return { data: result.data }
        }

        try {
          const response = await fetch(`${AUTH_API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapRegisterBody(body)),
          })

          const data = await response.json().catch(() => ({}))

          if (!response.ok) {
            return {
              error: externalAuthError(
                response.status,
                data.message ?? 'Kuch ghalat ho gaya. Dobara koshish karein.'
              ),
            }
          }

          return { data: { user: normalizeAuthUser(data), tokens: null } }
        } catch {
          return {
            error: {
              status: 'FETCH_ERROR',
              data: {
                message: 'Server se rabta nahi ho saka. Apna internet ya backend check karein.',
              },
            },
          }
        }
      },
    }),
    login: builder.mutation({
      queryFn: async (body) => {
        if (import.meta.env.VITE_USE_MOCK_LOGIN === 'true') {
          const result = await baseQueryWithEnvelope(
            { url: '/auth/login', method: 'POST', body },
            {},
            {}
          )
          if (result.error) return { error: result.error }
          return { data: result.data }
        }

        try {
          const response = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapLoginBody(body)),
          })

          const data = await response.json().catch(() => ({}))

          if (!response.ok) {
            return {
              error: externalAuthError(
                response.status,
                data.message ?? 'Email ya password ghalat hai.',
                ['email', 'password']
              ),
            }
          }

          return { data: normalizeLoginResponse(data) }
        } catch {
          return {
            error: {
              status: 'FETCH_ERROR',
              data: {
                message: 'Server se rabta nahi ho saka. Apna internet ya backend check karein.',
              },
            },
          }
        }
      },
    }),
  }),
})

export const { useRegisterMutation, useLoginMutation } = authApiSlice
