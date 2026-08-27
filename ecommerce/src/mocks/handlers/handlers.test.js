import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { handlers } from './index'

/**
 * Mock backend ka contract test.
 *
 * Ye tests wahi cheezein check karte hain jo aapke asli backend mein bhi honi
 * chahiye: auth, RBAC, validation, pagination aur stock transactions.
 * Backend banane ke baad inhi ko apne API par chala kar compare kar sakte hain.
 */

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())
beforeEach(() => db.reset())

async function call(path, { token, ...init } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null }
}

async function login(email, password = 'Password123!') {
  const { body } = await call('/auth/login', { method: 'POST', body: { email, password } })
  return body.data.tokens.accessToken
}

describe('auth', () => {
  it('sahi credentials par user aur tokens deta hai', async () => {
    const { status, body } = await call('/auth/login', {
      method: 'POST',
      body: { email: 'owner@nexa.test', password: 'Password123!' },
    })

    expect(status).toBe(200)
    expect(body.data.user.email).toBe('owner@nexa.test')
    expect(body.data.tokens.accessToken).toBeTruthy()
    expect(body.data.tokens.refreshToken).toBeTruthy()
    expect(body.data.user.permissions).toContain('*')
  })

  it('ghalat password par 401 deta hai aur user enumeration leak nahi karta', async () => {
    const wrongPassword = await call('/auth/login', {
      method: 'POST',
      body: { email: 'owner@nexa.test', password: 'nope' },
    })
    const unknownEmail = await call('/auth/login', {
      method: 'POST',
      body: { email: 'nobody@nexa.test', password: 'nope' },
    })

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message)
  })

  it('suspended account ko login nahi karne deta', async () => {
    const { status } = await call('/auth/login', {
      method: 'POST',
      body: { email: 'suspended@nexa.test', password: 'Password123!' },
    })
    expect(status).toBe(401)
  })

  it('register par customer role aur customer record banata hai', async () => {
    const before = db.data.customers.length
    const { status, body } = await call('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Nayi',
        lastName: 'User',
        email: 'nayi@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      },
    })

    expect(status).toBe(201)
    expect(body.data.user.role.slug).toBe('customer')
    expect(db.data.customers.length).toBe(before + 1)
  })

  it('duplicate email par 409 deta hai', async () => {
    const { status } = await call('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Koi',
        lastName: 'Aur',
        email: 'owner@nexa.test',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      },
    })
    expect(status).toBe(409)
  })

  it('refresh token rotate karta hai aur purana mar jata hai', async () => {
    const { body } = await call('/auth/login', {
      method: 'POST',
      body: { email: 'owner@nexa.test', password: 'Password123!' },
    })
    const oldRefresh = body.data.tokens.refreshToken

    const first = await call('/auth/refresh', { method: 'POST', body: { refreshToken: oldRefresh } })
    expect(first.status).toBe(200)

    const replay = await call('/auth/refresh', { method: 'POST', body: { refreshToken: oldRefresh } })
    expect(replay.status).toBe(401)
  })

  it('token ke baghair protected route 401 deta hai', async () => {
    const { status } = await call('/products')
    expect(status).toBe(401)
  })
})

describe('rbac', () => {
  it('staff products dekh sakta hai lekin bana nahi sakta', async () => {
    const token = await login('staff@nexa.test')

    const read = await call('/products', { token })
    expect(read.status).toBe(200)

    const write = await call('/products', {
      token,
      method: 'POST',
      body: { name: 'Test', sku: 'T-1', categoryId: 'cat_01', price: 100, stock: 1 },
    })
    expect(write.status).toBe(403)
    expect(write.body.error.code).toBe('FORBIDDEN')
  })

  it('customer ko admin endpoints par 403 milta hai', async () => {
    const token = await login('customer@nexa.test')
    expect((await call('/orders', { token })).status).toBe(403)
    expect((await call('/users', { token })).status).toBe(403)
    expect((await call('/dashboard/summary', { token })).status).toBe(403)
  })

  it('manager roles manage nahi kar sakta', async () => {
    const token = await login('manager@nexa.test')
    const { status } = await call('/roles/role_staff', {
      token,
      method: 'PATCH',
      body: { permissions: [] },
    })
    expect(status).toBe(403)
  })

  it('non-super-admin doosra super admin nahi bana sakta', async () => {
    const token = await login('admin@nexa.test')
    const { status } = await call('/users', {
      token,
      method: 'POST',
      body: {
        firstName: 'Sneaky',
        lastName: 'User',
        email: 'sneaky@nexa.test',
        password: 'Password123!',
        roleId: 'role_super_admin',
      },
    })
    expect(status).toBe(403)
  })

  it('super admin ki permissions lock hain', async () => {
    const token = await login('owner@nexa.test')
    const { status } = await call('/roles/role_super_admin', {
      token,
      method: 'PATCH',
      body: { permissions: [] },
    })
    expect(status).toBe(403)
  })
})

