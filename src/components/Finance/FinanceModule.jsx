import { useWorkspaceStore } from '../../store/workspaceStore'
import { DollarSign, TrendingUp, Calendar, ShoppingBag, ArrowUpRight } from 'lucide-react'

const TODAY = new Date().toISOString().split('T')[0]
const THIS_MONTH = TODAY.slice(0, 7)

function SaleRow({ sale }) {
  const isToday = sale.date === TODAY
  const initials = sale.customer.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-700', 'bg-blue-700', 'bg-emerald-700', 'bg-amber-700', 'bg-pink-700']
  const colorIdx = sale.customer.charCodeAt(0) % colors.length

  return (
    <div className="card-enter flex items-center gap-3 px-4 py-3 rounded-xl bg-[#141414] border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all">
      <div className={`w-8 h-8 rounded-lg ${colors[colorIdx]} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#e5e7eb] leading-none">{sale.customer}</p>
        <p className="text-[10px] text-[#6b7280] mt-0.5 flex items-center gap-1">
          <ShoppingBag size={9} />
          {sale.product}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-emerald-400">${sale.amount.toLocaleString('es-MX')}</p>
        {isToday && (
          <span className="text-[9px] font-medium text-violet-400 bg-violet-950/50 border border-violet-800/40 rounded-full px-1.5 py-0.5">
            HOY
          </span>
        )}
        {!isToday && <p className="text-[10px] text-[#4b5563]">{sale.date.slice(5)}</p>}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, accent, bg, border }) {
  return (
    <div className={`flex-1 ${bg} border ${border} rounded-2xl p-4`}>
      <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center mb-3`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-[#6b7280] mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-[#4b5563] mt-1">{sub}</p>}
    </div>
  )
}

export default function FinanceModule() {
  const sales = useWorkspaceStore((s) => s.sales)

  const todaySales = sales.filter((s) => s.date === TODAY)
  const monthSales = sales.filter((s) => s.date.startsWith(THIS_MONTH))

  const todayTotal = todaySales.reduce((sum, s) => sum + s.amount, 0)
  const monthTotal = monthSales.reduce((sum, s) => sum + s.amount, 0)
  const grandTotal = sales.reduce((sum, s) => sum + s.amount, 0)

  const avgSale = sales.length > 0 ? Math.round(grandTotal / sales.length) : 0

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Stat cards */}
      <div className="flex gap-3">
        <StatCard
          icon={Calendar}
          label="Ventas de hoy"
          value={`$${todayTotal.toLocaleString('es-MX')}`}
          sub={`${todaySales.length} transacción${todaySales.length !== 1 ? 'es' : ''}`}
          accent="bg-violet-700"
          bg="bg-violet-950/20"
          border="border-violet-800/30"
        />
        <StatCard
          icon={TrendingUp}
          label="Ventas del mes"
          value={`$${monthTotal.toLocaleString('es-MX')}`}
          sub={`${monthSales.length} transacciones`}
          accent="bg-blue-700"
          bg="bg-blue-950/20"
          border="border-blue-800/30"
        />
        <StatCard
          icon={DollarSign}
          label="Total acumulado"
          value={`$${grandTotal.toLocaleString('es-MX')}`}
          sub={`Ticket prom. $${avgSale.toLocaleString('es-MX')}`}
          accent="bg-emerald-700"
          bg="bg-emerald-950/20"
          border="border-emerald-800/30"
        />
      </div>

      {/* Chart bar visual */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#9ca3af]">Distribución por venta</p>
          <div className="flex items-center gap-1 text-emerald-400">
            <ArrowUpRight size={12} />
            <span className="text-xs font-medium">+{sales.length} registros</span>
          </div>
        </div>
        <div className="flex gap-1 items-end h-16">
          {sales.slice(0, 12).map((s, i) => {
            const maxAmount = Math.max(...sales.map(x => x.amount))
            const height = Math.max(8, (s.amount / maxAmount) * 64)
            return (
              <div
                key={s.id}
                className="flex-1 rounded-sm bg-gradient-to-t from-violet-700 to-violet-500 opacity-80 hover:opacity-100 transition-opacity"
                style={{ height }}
                title={`${s.customer}: $${s.amount}`}
              />
            )
          })}
        </div>
      </div>

      {/* Transactions list */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Transacciones</p>
          <span className="text-[10px] text-[#4b5563]">{sales.length} registros</span>
        </div>
        <div className="flex flex-col gap-2">
          {sales.map((s) => <SaleRow key={s.id} sale={s} />)}
        </div>
      </div>
    </div>
  )
}
