import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithEnvelope } from '@/lib/rtkBaseQuery'

const REGISTER_API_URL = import.meta.env.VITE_REGISTER_API_URL || 'http://localhost:5002'

function normalizeRegisteredUser(data) {
  return {
    id: data.id ?? data._id,
    firstName: data.firstname ?? data.firstName,
    lastName: data.lastname ?? data.lastName,
    email: data.email,
    phone: data.phone,
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

function externalRegisterError(status, message) {
  const details = {}
  if (/email/i.test(message)) details.email = [message]
  if (/phone/i.test(message)) details.phone = [message]
  if (/password/i.test(message)) details.password = [message]

  return {
    status,
    data: {
      message,
      details: Object.keys(details).length ? details : null,
    },
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
          const response = await fetch(`${REGISTER_API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapRegisterBody(body)),
          })

          const data = await response.json().catch(() => ({}))

          if (!response.ok) {
            return {
              error: externalRegisterError(
                response.status,
                data.message ?? 'Kuch ghalat ho gaya. Dobara koshish karein.'
              ),
            }
          }

          return { data: { user: normalizeRegisteredUser(data), tokens: null } }
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

export const { useRegisterMutation } = authApiSlice
