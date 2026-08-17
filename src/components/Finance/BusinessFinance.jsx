import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Target, TrendingUp, List, Award } from 'lucide-react'
import { useWorkspaceStore, THIS_MONTH } from '../../store/workspaceStore'

const EXPENSE_CATEGORIES = ['Inventario', 'Marketing', 'Transporte', 'Servicios', 'Otros']
const WEEK_RANGES = [[1,7],[8,14],[15,21],[22,31]]

const CARD = {
  background: '#fff',
  border: '1px solid #E2E5EF',
  borderRadius: 14,
  padding: 18,
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
}
const CT = {
  fontSize: 12, fontWeight: 700, color: '#4A4F6A',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
}

function fmt(n) { return `$${Number(n).toLocaleString('es-MX')}` }

function getMonthData(sales, expenses) {
  const ms     = sales.filter(s => s.date?.startsWith(THIS_MONTH))
  const me     = expenses.filter(e => e.date?.startsWith(THIS_MONTH))
  const income = ms.reduce((s, x) => s + x.amount, 0)
  const spent  = me.reduce((s, x) => s + x.amount, 0)
  const net    = income - spent
  const margin = income > 0 ? ((net / income) * 100).toFixed(1) : '0.0'
  return { ms, me, income, spent, net, margin }
}

function getWeeklyData(sales, expenses) {
  return WEEK_RANGES.map(([start, end], i) => {
    const inWeek = arr => arr.filter(x => {
      if (!x.date?.startsWith(THIS_MONTH)) return false
      const d = parseInt(x.date.split('-')[2])
      return d >= start && d <= end
    })
    return {
      name: `Sem ${i + 1}`,
      Ingresos: inWeek(sales).reduce((s, x) => s + x.amount, 0),
      Gastos:   inWeek(expenses).reduce((s, x) => s + x.amount, 0),
    }
  })
}

function calcCommission(income, profile) {
  if (!profile?.commissionModel || !income) return null
  const { commissionModel, fixedPercent, tiers, pointValue, minPoints, sellPrice } = profile
  if (commissionModel === 'fixed') {
    return income * ((fixedPercent || 30) / 100)
  }
  if (commissionModel === 'tiered' && tiers?.length) {
    const tier = tiers.find(t => income >= t.from && (t.to === Infinity || income <= t.to))
    if (!tier) return null
    return { amount: income * (tier.percent / 100), percent: tier.percent }
  }
  if (commissionModel === 'points') {
    const sp = sellPrice || 1
    const pv = income / sp
    if (pv < (minPoints || 0)) return { amount: 0, pv, qualified: false }
    return { amount: pv * (pointValue || 0), pv, qualified: true }
  }
  return null
}

function getExpensesByCategory(expenses) {
  const result = {}
  EXPENSE_CATEGORIES.forEach(c => { result[c] = 0 })
  expenses.forEach(e => { result[e.category] = (result[e.category] || 0) + e.amount })
  return result
}

