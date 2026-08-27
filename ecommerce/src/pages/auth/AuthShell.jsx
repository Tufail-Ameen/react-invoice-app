import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const HIGHLIGHTS = [
  'JWT access + refresh token rotation',
  'Role based access control (RBAC) with granular permissions',
  'Pagination, search, filtering aur sorting',
  'Stock transactions, order state machine aur audit trail',
]

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Sparkles className="size-4.5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Nexa</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-slate-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.35),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.25),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-center px-14">
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white">
            Ye frontend jaan bujh kar backend-shaped banaya gaya hai.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Har screen ke peeche saaf REST endpoints hain. Mock API aaj chal rahi hai — aap
            ek-ek endpoint apne asli backend se replace karte jayein.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
