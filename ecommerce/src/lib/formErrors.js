import { toast } from 'sonner'
import { normalizeApiError } from '@/lib/rtkErrors'

/**
 * Backend ke validation errors ko form fields par chipka deta hai.
 *
 * Backend ka shape: { error: { code, message, details: { email: ["..."] } } }
 * Jo fields form mein mojood nahi, unka message toast mein chala jata hai.
 */
export function applyServerErrors(error, setError, { fallbackToast = true } = {}) {
  const { message, fieldErrors } = normalizeApiError(error)
  const keys = Object.keys(fieldErrors)

  if (keys.length) {
    keys.forEach((field, index) => {
      setError(field, { type: 'server', message: fieldErrors[field] }, { shouldFocus: index === 0 })
    })
    return
  }

  if (fallbackToast) toast.error(message)
}