describe('customers', () => {
  it('add kiya hua customer foran list mein aata hai', async () => {
    const token = await login('admin@nexa.test')

    const created = await call('/customers', {
      token,
      method: 'POST',
      body: {
        firstName: 'Tufail',
        lastName: 'Traders',
        email: 'tufail@example.com',
        phone: '+92 300 1112233',
        status: 'active',
        address: { line1: 'Ravi Road', city: 'Lahore', postalCode: '54000', country: 'Pakistan' },
      },
    })
    expect(created.status).toBe(201)

    const list = await call('/customers?search=tufail', { token })
    expect(list.status).toBe(200)
    expect(list.body.data.items.some((item) => item.email === 'tufail@example.com')).toBe(true)
  })

  it('validation errors field-wise wapas karta hai', async () => {
    const token = await login('admin@nexa.test')
    const { status, body } = await call('/customers', {
      token,
      method: 'POST',
      body: { firstName: '', lastName: 'X', email: 'not-an-email' },
    })

    expect(status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details.firstName).toBeTruthy()
    expect(body.error.details.email).toBeTruthy()
  })

  it('duplicate email reject karta hai', async () => {
    const token = await login('admin@nexa.test')
    const { status, body } = await call('/customers', {
      token,
      method: 'POST',
      body: { firstName: 'Copy', lastName: 'Cat', email: 'customer@nexa.test' },
    })
    expect(status).toBe(400)
    expect(body.error.details.email).toBeTruthy()
  })

  it('jis customer ke orders hain use delete nahi karta', async () => {
    const token = await login('admin@nexa.test')
    const withOrders = db.data.orders[0].customerId
    const { status } = await call(`/customers/${withOrders}`, { token, method: 'DELETE' })
    expect(status).toBe(409)
  })
})

describe('list queries', () => {
  it('pagination meta sahi deta hai', async () => {
    const token = await login('admin@nexa.test')
    const { body } = await call('/products?page=2&per_page=5', { token })

    expect(body.data.meta.page).toBe(2)
    expect(body.data.meta.perPage).toBe(5)
    expect(body.data.items.length).toBeLessThanOrEqual(5)
    expect(body.data.meta.total).toBe(db.data.products.length)
  })

  it('sort descending kaam karta hai', async () => {
    const token = await login('admin@nexa.test')
    const { body } = await call('/products?sort=-price&per_page=50', { token })
    const prices = body.data.items.map((item) => item.price)
    expect(prices).toEqual([...prices].sort((a, b) => b - a))
  })

  it('filters combine hote hain', async () => {
    const token = await login('admin@nexa.test')
    const { body } = await call('/products?status=active&stock=out&per_page=50', { token })
    body.data.items.forEach((item) => {
      expect(item.status).toBe('active')
      expect(item.stock).toBe(0)
    })
  })

  it('storefront sirf active products dikhata hai aur token nahi maangta', async () => {
    const { status, body } = await call('/storefront/products?per_page=50')
    expect(status).toBe(200)
    body.data.items.forEach((item) => expect(item.status).toBe('active'))
  })
})

describe('checkout aur stock', () => {
  it('order banata hai, stock ghatata hai aur totals server par calculate karta hai', async () => {
    const token = await login('customer@nexa.test')
    const product = db.data.products.find((item) => item.status === 'active' && item.stock > 5)
    const stockBefore = product.stock

    const { status, body } = await call('/checkout', {
      token,
      method: 'POST',
      body: {
        items: [{ productId: product.id, quantity: 2, unitPrice: 1 }],
        shippingAddress: {
          line1: 'House 1',
          city: 'Lahore',
          postalCode: '54000',
          country: 'Pakistan',
        },
        paymentMethod: 'card',
      },
    })

    expect(status).toBe(201)
    // Client ne unitPrice 1 bheja tha — server ne ignore kiya.
    expect(body.data.order.items[0].unitPrice).toBe(product.price)
    expect(body.data.order.subtotal).toBe(product.price * 2)
    expect(db.data.products.find((item) => item.id === product.id).stock).toBe(stockBefore - 2)
  })

  it('stock se zyada quantity par 409 deta hai aur stock nahi chhoota', async () => {
    const token = await login('customer@nexa.test')
    const product = db.data.products.find((item) => item.status === 'active' && item.stock > 0)
    const stockBefore = product.stock

    const { status } = await call('/checkout', {
      token,
      method: 'POST',
      body: {
        items: [{ productId: product.id, quantity: stockBefore + 100 }],
        shippingAddress: {
          line1: 'House 1',
          city: 'Lahore',
          postalCode: '54000',
          country: 'Pakistan',
        },
      },
    })

    expect(status).toBe(409)
    expect(db.data.products.find((item) => item.id === product.id).stock).toBe(stockBefore)
  })

  it('login ke baghair checkout 401 deta hai', async () => {
    const { status } = await call('/checkout', {
      method: 'POST',
      body: { items: [{ productId: 'prd_01', quantity: 1 }] },
    })
    expect(status).toBe(401)
  })

  it('adhoori shipping details par 400 aur field errors deta hai', async () => {
    const token = await login('customer@nexa.test')
    const { status, body } = await call('/checkout', {
      token,
      method: 'POST',
      body: {
        items: [{ productId: 'prd_01', quantity: 1 }],
        shippingAddress: { line1: '', city: '', postalCode: 'abc', country: '' },
      },
    })
    expect(status).toBe(400)
    expect(body.error.details['shippingAddress.postalCode']).toBeTruthy()
  })
})

