import { Compass, ShieldOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'

function ErrorShell({ code, icon: Icon, title, description, children }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon className="size-7" />
        </span>
        <p className="mt-6 text-sm font-semibold tracking-wide text-brand-600">{code}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
    </div>
  )
}

export function ForbiddenPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <ErrorShell
      code="403"
      icon={ShieldOff}
      title="Access nahi hai"
      description={`Aapka role "${user?.role?.name ?? 'Customer'}" is page ko khol nahi sakta. Agar ye galti hai to admin se rabta karein.`}
    >
      <Button variant="secondary" onClick={() => navigate(-1)}>
        Wapas jayein
      </Button>
      <Link to="/">
        <Button>Storefront</Button>
      </Link>
    </ErrorShell>
  )
}

export function NotFoundPage() {
  return (
    <ErrorShell
      code="404"
      icon={Compass}
      title="Page nahi mila"
      description="Ho sakta hai URL badal gaya ho ya page delete ho chuka ho."
    >
      <Link to="/">
        <Button>Home par jayein</Button>
      </Link>
    </ErrorShell>
  )
}
