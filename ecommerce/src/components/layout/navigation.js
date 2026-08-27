import {
  BadgeCheck,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  UsersRound,
} from 'lucide-react'
import { PERMISSIONS as P } from '@/lib/permissions'

/**
 * Sidebar navigation. Har item apni permission ke saath bandha hua hai —
 * jis user ke paas permission nahi, use link dikhta hi nahi.
 */
export const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: P.DASHBOARD_VIEW, end: true }],
  },
  {
    section: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package, permission: P.PRODUCTS_VIEW },
      { to: '/admin/categories', label: 'Categories', icon: Tags, permission: P.CATEGORIES_VIEW },
      { to: '/admin/inventory', label: 'Inventory', icon: Boxes, permission: P.INVENTORY_VIEW },
    ],
  },
  {
    section: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, permission: P.ORDERS_VIEW },
      { to: '/admin/customers', label: 'Customers', icon: UsersRound, permission: P.CUSTOMERS_VIEW },
    ],
  },
  {
    section: 'Access Control',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users, permission: P.USERS_VIEW },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, permission: P.ROLES_VIEW },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/admin/audit-logs', label: 'Audit Log', icon: ClipboardList, permission: P.AUDIT_VIEW },
      { to: '/admin/settings', label: 'Settings', icon: Settings, permission: P.SETTINGS_MANAGE },
    ],
  },
]

export const ACCOUNT_NAV = [
  { to: '/account/orders', label: 'My Orders', icon: ClipboardList },
  { to: '/account/profile', label: 'Profile', icon: BadgeCheck },
]
