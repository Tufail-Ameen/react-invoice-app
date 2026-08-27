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
  slugify,
  url,
} from '../http'

function withCategory(product) {
  const category = db.data.categories.find((candidate) => candidate.id === product.categoryId)
  return {
    ...product,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    inStock: product.stock > 0,
    lowStock: product.stock > 0 && product.stock <= product.lowStockThreshold,
    margin: product.cost ? Math.round(((product.price - product.cost) / product.price) * 100) : null,
  }
}

function validateProduct(body, { productId } = {}) {
  const errors = {}
  if (!body.name?.trim()) errors.name = ['Product name is required.']
  if (!body.sku?.trim()) errors.sku = ['SKU is required.']
  if (!body.categoryId) errors.categoryId = ['Category is required.']
  if (!(Number(body.price) > 0)) errors.price = ['Price must be greater than 0.']
  if (Number(body.stock) < 0 || Number.isNaN(Number(body.stock)))
    errors.stock = ['Stock cannot be negative.']
  if (body.compareAtPrice && Number(body.compareAtPrice) <= Number(body.price))
    errors.compareAtPrice = ['Compare-at price must be higher than the selling price.']

  const duplicateSku = db.data.products.find(
    (product) =>
      product.sku.toLowerCase() === String(body.sku ?? '').toLowerCase().trim() &&
      product.id !== productId
  )
  if (duplicateSku) errors.sku = ['Ye SKU pehle se istemal ho raha hai.']

  return errors
}

function applyProductFilters(products, params) {
  const search = params.get('search')
  const status = params.get('status')
  const categoryId = params.get('category_id')
  const stockState = params.get('stock')
  const minPrice = Number(params.get('min_price'))
  const maxPrice = Number(params.get('max_price'))

  return products.filter((product) => {
    if (!matchesSearch(product, search, ['name', 'sku', 'description'])) return false
    if (status && product.status !== status) return false
    if (categoryId && product.categoryId !== categoryId) return false
    if (stockState === 'out' && product.stock > 0) return false
    if (stockState === 'low' && !(product.stock > 0 && product.stock <= product.lowStockThreshold))
      return false
    if (stockState === 'in' && product.stock <= 0) return false
    if (minPrice && product.price < minPrice) return false
    if (maxPrice && product.price > maxPrice) return false
    return true
  })
}

