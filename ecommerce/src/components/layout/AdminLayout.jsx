import { Menu, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { cn } from '@/lib/utils'
import { ADMIN_NAV } from './navigation'
import { UserMenu } from './UserMenu'

export function AdminLayout() {
  const { can } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Sirf wahi sections dikhein jinke andar kam se kam ek allowed link ho.
  const sections = ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => can(item.permission)),
  })).filter((section) => section.items.length > 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <NavLink to="/admin" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Nexa Admin</span>
          </NavLink>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="focus-ring grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.section}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.section}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
            Sidebar mein sirf wahi links hain jinki aapko permission hai. Role badal kar dekhein —
            menu khud badal jayega.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="focus-ring grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <UserMenu />
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
