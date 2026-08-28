import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL } from '@/lib/apiClient'
import { tokenStore } from '@/lib/tokenStore'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = tokenStore.access
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

/** Mock/main API `{ data: ... }` envelope unwrap karta hai aur errors normalize karta hai. */
export async function baseQueryWithEnvelope(args, api, extraOptions) {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error) {
    const payload = result.error.data?.error ?? {}
    return {
      error: {
        status: result.error.status,
        data: {
          message: payload.message ?? 'Kuch ghalat ho gaya. Dobara koshish karein.',
          details: payload.details ?? null,
        },
      },
    }
  }

  return { data: result.data?.data ?? result.data }
}
