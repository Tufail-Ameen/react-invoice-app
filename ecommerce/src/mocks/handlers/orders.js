import { delay, http } from 'msw'
import { PERMISSIONS as P } from '@/lib/permissions'
import { db, nextId } from '../db'
import {
  audit,
  badRequest,
  conflict,
  currentUser,
  guard,
  latency,
  matchesSearch,
  notFound,
  ok,
  paginate,
  searchParams,
  unauthorized,
  url,
} from '../http'

/**
 * Order status ki state machine.
 * Backend mein ye check zaroor lagayein — warna cancelled order ko koi
 * "delivered" bana dega aur reporting kharab ho jayegi.
 */
export const ORDER_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
}

function restock(order, actorId, reason) {
  order.items.forEach((item) => {
    const product = db.data.products.find((candidate) => candidate.id === item.productId)
    if (!product) return
    product.stock += item.quantity
    db.data.inventoryMovements.unshift({
      id: nextId('inv'),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'return',
      quantity: item.quantity,
      reason,
      balanceAfter: product.stock,
      createdBy: actorId,
      createdAt: new Date().toISOString(),
    })
  })
}

function applyOrderFilters(orders, params) {
  const search = params.get('search')
  const status = params.get('status')
  const paymentStatus = params.get('payment_status')
  const customerId = params.get('customer_id')
  const from = params.get('from')
  const to = params.get('to')

  return orders.filter((order) => {
    if (!matchesSearch(order, search, ['orderNumber', 'customerName', 'customerEmail'])) return false
    if (status && order.status !== status) return false
    if (paymentStatus && order.paymentStatus !== paymentStatus) return false
    if (customerId && order.customerId !== customerId) return false
    if (from && order.placedAt < from) return false
    if (to && order.placedAt > `${to}T23:59:59.999Z`) return false
    return true
  })
}

const summarize = (order) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  customerId: order.customerId,
  customerName: order.customerName,
  customerEmail: order.customerEmail,
  status: order.status,
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod,
  itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  grandTotal: order.grandTotal,
  currency: order.currency,
  placedAt: order.placedAt,
})

