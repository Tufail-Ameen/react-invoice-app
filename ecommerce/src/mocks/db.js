import { ALL_PERMISSIONS, PERMISSIONS as P } from '@/lib/permissions'

/**
 * Browser ke andar chalne wala fake database.
 *
 * Yahan jo tables (arrays) hain, wahi aapke asli database ki tables banengi.
 * `docs/DATA_MODEL.md` mein inka SQL schema likha hua hai.
 */

const STORAGE_KEY = 'nexa.mock.db.v1'

const now = Date.now()
const day = 86_400_000
const daysAgo = (n) => new Date(now - n * day).toISOString()

const ROLE_SEED = [
  {
    id: 'role_super_admin',
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Har cheez ka mukammal access. Delete nahi kiya ja sakta.',
    isSystem: true,
    permissions: ['*'],
  },
  {
    id: 'role_admin',
    name: 'Admin',
    slug: 'admin',
    description: 'Store chalane ka poora access, magar roles badal nahi sakta.',
    isSystem: true,
    permissions: ALL_PERMISSIONS.filter(
      (permission) => permission !== P.ROLES_MANAGE && permission !== P.SETTINGS_MANAGE
    ),
  },
  {
    id: 'role_manager',
    name: 'Store Manager',
    slug: 'manager',
    description: 'Catalog, orders, customers aur inventory sambhalta hai.',
    isSystem: false,
    permissions: [
      P.DASHBOARD_VIEW,
      P.PRODUCTS_VIEW,
      P.PRODUCTS_CREATE,
      P.PRODUCTS_UPDATE,
      P.CATEGORIES_VIEW,
      P.CATEGORIES_MANAGE,
      P.CUSTOMERS_VIEW,
      P.CUSTOMERS_CREATE,
      P.CUSTOMERS_UPDATE,
      P.ORDERS_VIEW,
      P.ORDERS_UPDATE,
      P.INVENTORY_VIEW,
      P.INVENTORY_ADJUST,
      P.REPORTS_VIEW,
    ],
  },
  {
    id: 'role_staff',
    name: 'Support Staff',
    slug: 'staff',
    description: 'Sirf dekh sakta hai aur order status badal sakta hai.',
    isSystem: false,
    permissions: [
      P.DASHBOARD_VIEW,
      P.PRODUCTS_VIEW,
      P.CATEGORIES_VIEW,
      P.CUSTOMERS_VIEW,
      P.ORDERS_VIEW,
      P.ORDERS_UPDATE,
      P.INVENTORY_VIEW,
    ],
  },
  {
    id: 'role_customer',
    name: 'Customer',
    slug: 'customer',
    description: 'Sirf storefront — apne orders aur profile.',
    isSystem: true,
    permissions: [],
  },
]

const USER_SEED = [
  {
    id: 'usr_01',
    firstName: 'Zain',
    lastName: 'Ahmed',
    email: 'owner@nexa.test',
    password: 'Password123!',
    phone: '+92 300 1234567',
    roleId: 'role_super_admin',
    status: 'active',
    emailVerifiedAt: daysAgo(180),
    lastLoginAt: daysAgo(0),
    createdAt: daysAgo(180),
  },
  {
    id: 'usr_02',
    firstName: 'Hina',
    lastName: 'Farooq',
    email: 'admin@nexa.test',
    password: 'Password123!',
    phone: '+92 301 7654321',
    roleId: 'role_admin',
    status: 'active',
    emailVerifiedAt: daysAgo(150),
    lastLoginAt: daysAgo(1),
    createdAt: daysAgo(150),
  },
  {
    id: 'usr_03',
    firstName: 'Bilal',
    lastName: 'Rana',
    email: 'manager@nexa.test',
    password: 'Password123!',
    phone: '+92 302 5556677',
    roleId: 'role_manager',
    status: 'active',
    emailVerifiedAt: daysAgo(90),
    lastLoginAt: daysAgo(2),
    createdAt: daysAgo(90),
  },
  {
    id: 'usr_04',
    firstName: 'Ayesha',
    lastName: 'Khan',
    email: 'staff@nexa.test',
    password: 'Password123!',
    phone: '+92 303 9998877',
    roleId: 'role_staff',
    status: 'active',
    emailVerifiedAt: daysAgo(45),
    lastLoginAt: daysAgo(5),
    createdAt: daysAgo(45),
  },
  {
    id: 'usr_05',
    firstName: 'Usman',
    lastName: 'Tariq',
    email: 'customer@nexa.test',
    password: 'Password123!',
    phone: '+92 304 1112233',
    roleId: 'role_customer',
    status: 'active',
    emailVerifiedAt: daysAgo(30),
    lastLoginAt: daysAgo(3),
    createdAt: daysAgo(30),
  },
  {
    id: 'usr_06',
    firstName: 'Sana',
    lastName: 'Iqbal',
    email: 'suspended@nexa.test',
    password: 'Password123!',
    phone: '+92 305 4445566',
    roleId: 'role_staff',
    status: 'suspended',
    emailVerifiedAt: daysAgo(60),
    lastLoginAt: daysAgo(20),
    createdAt: daysAgo(60),
  },
]