function Row({ label, val, accent, coral }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: coral ? 'var(--coral)' : accent ? 'var(--teal-dark)' : 'var(--text)' }}>{val}</span>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E5EF', borderRadius: 10, padding: '8px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.09)' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#4A4F6A', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: '#4A4F6A' }}>{p.dataKey}:</span>
          <span style={{ fontWeight: 700, color: p.fill }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function BusinessFinance() {
  const sales       = useWorkspaceStore(s => s.sales)
  const expenses    = useWorkspaceStore(s => s.expenses)
  const salesGoal   = useWorkspaceStore(s => s.salesGoal)
  const userProfile = useWorkspaceStore(s => s.userProfile)

  const { ms, me, income, spent, net, margin } = getMonthData(sales, expenses)
  const weeklyData         = getWeeklyData(sales, expenses)
  const expensesByCategory = getExpensesByCategory(me)
  const isProfit  = net >= 0
  const pct       = Math.min(100, salesGoal > 0 ? Math.round((income / salesGoal) * 100) : 0)
  const remaining = Math.max(0, salesGoal - income)

  const transactions = [
    ...ms.map(s => ({ ...s, _type: 'income' })),
    ...me.map(e => ({ ...e, _type: 'expense' })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const STATS = [
    { label: 'Ingresos del mes', value: fmt(income),        sub: 'Ventas este mes',                   color: 'var(--teal-dark)' },
    { label: 'Gastos del mes',   value: fmt(spent),         sub: 'Inventario + operación',            color: 'var(--coral)' },
    { label: 'Ganancia neta',    value: fmt(Math.abs(net)), sub: isProfit ? 'Superávit' : 'Déficit',  color: isProfit ? 'var(--teal-dark)' : 'var(--coral)' },
    { label: 'Margen',           value: `${margin}%`,       sub: 'Del total de ingresos',             color: 'var(--amber)' },
  ]

  const activeCats   = EXPENSE_CATEGORIES.filter(c => expensesByCategory[c] > 0)
  const commResult   = calcCommission(income, userProfile)
  const commAmount   = commResult === null ? null : (typeof commResult === 'number' ? commResult : commResult.amount)
  const MODEL_LABELS = { fixed: '% Fijo', tiered: 'Por niveles', points: 'Puntos PV' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Stat cards ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {STATS.map(s => (
          <div key={s.label} style={CARD}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4A4F6A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#8890AB', marginTop: 5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Meta del mes ──────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={CT}>
          <Target size={13} style={{ color: 'var(--teal)' }} />
          Meta del Mes
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--teal-dark)', letterSpacing: '-0.5px', lineHeight: 1 }}>
            {fmt(income)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>de {fmt(salesGoal)} meta</span>
          <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: 'var(--teal-dark)' }}>{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 5, background: '#F0F2F8', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', borderRadius: 5, background: 'var(--teal)', width: `${pct}%`, transition: 'width 0.6s ease' }} />
        </div>
        <div>
          {pct >= 100
            ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>¡Meta alcanzada! 🎉</span>
            : pct >= 80
              ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal-dark)' }}>¡Casi llegas! 🔥</span>
              : <span style={{ fontSize: 12, color: 'var(--text2)' }}>Faltan {fmt(remaining)} para la meta</span>
          }
        </div>
      </div>

      {/* ── Tu comisión real ──────────────────────────────────────── */}
      {userProfile?.commissionModel ? (
        <div style={{ ...CARD, border: '1.5px solid var(--teal-mid)', background: 'linear-gradient(135deg, #F0FBF9 0%, #fff 100%)' }}>
          <div style={CT}>
            <Award size={13} style={{ color: 'var(--teal)' }} />
            Tu Comisión Real del Mes
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: '#E6F7F4', color: 'var(--teal-dark)', textTransform: 'none', letterSpacing: 'normal' }}>
              {MODEL_LABELS[userProfile.commissionModel]}
            </span>
          </div>

          {income === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>Registra ventas para ver tu comisión del mes.</p>
          ) : commAmount === null ? (
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>Configura tu estructura en <strong>Perfil → Comisiones</strong>.</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--teal-dark)', letterSpacing: '-1px', lineHeight: 1 }}>
                  {fmt(commAmount)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>de comisión estimada</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {userProfile.commissionModel === 'fixed' && (
                  <Row label="Porcentaje aplicado" val={`${userProfile.fixedPercent}% sobre ${fmt(income)}`} />
                )}
                {userProfile.commissionModel === 'tiered' && typeof commResult === 'object' && (
                  <Row label="Nivel aplicado" val={`${commResult.percent}% sobre ${fmt(income)}`} />
                )}
                {userProfile.commissionModel === 'points' && typeof commResult === 'object' && (
                  <>
                    <Row label="PV generados" val={`${commResult.pv?.toFixed(1)} PV`} />
                    <Row label="Califica para pago" val={commResult.qualified ? '✓ Sí' : `✕ No (mín. ${userProfile.minPoints} PV)`} accent={commResult.qualified} />
                    <Row label="Valor por PV" val={`$${userProfile.pointValue}`} />
                  </>
                )}
                {userProfile.buyPrice > 0 && userProfile.sellPrice > 0 && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid #E2E5EF', margin: '4px 0' }} />
                    <Row label="Margen por unidad" val={`${fmt(userProfile.sellPrice - userProfile.buyPrice)} (${Math.round((userProfile.sellPrice - userProfile.buyPrice) / userProfile.sellPrice * 100)}%)`} />
                    <Row label="Costo de inventario aprox." val={fmt(income / (userProfile.sellPrice || 1) * (userProfile.buyPrice || 0))} coral />
                  </>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid #E2E5EF', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Comisión sobre ganancia neta</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: net >= 0 ? 'var(--teal-dark)' : 'var(--coral)' }}>
                    {net >= 0 ? fmt(Math.min(commAmount, net)) : '—'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ ...CARD, border: '1.5px dashed var(--border)', background: 'var(--bg)', textAlign: 'center', padding: '18px 14px' }}>
          <Award size={22} style={{ color: 'var(--text3)', marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Sin comisiones configuradas</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Ve a <strong>Perfil → Estructura de Comisiones</strong> para ver tu ganancia real.</div>
        </div>
      )}

      {/* ── Gráfica ───────────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={CT}>
          <TrendingUp size={13} style={{ color: 'var(--teal)' }} />
          Ingresos vs Gastos — Por Semana
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} barCategoryGap="30%" barGap={3}>
            <XAxis dataKey="name" tick={{ fill: '#8890AB', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8890AB', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={48} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,169,143,0.04)', radius: 4 }} />
            <Bar dataKey="Ingresos" fill="#00A98F" radius={[4,4,0,0]} />
            <Bar dataKey="Gastos"   fill="#E84545" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 10 }}>
          {[['#00A98F','Ingresos'],['#E84545','Gastos']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#8890AB' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Estado de resultados ──────────────────────────────────── */}
      <div style={CARD}>
        <div style={CT}>
          <TrendingUp size={13} style={{ color: 'var(--teal)' }} />
          Estado de Resultados
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Ingresos totales</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-dark)' }}>{fmt(income)}</span>
        </div>

        {activeCats.map(cat => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 8px 14px', borderTop: '1px solid #F0F2F8' }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>• {cat}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--coral)' }}>-{fmt(expensesByCategory[cat])}</span>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderTop: '1px solid #E2E5EF' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Total gastos</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--coral)' }}>-{fmt(spent)}</span>
        </div>

        <hr style={{ border: 'none', borderTop: '1.5px solid #E2E5EF', margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 12px' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Ganancia Neta</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: isProfit ? 'var(--teal-dark)' : 'var(--coral)' }}>
            {isProfit ? '+' : '-'}{fmt(Math.abs(net))}
          </span>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: isProfit ? 'var(--green-light)' : 'var(--coral-light)',
          color: isProfit ? 'var(--green)' : 'var(--coral)',
          border: `1px solid ${isProfit ? '#BBF7D0' : 'rgba(232,69,69,0.3)'}`,
        }}>
          {isProfit ? '✓ Negocio rentable' : '↓ Pérdida este mes'}
        </div>
      </div>

      {/* ── Historial del mes ─────────────────────────────────────── */}
      <div style={CARD}>
        <div style={{ ...CT, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <List size={13} style={{ color: 'var(--teal)' }} />
            Historial del Mes
          </div>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#8890AB', textTransform: 'none', letterSpacing: 'normal' }}>
            {transactions.length} registros
          </span>
        </div>

        {transactions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
            Sin transacciones este mes
          </p>
        ) : (
          transactions.map((tx, i) => {
            const isIncome = tx._type === 'income'
            const label = tx.customer
              ? `${tx.customer}${tx.product ? ' — ' + tx.product : ''}`
              : (tx.concept || tx.category || '—')
            return (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px',
                background: i % 2 === 1 ? '#F0F2F8' : 'transparent',
                borderRadius: 8,
                borderBottom: i < transactions.length - 1 ? '1px solid #F0F2F8' : 'none',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isIncome ? 'var(--green)' : 'var(--coral)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: '#8890AB', marginTop: 1 }}>{tx.date}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: isIncome ? 'var(--teal-dark)' : 'var(--coral)', flexShrink: 0 }}>
                  {isIncome ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
