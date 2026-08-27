import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageLoader } from '@/components/ui/Loaders'
import { useAuth } from './useAuth'

/** Login zaroori hai — warna login page par bhej do aur wapsi ka raasta yaad rakho. */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageLoader label="Session check ho rahi hai…" />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

/** Pehle se logged-in user ko login/register page par mat rakho. */
export function RequireGuest() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()

  if (isLoading) return <FullPageLoader label="Session check ho rahi hai…" />
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  return <Outlet />
}

/**
 * Permission-based route guard.
 * Yaad rakhein: ye sirf UI hai. Backend par bhi yehi check lagana laazmi hai,
 * warna koi bhi seedha API call kar ke data nikal lega.
 */
export function RequirePermission({ permission, children }) {
  const { isAuthenticated, isLoading, can } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageLoader label="Permissions load ho rahi hain…" />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (permission && !can(permission)) return <Navigate to="/403" replace />
  return children ?? <Outlet />
}

/**
 * Chhote UI tukdon ko chupane ke liye (buttons, menu items, table columns).
 *
 *   <Can permission={PERMISSIONS.PRODUCTS_DELETE}><DeleteButton /></Can>
 */
export function Can({ permission, fallback = null, children }) {
  const { can } = useAuth()
  if (!can(permission)) return fallback
  return children
}