describe('order state machine', () => {
  it('ghalat transition reject karta hai', async () => {
    const token = await login('admin@nexa.test')
    const delivered = db.data.orders.find((order) => order.status === 'delivered')

    const { status } = await call(`/orders/${delivered.id}/status`, {
      token,
      method: 'PATCH',
      body: { status: 'pending' },
    })
    expect(status).toBe(409)
  })

  it('valid transition allow karta hai aur timeline mein likhta hai', async () => {
    const token = await login('admin@nexa.test')
    const pending = db.data.orders.find((order) => order.status === 'pending')

    const { status, body } = await call(`/orders/${pending.id}/status`, {
      token,
      method: 'PATCH',
      body: { status: 'processing', note: 'Packing shuru' },
    })

    expect(status).toBe(200)
    expect(body.data.order.status).toBe('processing')
    expect(body.data.order.timeline.at(-1).note).toBe('Packing shuru')
  })

  it('cancel karne par stock wapas add hota hai', async () => {
    const token = await login('admin@nexa.test')
    const pending = db.data.orders.find((order) => order.status === 'pending')
    const line = pending.items[0]
    const stockBefore = db.data.products.find((item) => item.id === line.productId).stock

    await call(`/orders/${pending.id}/status`, {
      token,
      method: 'PATCH',
      body: { status: 'cancelled' },
    })

    expect(db.data.products.find((item) => item.id === line.productId).stock).toBe(
      stockBefore + line.quantity
    )
  })
})

describe('ownership checks', () => {
  it('customer doosre ka order nahi dekh sakta (IDOR)', async () => {
    const token = await login('customer@nexa.test')
    const mineIds = db.data.customers
      .filter((customer) => customer.email === 'customer@nexa.test')
      .map((customer) => customer.id)
    const someoneElse = db.data.orders.find((order) => !mineIds.includes(order.customerId))

    const { status } = await call(`/account/orders/${someoneElse.id}`, { token })
    expect(status).toBe(404)
  })
})

describe('inventory', () => {
  it('adjustment stock badalta hai aur movement likhta hai', async () => {
    const token = await login('manager@nexa.test')
    const product = db.data.products[0]
    const before = product.stock

    const { status } = await call('/inventory/adjust', {
      token,
      method: 'POST',
      body: { productId: product.id, quantity: 15, reason: 'Supplier delivery' },
    })

    expect(status).toBe(201)
    expect(db.data.products.find((item) => item.id === product.id).stock).toBe(before + 15)
    expect(db.data.inventoryMovements[0].reason).toBe('Supplier delivery')
  })

  it('stock ko manfi nahi hone deta', async () => {
    const token = await login('manager@nexa.test')
    const product = db.data.products[0]

    const { status } = await call('/inventory/adjust', {
      token,
      method: 'POST',
      body: { productId: product.id, quantity: -(product.stock + 50), reason: 'Test' },
    })
    expect(status).toBe(400)
  })

  it('wajah likhe baghair adjustment nahi hoti', async () => {
    const token = await login('manager@nexa.test')
    const { status } = await call('/inventory/adjust', {
      token,
      method: 'POST',
      body: { productId: db.data.products[0].id, quantity: 5, reason: '  ' },
    })
    expect(status).toBe(400)
  })
})

describe('audit log', () => {
  it('har mutation record karta hai', async () => {
    const token = await login('admin@nexa.test')
    await call('/customers', {
      token,
      method: 'POST',
      body: { firstName: 'Audit', lastName: 'Test', email: 'audit@example.com' },
    })

    const { body } = await call('/audit-logs?action=customer.created', { token })
    expect(body.data.items.length).toBeGreaterThan(0)
    expect(body.data.items[0].actorName).toBe('Hina Farooq')
  })
})
