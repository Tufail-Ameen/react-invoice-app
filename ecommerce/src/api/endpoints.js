import { del, get, patch, post } from '@/lib/apiClient'

/**
 * Har backend resource ka ek jagah mapping.
 * Jab aap asli backend banayein, sirf ye file dekh kar pata chal jayega ki
 * kaun kaun se routes banane hain.
 *
 * Register RTK Query se handle hota hai — dekhein `src/api/authApi.js`.
 */

export const authApi = {
  login: (body) => post('/auth/login', body),
  logout: (refreshToken) => post('/auth/logout', { refreshToken }),
  me: () => get('/auth/me'),
  updateProfile: (body) => patch('/auth/profile', body),
  changePassword: (body) => post('/auth/change-password', body),
  forgotPassword: (body) => post('/auth/forgot-password', body),
  resetPassword: (body) => post('/auth/reset-password', body),
}

export const productsApi = {
  list: (params) => get('/products', params),
  detail: (id) => get(`/products/${id}`),
  create: (body) => post('/products', body),
  update: ({ id, ...body }) => patch(`/products/${id}`, body),
  remove: (id) => del(`/products/${id}`),
}

export const categoriesApi = {
  list: () => get('/categories'),
  create: (body) => post('/categories', body),
  update: ({ id, ...body }) => patch(`/categories/${id}`, body),
  remove: (id) => del(`/categories/${id}`),
}

export const customersApi = {
  list: (params) => get('/customers', params),
  detail: (id) => get(`/customers/${id}`),
  create: (body) => post('/customers', body),
  update: ({ id, ...body }) => patch(`/customers/${id}`, body),
  remove: (id) => del(`/customers/${id}`),
}

export const ordersApi = {
  list: (params) => get('/orders', params),
  detail: (id) => get(`/orders/${id}`),
  updateStatus: ({ id, status, note }) => patch(`/orders/${id}/status`, { status, note }),
  refund: ({ id, reason }) => post(`/orders/${id}/refund`, { reason }),
}

export const usersApi = {
  list: (params) => get('/users', params),
  detail: (id) => get(`/users/${id}`),
  create: (body) => post('/users', body),
  update: ({ id, ...body }) => patch(`/users/${id}`, body),
  remove: (id) => del(`/users/${id}`),
}

export const rolesApi = {
  list: () => get('/roles'),
  create: (body) => post('/roles', body),
  update: ({ id, ...body }) => patch(`/roles/${id}`, body),
  remove: (id) => del(`/roles/${id}`),
}

export const inventoryApi = {
  list: (params) => get('/inventory', params),
  movements: (params) => get('/inventory/movements', params),
  adjust: (body) => post('/inventory/adjust', body),
}

export const dashboardApi = {
  summary: () => get('/dashboard/summary'),
}

export const auditApi = {
  list: (params) => get('/audit-logs', params),
}

export const settingsApi = {
  get: () => get('/settings'),
  update: (body) => patch('/settings', body),
}

export const storefrontApi = {
  products: (params) => get('/storefront/products', params),
  product: (slug) => get(`/storefront/products/${slug}`),
  categories: () => get('/storefront/categories'),
  checkout: (body) => post('/checkout', body),
  myOrders: (params) => get('/account/orders', params),
  myOrder: (id) => get(`/account/orders/${id}`),
}

/** TanStack Query cache keys — invalidation isi se hoti hai. */
export const queryKeys = {
  me: ['me'],
  products: (params) => ['products', params],
  product: (id) => ['product', id],
  categories: ['categories'],
  customers: (params) => ['customers', params],
  customer: (id) => ['customer', id],
  orders: (params) => ['orders', params],
  order: (id) => ['order', id],
  users: (params) => ['users', params],
  roles: ['roles'],
  inventory: (params) => ['inventory', params],
  inventoryMovements: (params) => ['inventory-movements', params],
  dashboard: ['dashboard'],
  auditLogs: (params) => ['audit-logs', params],
  settings: ['settings'],
  storefrontProducts: (params) => ['storefront-products', params],
  storefrontProduct: (slug) => ['storefront-product', slug],
  storefrontCategories: ['storefront-categories'],
  myOrders: (params) => ['my-orders', params],
  myOrder: (id) => ['my-order', id],
}
