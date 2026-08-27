import { delay, http } from 'msw'
import { PERMISSIONS as P } from '@/lib/permissions'
import { db, nextId } from '../db'
import {
  audit,
  badRequest,
  guard,
  latency,
  matchesSearch,
  notFound,
  ok,
  paginate,
  searchParams,
  url,
} from '../http'

const REVENUE_STATUSES = ['paid']

export const systemHandlers = [
  // -------------------------------------------------------------------------
  // Dashboard — asli backend mein ye aggregate SQL queries hongi
  // -------------------------------------------------------------------------
  http.get(url('/dashboard/summary'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.DASHBOARD_VIEW)
    if (response) return response

    const orders = db.data.orders
    const paid = orders.filter((order) => REVENUE_STATUSES.includes(order.paymentStatus))
    const revenue = paid.reduce((sum, order) => sum + order.grandTotal, 0)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString()

    const currentWindow = paid.filter((order) => order.placedAt >= thirtyDaysAgo)
    const previousWindow = paid.filter(
      (order) => order.placedAt >= sixtyDaysAgo && order.placedAt < thirtyDaysAgo
    )
    const currentRevenue = currentWindow.reduce((sum, order) => sum + order.grandTotal, 0)
    const previousRevenue = previousWindow.reduce((sum, order) => sum + order.grandTotal, 0)
    const change = previousRevenue
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : null

    const productSales = new Map()
    paid.forEach((order) => {
      order.items.forEach((item) => {
        const entry = productSales.get(item.productId) ?? {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          unitsSold: 0,
          revenue: 0,
        }
        entry.unitsSold += item.quantity
        entry.revenue += item.lineTotal
        productSales.set(item.productId, entry)
      })
    })

    const revenueByDay = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(Date.now() - (13 - index) * 86_400_000)
      const key = date.toISOString().slice(0, 10)
      const dayOrders = paid.filter((order) => order.placedAt.slice(0, 10) === key)
      return {
        date: key,
        revenue: dayOrders.reduce((sum, order) => sum + order.grandTotal, 0),
        orders: dayOrders.length,
      }
    })

    const ordersByStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map(
      (status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
      })
    )

    return ok({
      kpis: {
        revenue,
        revenueChangePercent: change,
        orders: orders.length,
        customers: db.data.customers.length,
        products: db.data.products.filter((product) => product.status === 'active').length,
        averageOrderValue: paid.length ? Math.round(revenue / paid.length) : 0,
        pendingOrders: orders.filter((order) => order.status === 'pending').length,
        lowStockCount: db.data.products.filter(
          (product) => product.stock <= product.lowStockThreshold
        ).length,
      },
      revenueByDay,
      ordersByStatus,
      topProducts: [...productSales.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      recentOrders: [...orders]
        .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
        .slice(0, 6)
        .map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          grandTotal: order.grandTotal,
          currency: order.currency,
          placedAt: order.placedAt,
        })),
      lowStockProducts: db.data.products
        .filter((product) => product.stock <= product.lowStockThreshold)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6)
        .map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
        })),
    })
  }),

  // -------------------------------------------------------------------------
  // Inventory
  // -------------------------------------------------------------------------
  http.get(url('/inventory'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.INVENTORY_VIEW)
    if (response) return response

    const params = searchParams(request)
    const search = params.get('search')
    const state = params.get('state')

    const rowsAll = db.data.products
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        status: product.status,
        stockValue: (product.cost ?? 0) * product.stock,
        state:
          product.stock <= 0
            ? 'out'
            : product.stock <= product.lowStockThreshold
              ? 'low'
              : 'healthy',
        updatedAt: product.updatedAt,
      }))
      .filter((row) => {
        if (!matchesSearch(row, search, ['name', 'sku'])) return false
        if (state && row.state !== state) return false
        return true
      })

    const { rows, meta } = paginate(rowsAll, request, { defaultSort: 'stock' })

    return ok({
      items: rows,
      meta,
      summary: {
        totalUnits: db.data.products.reduce((sum, product) => sum + product.stock, 0),
        stockValue: db.data.products.reduce(
          (sum, product) => sum + (product.cost ?? 0) * product.stock,
          0
        ),
        outOfStock: db.data.products.filter((product) => product.stock <= 0).length,
        lowStock: db.data.products.filter(
          (product) => product.stock > 0 && product.stock <= product.lowStockThreshold
        ).length,
      },
    })
  }),

  http.get(url('/inventory/movements'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.INVENTORY_VIEW)
    if (response) return response

    const params = searchParams(request)
    const productId = params.get('product_id')
    const type = params.get('type')

    const filtered = db.data.inventoryMovements.filter((movement) => {
      if (productId && movement.productId !== productId) return false
      if (type && movement.type !== type) return false
      if (!matchesSearch(movement, params.get('search'), ['productName', 'sku', 'reason']))
        return false
      return true
    })

    const { rows, meta } = paginate(filtered, request, { defaultSort: '-createdAt' })
    return ok({ items: rows, meta })
  }),

  http.post(url('/inventory/adjust'), async ({ request }) => {
    await delay(latency())
    const { user, response } = guard(request, P.INVENTORY_ADJUST)
    if (response) return response

    const body = await request.json()
    const product = db.data.products.find((candidate) => candidate.id === body.productId)
    if (!product) return notFound('Product')

    const quantity = Number(body.quantity)
    if (!Number.isInteger(quantity) || quantity === 0)
      return badRequest('Quantity poora number hona chahiye aur 0 nahi.', {
        quantity: ['Enter a non-zero whole number.'],
      })
    if (product.stock + quantity < 0)
      return badRequest(`Stock manfi nahi ho sakta. Abhi ${product.stock} units hain.`, {
        quantity: [`Cannot remove more than ${product.stock} units.`],
      })
    if (!body.reason?.trim())
      return badRequest('Adjustment ki wajah likhna zaroori hai.', {
        reason: ['Reason is required.'],
      })

    product.stock += quantity
    product.updatedAt = new Date().toISOString()

    const movement = {
      id: nextId('inv'),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'adjustment',
      quantity,
      reason: body.reason.trim(),
      balanceAfter: product.stock,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    }
    db.data.inventoryMovements.unshift(movement)
    db.commit()
    audit(user, 'inventory.adjusted', 'product', product.id, {
      name: product.name,
      quantity,
      balanceAfter: product.stock,
    })

    return ok({ movement, product: { id: product.id, stock: product.stock } }, 201)
  }),

  // -------------------------------------------------------------------------
  // Audit log
  // -------------------------------------------------------------------------
  http.get(url('/audit-logs'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.AUDIT_VIEW)
    if (response) return response

    const params = searchParams(request)
    const action = params.get('action')
    const resourceType = params.get('resource_type')

    const filtered = db.data.auditLogs.filter((log) => {
      if (action && log.action !== action) return false
      if (resourceType && log.resourceType !== resourceType) return false
      if (!matchesSearch(log, params.get('search'), ['actorName', 'action', 'resourceType']))
        return false
      return true
    })

    const { rows, meta } = paginate(filtered, request, { defaultSort: '-createdAt' })
    return ok({
      items: rows,
      meta,
      facets: {
        actions: [...new Set(db.data.auditLogs.map((log) => log.action))].sort(),
        resourceTypes: [...new Set(db.data.auditLogs.map((log) => log.resourceType))].sort(),
      },
    })
  }),

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------
  http.get(url('/settings'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.SETTINGS_MANAGE)
    if (response) return response
    return ok({ settings: db.data.settings })
  }),

  http.patch(url('/settings'), async ({ request }) => {
    await delay(latency())
    const { user, response } = guard(request, P.SETTINGS_MANAGE)
    if (response) return response

    const body = await request.json()
    if (body.taxRate !== undefined && (body.taxRate < 0 || body.taxRate > 100))
      return badRequest('Tax rate 0 se 100 ke darmiyan honi chahiye.', {
        taxRate: ['Must be between 0 and 100.'],
      })

    Object.assign(db.data.settings, body)
    db.commit()
    audit(user, 'settings.updated', 'settings', null, body)
    return ok({ settings: db.data.settings })
  }),

  // Demo data wapas seed karne ke liye — asli backend mein aisa endpoint mat rakhein.
  http.post(url('/dev/reset'), async () => {
    await delay(200)
    db.reset()
    return ok({ message: 'Mock database reset ho gaya.' })
  }),
]
