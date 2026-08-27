import * as z from 'zod'

/**
 * HTML inputs hamesha string deti hain, aur khali input `""` hoti hai.
 * `Number("")` chup-chaap `0` ban jata hai — is liye pehle `undefined` karte
 * hain, warna khali "Compare-at price" database mein 0 chala jayega.
 */
const toNumber = (value) =>
  value === '' || value === null || value === undefined ? undefined : Number(value)

export function numberField({ required = true, min = 0, integer = false, label = 'Ye field' } = {}) {
  let schema = z.number({
    invalid_type_error: 'Sirf number likhein.',
    required_error: `${label} required hai.`,
  })

  if (integer) schema = schema.int('Poora number likhein (decimal nahi).')
  if (min !== null) schema = schema.min(min, `${min} se kam nahi ho sakta.`)
  if (!required) schema = schema.optional()

  return z.preprocess(toNumber, schema)
}

export const positiveMoney = (label) =>
  z.preprocess(
    toNumber,
    z
      .number({ invalid_type_error: 'Sirf number likhein.', required_error: `${label} required hai.` })
      .positive('0 se zyada honi chahiye.')
  )
