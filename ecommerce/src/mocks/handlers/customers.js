import { delay, http } from 'msw'
import { PERMISSIONS as P } from '@/lib/permissions'
import { db, nextId } from '../db'
import {
  audit,
  badRequest,
  conflict,
  guard,
  latency,
  matchesSearch,
  noContent,
  notFound,
  ok,
  paginate,
  searchParams,
  url,
} from '../http'

/**
 * Customer ke saath uske orders ka summary bhi jata hai.
 * Asli backend mein ye `SUM()` + `COUNT()` wali aggregate query hogi — har
 * customer ke liye alag query mat chalayein warna N+1 problem ban jayegi.
 */
function withStats(customer) {
  const orders = db.data.orders.filter((order) => order.customerId === customer.id)
  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid')
  return {
    ...customer,
    fullName: `${customer.firstName} ${customer.lastName}`,
    ordersCount: orders.length,
    totalSpent: paidOrders.reduce((sum, order) => sum + order.grandTotal, 0),
    lastOrderAt: orders.length
      ? orders.reduce((latest, order) => (order.placedAt > latest ? order.placedAt : latest), '')
      : null,
  }
}

function validateCustomer(body, { customerId } = {}) {
  const errors = {}
  if (!body.firstName?.trim()) errors.firstName = ['First name is required.']
  if (!body.lastName?.trim()) errors.lastName = ['Last name is required.']
  if (!/^\S+@\S+\.\S+$/.test(body.email ?? '')) errors.email = ['Valid email is required.']
  if (body.phone && !/^[\d\s+()-]{7,20}$/.test(body.phone))
    errors.phone = ['Phone number format is invalid.']

  const duplicate = db.data.customers.find(
    (customer) =>
      customer.email.toLowerCase() === String(body.email ?? '').toLowerCase().trim() &&
      customer.id !== customerId
  )
  if (duplicate) errors.email = ['Is email ka customer pehle se mojood hai.']

  return errors
}

export const customerHandlers = [
  http.get(url('/customers'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.CUSTOMERS_VIEW)
    if (response) return response

    const params = searchParams(request)
    const search = params.get('search')
    const status = params.get('status')

    const filtered = db.data.customers.filter((customer) => {
      if (!matchesSearch(customer, search, ['firstName', 'lastName', 'email', 'phone', 'company']))
        return false
      if (status && customer.status !== status) return false
      return true
    })

    const { rows, meta } = paginate(filtered, request, { defaultSort: '-createdAt' })
    return ok({ items: rows.map(withStats), meta })
  }),

  http.get(url('/customers/:id'), async ({ request, params }) => {
    await delay(latency())
    const { response } = guard(request, P.CUSTOMERS_VIEW)
    if (response) return response

    const customer = db.data.customers.find((candidate) => candidate.id === params.id)
    if (!customer) return notFound('Customer')

    const orders = db.data.orders
      .filter((order) => order.customerId === customer.id)
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        grandTotal: order.grandTotal,
        currency: order.currency,
        itemCount: order.items.length,
        placedAt: order.placedAt,
      }))

    return ok({ customer: withStats(customer), orders })
  }),

  http.post(url('/customers'), async ({ request }) => {
    await delay(latency())
    const { user, response } = guard(request, P.CUSTOMERS_CREATE)
    if (response) return response

    const body = await request.json()
    const errors = validateCustomer(body)
    if (Object.keys(errors).length) return badRequest('Customer save nahi ho saka.', errors)

    const customer = {
      id: nextId('cus'),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone ?? null,
      company: body.company || null,
      status: body.status ?? 'active',
      notes: body.notes ?? '',
      address: {
        line1: body.address?.line1 ?? '',
        city: body.address?.city ?? '',
        postalCode: body.address?.postalCode ?? '',
        country: body.address?.country ?? '',
      },
      userId: null,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    db.data.customers.unshift(customer)
    db.commit()
    audit(user, 'customer.created', 'customer', customer.id, {
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
    })

    return ok({ customer: withStats(customer) }, 201)
  }),

  http.patch(url('/customers/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user, response } = guard(request, P.CUSTOMERS_UPDATE)
    if (response) return response

    const customer = db.data.customers.find((candidate) => candidate.id === params.id)
    if (!customer) return notFound('Customer')

    const body = await request.json()
    const errors = validateCustomer({ ...customer, ...body }, { customerId: customer.id })
    if (Object.keys(errors).length) return badRequest('Customer update nahi ho saka.', errors)

    Object.assign(customer, {
      firstName: body.firstName?.trim() ?? customer.firstName,
      lastName: body.lastName?.trim() ?? customer.lastName,
      email: body.email?.toLowerCase().trim() ?? customer.email,
      phone: body.phone !== undefined ? body.phone : customer.phone,
      company: body.company !== undefined ? body.company || null : customer.company,
      status: body.status ?? customer.status,
      notes: body.notes !== undefined ? body.notes : customer.notes,
      address: body.address ? { ...customer.address, ...body.address } : customer.address,
      updatedAt: new Date().toISOString(),
    })

    db.commit()
    audit(user, 'customer.updated', 'customer', customer.id, {
      name: `${customer.firstName} ${customer.lastName}`,
    })
    return ok({ customer: withStats(customer) })
  }),

  http.delete(url('/customers/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user, response } = guard(request, P.CUSTOMERS_DELETE)
    if (response) return response

    const customer = db.data.customers.find((candidate) => candidate.id === params.id)
    if (!customer) return notFound('Customer')

    const orderCount = db.data.orders.filter((order) => order.customerId === customer.id).length
    if (orderCount > 0)
      return conflict(
        `Is customer ke ${orderCount} orders hain. Delete ke bajaye status "inactive" kar dein.`
      )

    db.data.customers = db.data.customers.filter((candidate) => candidate.id !== customer.id)
    db.commit()
    audit(user, 'customer.deleted', 'customer', customer.id, {
      name: `${customer.firstName} ${customer.lastName}`,
    })
    return noContent()
  }),
]