export const orderHandlers = [
  http.get(url('/orders'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.ORDERS_VIEW)
    if (response) return response

    const filtered = applyOrderFilters(db.data.orders, searchParams(request))
    const { rows, meta } = paginate(filtered, request, { defaultSort: '-placedAt' })

    const totals = {
      count: filtered.length,
      revenue: filtered
        .filter((order) => order.paymentStatus === 'paid')
        .reduce((sum, order) => sum + order.grandTotal, 0),
    }

    return ok({ items: rows.map(summarize), meta, totals })
  }),

  http.get(url('/orders/:id'), async ({ request, params }) => {
    await delay(latency())
    const { response } = guard(request, P.ORDERS_VIEW)
    if (response) return response

    const order = db.data.orders.find((candidate) => candidate.id === params.id)
    if (!order) return notFound('Order')

    const customer = db.data.customers.find((candidate) => candidate.id === order.customerId)
    return ok({
      order,
      customer: customer ?? null,
      allowedTransitions: ORDER_TRANSITIONS[order.status] ?? [],
    })
  }),

  http.patch(url('/orders/:id/status'), async ({ request, params }) => {
    await delay(latency())
    const { user, response } = guard(request, P.ORDERS_UPDATE)
    if (response) return response

    const order = db.data.orders.find((candidate) => candidate.id === params.id)
    if (!order) return notFound('Order')

    const { status, note } = await request.json()
    const allowed = ORDER_TRANSITIONS[order.status] ?? []
    if (!allowed.includes(status))
      return conflict(
        `"${order.status}" se "${status}" par nahi ja sakte. Allowed: ${allowed.join(', ') || 'koi nahi'}.`
      )

    const previousStatus = order.status
    order.status = status
    order.updatedAt = new Date().toISOString()
    order.timeline.push({
      status,
      note: note || null,
      at: order.updatedAt,
      by: `${user.firstName} ${user.lastName}`,
    })

    if (status === 'cancelled') {
      order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : 'unpaid'
      restock(order, user.id, `Order ${order.orderNumber} cancelled`)
    }

    db.commit()
    audit(user, 'order.status_changed', 'order', order.id, {
      orderNumber: order.orderNumber,
      from: previousStatus,
      to: status,
    })

    return ok({ order, allowedTransitions: ORDER_TRANSITIONS[order.status] ?? [] })
  }),

  http.post(url('/orders/:id/refund'), async ({ request, params }) => {
    await delay(latency())
    const { user, response } = guard(request, P.ORDERS_REFUND)
    if (response) return response

    const order = db.data.orders.find((candidate) => candidate.id === params.id)
    if (!order) return notFound('Order')
    if (order.paymentStatus !== 'paid') return conflict('Sirf paid orders refund ho sakte hain.')

    const { reason } = await request.json().catch(() => ({}))
    order.status = 'refunded'
    order.paymentStatus = 'refunded'
    order.updatedAt = new Date().toISOString()
    order.timeline.push({
      status: 'refunded',
      note: reason || 'Refund issued',
      at: order.updatedAt,
      by: `${user.firstName} ${user.lastName}`,
    })
    restock(order, user.id, `Refund for ${order.orderNumber}`)

    db.commit()
    audit(user, 'order.refunded', 'order', order.id, {
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      reason,
    })

    return ok({ order })
  }),

  // -------------------------------------------------------------------------
  // Storefront checkout
  // -------------------------------------------------------------------------
  http.post(url('/checkout'), async ({ request }) => {
    await delay(latency() + 400)
    const user = currentUser(request)
    if (!user) return unauthorized('Checkout ke liye login zaroori hai.')

    const body = await request.json()
    if (!body.items?.length)
      return badRequest('Cart khali hai.', { items: ['At least one item is required.'] })

    const errors = {}
    if (!body.shippingAddress?.line1?.trim()) errors['shippingAddress.line1'] = ['Address is required.']
    if (!body.shippingAddress?.city?.trim()) errors['shippingAddress.city'] = ['City is required.']
    if (!/^\d{5}$/.test(body.shippingAddress?.postalCode ?? ''))
      errors['shippingAddress.postalCode'] = ['Postal code must be 5 digits.']
    if (!body.shippingAddress?.country?.trim())
      errors['shippingAddress.country'] = ['Country is required.']
    if (Object.keys(errors).length) return badRequest('Shipping details adhoori hain.', errors)

    // Stock check pehle, mutation baad mein. Asli backend mein ye poora block
    // ek DB transaction ke andar hona chahiye (SELECT ... FOR UPDATE).
    const lines = []
    for (const line of body.items) {
      const product = db.data.products.find((candidate) => candidate.id === line.productId)
      if (!product || product.status !== 'active')
        return badRequest('Cart mein koi product ab available nahi hai.', {
          items: [`Product ${line.productId} unavailable.`],
        })
      const quantity = Number(line.quantity)
      if (!(quantity > 0))
        return badRequest('Quantity 1 se kam nahi ho sakti.', { items: ['Invalid quantity.'] })
      if (product.stock < quantity)
        return conflict(`"${product.name}" ka sirf ${product.stock} stock bacha hai.`)
      lines.push({ product, quantity })
    }

    const items = lines.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    }))

    // Paise hamesha server par calculate hote hain. Client se aaya hua total
    // kabhi trust na karein — warna koi bhi 1 rupay mein order kar lega.
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const taxTotal = Math.round(subtotal * (db.data.settings.taxRate / 100))
    const shippingTotal = subtotal >= db.data.settings.freeShippingThreshold ? 0 : 350
    const grandTotal = subtotal + taxTotal + shippingTotal

    let customer = db.data.customers.find((candidate) => candidate.userId === user.id)
    if (!customer) {
      customer = db.data.customers.find(
        (candidate) => candidate.email.toLowerCase() === user.email.toLowerCase()
      )
      if (customer) customer.userId = user.id
    }
    if (!customer) {
      customer = {
        id: nextId('cus'),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        company: null,
        status: 'active',
        notes: 'Checkout ke waqt auto-create hua.',
        address: body.shippingAddress,
        userId: user.id,
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      db.data.customers.unshift(customer)
    }

    const placedAt = new Date().toISOString()
    const order = {
      id: nextId('ord'),
      orderNumber: `NX-${10_240 + db.data.orders.length + 1}`,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      status: 'pending',
      paymentStatus: body.paymentMethod === 'card' ? 'paid' : 'unpaid',
      paymentMethod: body.paymentMethod ?? 'cash_on_delivery',
      items,
      subtotal,
      taxTotal,
      shippingTotal,
      discountTotal: 0,
      grandTotal,
      currency: db.data.settings.currency,
      shippingAddress: body.shippingAddress,
      placedAt,
      updatedAt: placedAt,
      timeline: [{ status: 'pending', note: 'Order placed', at: placedAt, by: 'storefront' }],
    }

    lines.forEach(({ product, quantity }) => {
      product.stock -= quantity
      db.data.inventoryMovements.unshift({
        id: nextId('inv'),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type: 'sale',
        quantity: -quantity,
        reason: `Order ${order.orderNumber}`,
        balanceAfter: product.stock,
        createdBy: user.id,
        createdAt: placedAt,
      })
    })

    db.data.orders.unshift(order)
    db.commit()
    audit(user, 'order.placed', 'order', order.id, {
      orderNumber: order.orderNumber,
      total: grandTotal,
    })

    return ok({ order }, 201)
  }),

  // -------------------------------------------------------------------------
  // Customer ke apne orders — permission nahi, ownership check chalta hai
  // -------------------------------------------------------------------------
  http.get(url('/account/orders'), async ({ request }) => {
    await delay(latency())
    const user = currentUser(request)
    if (!user) return unauthorized()

    const customerIds = db.data.customers
      .filter(
        (customer) =>
          customer.userId === user.id ||
          customer.email.toLowerCase() === user.email.toLowerCase()
      )
      .map((customer) => customer.id)

    const mine = db.data.orders.filter((order) => customerIds.includes(order.customerId))
    const { rows, meta } = paginate(mine, request, { defaultSort: '-placedAt' })
    return ok({ items: rows.map(summarize), meta })
  }),

  http.get(url('/account/orders/:id'), async ({ request, params }) => {
    await delay(latency())
    const user = currentUser(request)
    if (!user) return unauthorized()

    const order = db.data.orders.find((candidate) => candidate.id === params.id)
    if (!order) return notFound('Order')

    const customer = db.data.customers.find((candidate) => candidate.id === order.customerId)
    const owned =
      customer &&
      (customer.userId === user.id ||
        customer.email.toLowerCase() === user.email.toLowerCase())

    // Ownership check zaroori hai. Sirf ID guess karke doosre ka order dekh
    // lena "IDOR" kehlata hai — sabse aam API security bug.
    if (!owned) return notFound('Order')

    return ok({ order })
  }),
]
