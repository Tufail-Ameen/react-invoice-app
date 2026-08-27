import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardApi, queryKeys } from '@/api/endpoints'
import { Card, CardBody, CardHeader, PageHeader, StatCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/Loaders'
import { ErrorState } from '@/components/ui/EmptyState'
import { formatDate, formatMoney, formatNumber } from '@/lib/utils'

export function DashboardPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.summary,
  })

  if (error) return <ErrorState error={error} onRetry={refetch} />

  if (isPending) {
    return (
      <>
        <PageHeader title="Dashboard" description="Store ki aaj ki tasveer." />
        <CardSkeleton />
      </>
    )
  }

  const { kpis, revenueByDay, ordersByStatus, topProducts, recentOrders, lowStockProducts } = data

  return (
    <>
      <PageHeader title="Dashboard" description="Store ki aaj ki tasveer." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatMoney(kpis.revenue)}
          change={kpis.revenueChangePercent}
          footer="pichhle 30 din"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Orders"
          value={formatNumber(kpis.orders)}
          footer={`${kpis.pendingOrders} pending`}
          icon={ShoppingCart}
        />
        <StatCard
          label="Customers"
          value={formatNumber(kpis.customers)}
          footer={`AOV ${formatMoney(kpis.averageOrderValue)}`}
          icon={Users}
        />
        <StatCard
          label="Active products"
          value={formatNumber(kpis.products)}
          footer={`${kpis.lowStockCount} low stock`}
          icon={Package}
          tone={kpis.lowStockCount > 0 ? 'warning' : 'brand'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue" description="Pichhle 14 din ki paid orders" />
          <CardBody className="pl-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByDay} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.slice(5)}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), 'Revenue']}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Orders by status" />
          <CardBody className="pl-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent orders"
            action={
              <Link to="/admin/orders" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Sab dekhein
              </Link>
            }
          />
          <ul className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {order.orderNumber}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {order.customerName} · {formatDate(order.placedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={order.status} kind="order" />
                    <span className="text-sm font-medium text-slate-900">
                      {formatMoney(order.grandTotal, order.currency)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Top products" description="Revenue ke hisaab se" />
            <ul className="divide-y divide-slate-100">
              {topProducts.map((product, index) => (
                <li key={product.productId} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.unitsSold} units</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-slate-900">
                    {formatMoney(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Low stock alert"
              action={
                <Link
                  to="/admin/inventory?state=low"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Inventory
                </Link>
              }
            />
            {lowStockProducts.length === 0 ? (
              <CardBody className="text-sm text-slate-500">Sab products ka stock theek hai.</CardBody>
            ) : (
              <ul className="divide-y divide-slate-100">
                {lowStockProducts.map((product) => (
                  <li key={product.id} className="flex items-center gap-3 px-5 py-3">
                    <AlertTriangle
                      className={`size-4 shrink-0 ${product.stock === 0 ? 'text-rose-500' : 'text-amber-500'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold ${product.stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}
                    >
                      {product.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
