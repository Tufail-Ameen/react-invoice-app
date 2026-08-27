import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireGuest, RequirePermission } from '@/auth/guards'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { StoreLayout } from '@/components/layout/StoreLayout'
import { PERMISSIONS as P } from '@/lib/permissions'

import { ForbiddenPage, NotFoundPage } from '@/pages/ErrorPages'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'

import { MyOrderDetailPage, MyOrdersPage } from '@/pages/account/MyOrdersPage'
import { ProfilePage } from '@/pages/account/ProfilePage'

import { CartPage } from '@/pages/store/CartPage'
import { CatalogPage } from '@/pages/store/CatalogPage'
import { CheckoutPage } from '@/pages/store/CheckoutPage'
import { ProductDetailPage } from '@/pages/store/ProductDetailPage'

import { AuditLogPage } from '@/pages/admin/AuditLogPage'
import { CategoriesPage } from '@/pages/admin/CategoriesPage'
import { CustomerDetailPage } from '@/pages/admin/CustomerDetailPage'
import { CustomersPage } from '@/pages/admin/CustomersPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { InventoryPage } from '@/pages/admin/InventoryPage'
import { OrderDetailPage } from '@/pages/admin/OrderDetailPage'
import { OrdersPage } from '@/pages/admin/OrdersPage'
import { ProductFormPage } from '@/pages/admin/ProductFormPage'
import { ProductsPage } from '@/pages/admin/ProductsPage'
import { RolesPage } from '@/pages/admin/RolesPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { UsersPage } from '@/pages/admin/UsersPage'

/**
 * Routing ke teen tabaqe:
 *   1. RequireGuest    — logged-in user ko login/register se door rakhta hai
 *   2. RequireAuth     — sirf logged-in
 *   3. RequirePermission — logged-in + specific permission
 */
export default function App() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<StoreLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />

        <Route element={<RequireAuth />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="account/orders" element={<MyOrdersPage />} />
          <Route path="account/orders/:id" element={<MyOrderDetailPage />} />
          <Route path="account/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route
        path="/admin"
        element={
          <RequirePermission permission={P.DASHBOARD_VIEW}>
            <AdminLayout />
          </RequirePermission>
        }
      >
        <Route index element={<DashboardPage />} />

        <Route element={<RequirePermission permission={P.PRODUCTS_VIEW} />}>
          <Route path="products" element={<ProductsPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.PRODUCTS_CREATE} />}>
          <Route path="products/new" element={<ProductFormPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.PRODUCTS_UPDATE} />}>
          <Route path="products/:id/edit" element={<ProductFormPage />} />
        </Route>

        <Route element={<RequirePermission permission={P.CATEGORIES_VIEW} />}>
          <Route path="categories" element={<CategoriesPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.INVENTORY_VIEW} />}>
          <Route path="inventory" element={<InventoryPage />} />
        </Route>

        <Route element={<RequirePermission permission={P.ORDERS_VIEW} />}>
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
        </Route>

        <Route element={<RequirePermission permission={P.CUSTOMERS_VIEW} />}>
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
        </Route>

        <Route element={<RequirePermission permission={P.USERS_VIEW} />}>
          <Route path="users" element={<UsersPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.ROLES_VIEW} />}>
          <Route path="roles" element={<RolesPage />} />
        </Route>

        <Route element={<RequirePermission permission={P.AUDIT_VIEW} />}>
          <Route path="audit-logs" element={<AuditLogPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.SETTINGS_MANAGE} />}>
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
