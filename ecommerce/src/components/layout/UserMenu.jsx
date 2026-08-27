import { ChevronDown, LogOut, Store, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { cn, initials } from '@/lib/utils'

export function Avatar({ name, className }) {
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700',
        className
      )}
    >
      {initials(name)}
    </span>
  )
}

export function UserMenu({ align = 'right' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-slate-100"
      >
        <Avatar name={user.fullName} />
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-slate-900">
            {user.fullName}
          </span>
          <span className="block text-xs leading-tight text-slate-500">
            {user.role?.name ?? 'Customer'}
          </span>
        </span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-slate-900">{user.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          <MenuLink to="/account/profile" icon={User} onSelect={() => setOpen(false)}>
            Profile & password
          </MenuLink>
          <MenuLink to="/" icon={Store} onSelect={() => setOpen(false)}>
            Go to storefront
          </MenuLink>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

function MenuLink({ to, icon: Icon, onSelect, children }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
    >
      <Icon className="size-4 text-slate-400" />
      {children}
    </Link>
  )
}
