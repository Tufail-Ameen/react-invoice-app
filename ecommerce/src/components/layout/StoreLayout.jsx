import { LayoutDashboard, Package, ShoppingBag, Sparkles } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/store/CartContext'
import { cn } from '@/lib/utils'
import { UserMenu } from './UserMenu'

export function StoreLayout() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { count } = useCart()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
              <Sparkles className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-900">Nexa</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <StoreLink to="/" end>
              Shop
            </StoreLink>
            {isAuthenticated && <StoreLink to="/account/orders">My Orders</StoreLink>}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="focus-ring hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:inline-flex"
              >
                <LayoutDashboard className="size-4" />
                Admin
              </Link>
            )}

            <Link
              to="/cart"
              className="focus-ring relative grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <Package className="size-4" />
            Nexa Store — backend seekhne ke liye banaya gaya demo storefront.
          </p>
          <p className="text-xs">Har screen ke peeche ek REST endpoint hai. Docs folder dekhein.</p>
        </div>
      </footer>
    </div>
  )
}

function StoreLink({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'focus-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
        )
      }
    >
      {children}
    </NavLink>
  )
}