const CATEGORY_SEED = [
  { id: 'cat_01', name: 'Skincare', slug: 'skincare', description: 'Cleansers, serums aur moisturisers' },
  { id: 'cat_02', name: 'Makeup', slug: 'makeup', description: 'Face, eyes aur lips' },
  { id: 'cat_03', name: 'Fragrance', slug: 'fragrance', description: 'Perfumes aur body mists' },
  { id: 'cat_04', name: 'Hair Care', slug: 'hair-care', description: 'Shampoo, oils aur treatments' },
  { id: 'cat_05', name: 'Accessories', slug: 'accessories', description: 'Brushes, bags aur tools' },
].map((category, index) => ({ ...category, createdAt: daysAgo(120 - index) }))

const PRODUCT_SEED = [
  ['Vitamin C Brightening Serum', 'cat_01', 4200, 5200, 2400, 64, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=70'],
  ['Hydrating Hyaluronic Toner', 'cat_01', 2800, 3400, 1500, 120, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=70'],
  ['Gentle Foaming Cleanser', 'cat_01', 1950, null, 980, 8, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=70'],
  ['Matte Liquid Lipstick', 'cat_02', 1650, 1990, 720, 210, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=70'],
  ['24H Waterproof Mascara', 'cat_02', 2150, null, 1010, 45, 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?w=600&q=70'],
  ['Velvet Foundation SPF30', 'cat_02', 3890, 4500, 2100, 0, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=70'],
  ['Amber Oud Eau de Parfum', 'cat_03', 8900, 11000, 4600, 32, 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=70'],
  ['Citrus Bloom Body Mist', 'cat_03', 2450, null, 1180, 96, 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=600&q=70'],
  ['Argan Repair Hair Oil', 'cat_04', 3100, 3800, 1650, 5, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=70'],
  ['Anti-Frizz Keratin Shampoo', 'cat_04', 2650, null, 1300, 78, 'https://images.unsplash.com/photo-1626015438606-4d2d5b53db85?w=600&q=70'],
  ['Pro Makeup Brush Set (12pc)', 'cat_05', 5400, 6900, 2800, 24, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=70'],
  ['Travel Cosmetic Organizer', 'cat_05', 2200, null, 900, 140, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=70'],
].map(([name, categoryId, price, compareAtPrice, cost, stock, imageUrl], index) => ({
  id: `prd_${String(index + 1).padStart(2, '0')}`,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  sku: `NX-${String(index + 1).padStart(4, '0')}`,
  description: `${name} — professional grade formula, dermatologically tested aur cruelty free. Roz istemal ke liye mehfooz.`,
  categoryId,
  price,
  compareAtPrice,
  cost,
  stock,
  lowStockThreshold: 10,
  status: index === 5 ? 'draft' : 'active',
  imageUrl,
  createdAt: daysAgo(100 - index * 3),
  updatedAt: daysAgo(10 - (index % 10)),
}))

const CUSTOMER_SEED = [
  ['Usman', 'Tariq', 'customer@nexa.test', '+92 304 1112233', 'Tufail Traders', 'Lahore', 'Pakistan', '54000'],
  ['Mariam', 'Sheikh', 'mariam.sheikh@example.com', '+92 321 4567890', 'Glow Beauty Bar', 'Karachi', 'Pakistan', '74000'],
  ['Hamza', 'Yousaf', 'hamza.yousaf@example.com', '+92 333 2223344', null, 'Islamabad', 'Pakistan', '44000'],
  ['Fatima', 'Noor', 'fatima.noor@example.com', '+92 345 8887766', 'Noor Cosmetics', 'Faisalabad', 'Pakistan', '38000'],
  ['Ali', 'Raza', 'ali.raza@example.com', '+92 311 5554433', null, 'Multan', 'Pakistan', '60000'],
  ['Zoya', 'Malik', 'zoya.malik@example.com', '+92 300 7778899', 'Zoya Salon', 'Rawalpindi', 'Pakistan', '46000'],
  ['Bilal', 'Hussain', 'bilal.hussain@example.com', '+92 322 6665544', null, 'Peshawar', 'Pakistan', '25000'],
  ['Areeba', 'Saleem', 'areeba.saleem@example.com', '+92 313 3332211', 'Areeba Studio', 'Sialkot', 'Pakistan', '51310'],
].map(([firstName, lastName, email, phone, company, city, country, postalCode], index) => ({
  id: `cus_${String(index + 1).padStart(2, '0')}`,
  firstName,
  lastName,
  email,
  phone,
  company,
  status: index === 6 ? 'inactive' : 'active',
  notes: index === 1 ? 'Wholesale client — 10% negotiated discount.' : '',
  address: {
    line1: `House ${12 + index * 7}, Block ${String.fromCharCode(65 + index)}`,
    city,
    postalCode,
    country,
  },
  userId: index === 0 ? 'usr_05' : null,
  createdBy: index % 2 === 0 ? 'usr_02' : 'usr_03',
  createdAt: daysAgo(70 - index * 6),
  updatedAt: daysAgo(20 - (index % 15)),
}))

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

function buildOrders(products, customers) {
  const orders = []
  for (let index = 0; index < 26; index += 1) {
    const customer = customers[index % customers.length]
    const itemCount = (index % 3) + 1
    const items = Array.from({ length: itemCount }, (_, itemIndex) => {
      const product = products[(index * 2 + itemIndex * 3) % products.length]
      const quantity = ((index + itemIndex) % 3) + 1
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.price,
        quantity,
        lineTotal: product.price * quantity,
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const taxTotal = Math.round(subtotal * 0.17)
    const shippingTotal = subtotal > 10_000 ? 0 : 350
    const discountTotal = index % 5 === 0 ? Math.round(subtotal * 0.1) : 0
    const status = ORDER_STATUSES[index % ORDER_STATUSES.length]
    const placedAt = daysAgo(60 - index * 2)

    orders.push({
      id: `ord_${String(index + 1).padStart(2, '0')}`,
      orderNumber: `NX-${10_240 + index}`,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      status,
      paymentStatus: ['cancelled', 'pending'].includes(status)
        ? 'unpaid'
        : status === 'refunded'
          ? 'refunded'
          : 'paid',
      paymentMethod: index % 2 === 0 ? 'card' : 'cash_on_delivery',
      items,
      subtotal,
      taxTotal,
      shippingTotal,
      discountTotal,
      grandTotal: subtotal + taxTotal + shippingTotal - discountTotal,
      currency: 'PKR',
      shippingAddress: customer.address,
      placedAt,
      updatedAt: placedAt,
      timeline: [{ status: 'pending', note: 'Order placed', at: placedAt, by: 'system' }],
    })
  }
  return orders
}

function buildInventoryMovements(products) {
  const movements = []
  products.forEach((product, index) => {
    movements.push({
      id: `inv_${product.id}_seed`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'purchase',
      quantity: product.stock + 20,
      reason: 'Opening stock',
      balanceAfter: product.stock + 20,
      createdBy: 'usr_01',
      createdAt: daysAgo(95 - index * 2),
    })
    movements.push({
      id: `inv_${product.id}_sale`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: 'sale',
      quantity: -20,
      reason: 'Sold via storefront',
      balanceAfter: product.stock,
      createdBy: 'system',
      createdAt: daysAgo(12 - (index % 10)),
    })
  })
  return movements
}

function seed() {
  const products = PRODUCT_SEED.map((product) => ({ ...product }))
  const customers = CUSTOMER_SEED.map((customer) => ({ ...customer }))

  return {
    roles: ROLE_SEED.map((role) => ({ ...role })),
    users: USER_SEED.map((user) => ({ ...user })),
    categories: CATEGORY_SEED.map((category) => ({ ...category })),
    products,
    customers,
    orders: buildOrders(products, customers),
    inventoryMovements: buildInventoryMovements(products),
    auditLogs: [
      {
        id: 'aud_seed',
        actorId: 'usr_01',
        actorName: 'Zain Ahmed',
        action: 'system.seeded',
        resourceType: 'system',
        resourceId: null,
        meta: { note: 'Demo data loaded' },
        ip: '127.0.0.1',
        createdAt: daysAgo(180),
      },
    ],
    sessions: [],
    passwordResetTokens: [],
    settings: {
      storeName: 'Nexa Store',
      supportEmail: 'support@nexa.test',
      currency: 'PKR',
      taxRate: 17,
      freeShippingThreshold: 10_000,
      lowStockAlerts: true,
    },
  }
}

let state = null

function load() {
  if (state) return state
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    state = raw ? JSON.parse(raw) : seed()
  } catch {
    state = seed()
  }
  return state
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full ya private mode — mock in-memory hi chalta rahega
  }
}

export const db = {
  get data() {
    return load()
  },
  /** Har mutation ke baad call karein taake refresh par data zinda rahe. */
  commit() {
    persist()
    return state
  },
  reset() {
    state = seed()
    persist()
    return state
  },
}

export function nextId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export { STORAGE_KEY }