export const catalogHandlers = [
  // -------------------------------------------------------------------------
  // Public storefront — koi token nahi chahiye, sirf `active` products dikhte hain
  // -------------------------------------------------------------------------
  http.get(url('/storefront/products'), async ({ request }) => {
    await delay(latency())
    const params = searchParams(request)
    const visible = db.data.products.filter((product) => product.status === 'active')
    const filtered = applyProductFilters(visible, params)
    const { rows, meta } = paginate(filtered, request, { defaultSort: '-createdAt' })
    return ok({ items: rows.map(withCategory), meta })
  }),

  http.get(url('/storefront/products/:slug'), async ({ params }) => {
    await delay(latency())
    const product = db.data.products.find(
      (candidate) => candidate.slug === params.slug && candidate.status === 'active'
    )
    if (!product) return notFound('Product')

    const related = db.data.products
      .filter(
        (candidate) =>
          candidate.categoryId === product.categoryId &&
          candidate.id !== product.id &&
          candidate.status === 'active'
      )
      .slice(0, 4)

    return ok({ product: withCategory(product), related: related.map(withCategory) })
  }),

  http.get(url('/storefront/categories'), async () => {
    await delay(latency())
    const categories = db.data.categories.map((category) => ({
      ...category,
      productCount: db.data.products.filter(
        (product) => product.categoryId === category.id && product.status === 'active'
      ).length,
    }))
    return ok({ items: categories })
  }),

  // -------------------------------------------------------------------------
  // Admin products
  // -------------------------------------------------------------------------
  http.get(url('/products'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.PRODUCTS_VIEW)
    if (response) return response

    const filtered = applyProductFilters(db.data.products, searchParams(request))
    const { rows, meta } = paginate(filtered, request, { defaultSort: '-createdAt' })
    return ok({ items: rows.map(withCategory), meta })
  }),

  http.get(url('/products/:id'), async ({ request, params }) => {
    await delay(latency())
    const { response } = guard(request, P.PRODUCTS_VIEW)
    if (response) return response

    const product = db.data.products.find((candidate) => candidate.id === params.id)
    if (!product) return notFound('Product')
    return ok({ product: withCategory(product) })
  }),

  http.post(url('/products'), async ({ request }) => {
    await delay(latency())
    const { user, response } = guard(request, P.PRODUCTS_CREATE)
    if (response) return response

    const body = await request.json()
    const errors = validateProduct(body)
    if (Object.keys(errors).length) return badRequest('Product save nahi ho saka.', errors)

    const product = {
      id: nextId('prd'),
      name: body.name.trim(),
      slug: slugify(body.name),
      sku: body.sku.trim().toUpperCase(),
      description: body.description ?? '',
      categoryId: body.categoryId,
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      cost: body.cost ? Number(body.cost) : null,
      stock: Number(body.stock) || 0,
      lowStockThreshold: Number(body.lowStockThreshold) || 10,
      status: body.status ?? 'draft',
      imageUrl: body.imageUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.data.products.unshift(product)

    if (product.stock > 0) {
      db.data.inventoryMovements.unshift({
        id: nextId('inv'),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type: 'purchase',
        quantity: product.stock,
        reason: 'Initial stock on product create',
        balanceAfter: product.stock,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      })
    }

    db.commit()
    audit(user, 'product.created', 'product', product.id, { name: product.name })
    return ok({ product: withCategory(product) }, 201)
  }),

  http.patch(url('/products/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user, response } = guard(request, P.PRODUCTS_UPDATE)
    if (response) return response

    const product = db.data.products.find((candidate) => candidate.id === params.id)
    if (!product) return notFound('Product')

    const body = await request.json()
    const errors = validateProduct({ ...product, ...body }, { productId: product.id })
    if (Object.keys(errors).length) return badRequest('Product update nahi ho saka.', errors)

    Object.assign(product, {
      name: body.name?.trim() ?? product.name,
      slug: body.name ? slugify(body.name) : product.slug,
      sku: body.sku?.trim().toUpperCase() ?? product.sku,
      description: body.description ?? product.description,
      categoryId: body.categoryId ?? product.categoryId,
      price: body.price !== undefined ? Number(body.price) : product.price,
      compareAtPrice:
        body.compareAtPrice !== undefined
          ? body.compareAtPrice
            ? Number(body.compareAtPrice)
            : null
          : product.compareAtPrice,
      cost: body.cost !== undefined ? (body.cost ? Number(body.cost) : null) : product.cost,
      stock: body.stock !== undefined ? Number(body.stock) : product.stock,
      lowStockThreshold:
        body.lowStockThreshold !== undefined
          ? Number(body.lowStockThreshold)
          : product.lowStockThreshold,
      status: body.status ?? product.status,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : product.imageUrl,
      updatedAt: new Date().toISOString(),
    })

    db.commit()
    audit(user, 'product.updated', 'product', product.id, { name: product.name })
    return ok({ product: withCategory(product) })
  }),

  http.delete(url('/products/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user, response } = guard(request, P.PRODUCTS_DELETE)
    if (response) return response

    const product = db.data.products.find((candidate) => candidate.id === params.id)
    if (!product) return notFound('Product')

    // Jis product par order lag chuka hai use delete karna history tor deta hai.
    const usedInOrder = db.data.orders.some((order) =>
      order.items.some((item) => item.productId === product.id)
    )
    if (usedInOrder)
      return conflict(
        'Ye product kisi order mein istemal ho chuka hai. Delete ke bajaye "Archived" kar dein.'
      )

    db.data.products = db.data.products.filter((candidate) => candidate.id !== product.id)
    db.commit()
    audit(user, 'product.deleted', 'product', product.id, { name: product.name })
    return noContent()
  }),

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------
  http.get(url('/categories'), async ({ request }) => {
    await delay(latency())
    const { response } = guard(request, P.CATEGORIES_VIEW)
    if (response) return response

    const items = db.data.categories.map((category) => ({
      ...category,
      productCount: db.data.products.filter((product) => product.categoryId === category.id).length,
    }))
    return ok({ items })
  }),

  http.post(url('/categories'), async ({ request }) => {
    await delay(latency())
    const { user, response } = guard(request, P.CATEGORIES_MANAGE)
    if (response) return response

    const body = await request.json()
    if (!body.name?.trim())
      return badRequest('Category name required hai.', { name: ['Name is required.'] })

    const slug = slugify(body.name)
    if (db.data.categories.some((category) => category.slug === slug))
      return conflict('Is naam ki category pehle se mojood hai.')

    const category = {
      id: nextId('cat'),
      name: body.name.trim(),
      slug,
      description: body.description ?? '',
      createdAt: new Date().toISOString(),
    }
    db.data.categories.push(category)
    db.commit()
    audit(user, 'category.created', 'category', category.id, { name: category.name })
    return ok({ category: { ...category, productCount: 0 } }, 201)
  }),

  http.patch(url('/categories/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user, response } = guard(request, P.CATEGORIES_MANAGE)
    if (response) return response

    const category = db.data.categories.find((candidate) => candidate.id === params.id)
    if (!category) return notFound('Category')

    const body = await request.json()
    if (body.name !== undefined) {
      if (!body.name.trim())
        return badRequest('Category name required hai.', { name: ['Name is required.'] })
      category.name = body.name.trim()
      category.slug = slugify(body.name)
    }
    if (body.description !== undefined) category.description = body.description

    db.commit()
    audit(user, 'category.updated', 'category', category.id, { name: category.name })
    return ok({ category })
  }),

  http.delete(url('/categories/:id'), async ({ request, params }) => {
    await delay(latency())
    const { user, response } = guard(request, P.CATEGORIES_MANAGE)
    if (response) return response

    const category = db.data.categories.find((candidate) => candidate.id === params.id)
    if (!category) return notFound('Category')

    const productCount = db.data.products.filter(
      (product) => product.categoryId === category.id
    ).length
    if (productCount > 0)
      return conflict(`Is category mein ${productCount} products hain. Pehle unhe move karein.`)

    db.data.categories = db.data.categories.filter((candidate) => candidate.id !== category.id)
    db.commit()
    audit(user, 'category.deleted', 'category', category.id, { name: category.name })
    return noContent()
  }),
]
