/**
 * Poori app ka permission catalog.
 *
 * Ye list backend ki "source of truth" honi chahiye. Frontend sirf ye batata hai
 * ki button dikhana hai ya nahi — asli rok-tok hamesha backend par lagti hai.
 * Aapke backend mein ye ek `permissions` table hoga aur `role_permissions`
 * pivot table roles ke saath jodegi.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',

  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_MANAGE: 'categories.manage',

  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',

  ORDERS_VIEW: 'orders.view',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_REFUND: 'orders.refund',

  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',

  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',

  AUDIT_VIEW: 'audit.view',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_MANAGE: 'settings.manage',
}

/** Roles & permissions screen par grouped display ke liye. */
export const PERMISSION_GROUPS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Admin panel ka overview aur KPIs',
    permissions: [{ key: PERMISSIONS.DASHBOARD_VIEW, label: 'View dashboard' }],
  },
  {
    key: 'catalog',
    label: 'Catalog',
    description: 'Products aur categories manage karna',
    permissions: [
      { key: PERMISSIONS.PRODUCTS_VIEW, label: 'View products' },
      { key: PERMISSIONS.PRODUCTS_CREATE, label: 'Create products' },
      { key: PERMISSIONS.PRODUCTS_UPDATE, label: 'Update products' },
      { key: PERMISSIONS.PRODUCTS_DELETE, label: 'Delete products' },
      { key: PERMISSIONS.CATEGORIES_VIEW, label: 'View categories' },
      { key: PERMISSIONS.CATEGORIES_MANAGE, label: 'Manage categories' },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Customer records aur unka data',
    permissions: [
      { key: PERMISSIONS.CUSTOMERS_VIEW, label: 'View customers' },
      { key: PERMISSIONS.CUSTOMERS_CREATE, label: 'Create customers' },
      { key: PERMISSIONS.CUSTOMERS_UPDATE, label: 'Update customers' },
      { key: PERMISSIONS.CUSTOMERS_DELETE, label: 'Delete customers' },
    ],
  },
  {
    key: 'orders',
    label: 'Orders',
    description: 'Order lifecycle aur payments',
    permissions: [
      { key: PERMISSIONS.ORDERS_VIEW, label: 'View orders' },
      { key: PERMISSIONS.ORDERS_UPDATE, label: 'Update order status' },
      { key: PERMISSIONS.ORDERS_REFUND, label: 'Refund orders' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Stock levels aur adjustments',
    permissions: [
      { key: PERMISSIONS.INVENTORY_VIEW, label: 'View inventory' },
      { key: PERMISSIONS.INVENTORY_ADJUST, label: 'Adjust stock' },
    ],
  },
  {
    key: 'team',
    label: 'Team & Access',
    description: 'Staff accounts, roles aur permissions',
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: 'View users' },
      { key: PERMISSIONS.USERS_CREATE, label: 'Invite users' },
      { key: PERMISSIONS.USERS_UPDATE, label: 'Update users' },
      { key: PERMISSIONS.USERS_DELETE, label: 'Delete users' },
      { key: PERMISSIONS.ROLES_VIEW, label: 'View roles' },
      { key: PERMISSIONS.ROLES_MANAGE, label: 'Manage roles & permissions' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    description: 'Reports, audit trail aur settings',
    permissions: [
      { key: PERMISSIONS.REPORTS_VIEW, label: 'View reports' },
      { key: PERMISSIONS.AUDIT_VIEW, label: 'View audit log' },
      { key: PERMISSIONS.SETTINGS_MANAGE, label: 'Manage settings' },
    ],
  },
]

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key)
)

export const PERMISSION_LABELS = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map((permission) => [permission.key, permission.label])
  )
)

/**
 * `super_admin` ke paas wildcard `*` hota hai. Backend mein bhi yahi shortcut
 * rakhein warna har naye permission ke liye migration likhni padegi.
 */
export function hasPermission(userPermissions, required) {
  if (!userPermissions?.length) return false
  if (userPermissions.includes('*')) return true
  if (!required) return true
  const list = Array.isArray(required) ? required : [required]
  return list.some((permission) => userPermissions.includes(permission))
}

export function hasEveryPermission(userPermissions, required) {
  if (!userPermissions?.length) return false
  if (userPermissions.includes('*')) return true
  const list = Array.isArray(required) ? required : [required]
  return list.every((permission) => userPermissions.includes(permission))
}
