/**
 * RTK Query / fetch errors ko react-hook-form ke setError format mein badalta hai.
 */
export function normalizeApiError(error) {
  if (!error) {
    return { message: 'Kuch ghalat ho gaya.', fieldErrors: {} }
  }

  if (error.fieldErrors) {
    return { message: error.message, fieldErrors: error.fieldErrors }
  }

  const data = error.data ?? error
  const message =
    data?.message ?? data?.error?.message ?? error.message ?? 'Kuch ghalat ho gaya. Dobara koshish karein.'
  const details = data?.details ?? data?.error?.details ?? {}
  const fieldErrors = {}

  if (details && typeof details === 'object' && !Array.isArray(details)) {
    Object.entries(details).forEach(([field, messages]) => {
      fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
    })
  }

  if (!Object.keys(fieldErrors).length) {
    if (/email/i.test(message)) fieldErrors.email = message
    if (/phone/i.test(message)) fieldErrors.phone = message
    if (/password/i.test(message)) fieldErrors.password = message
  }

  return { message, fieldErrors }
}
