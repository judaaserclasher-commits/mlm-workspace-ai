import { Home, ShoppingCart, Car, BookOpen, Wifi, MoreHorizontal, TrendingUp, List } from 'lucide-react'
import { useWorkspaceStore, THIS_MONTH } from '../../store/workspaceStore'

const CATEGORY_META = {
  Vivienda:     { icon: Home,           color: 'var(--blue)',   lightBg: 'var(--blue-light)'   },
  Alimentación: { icon: ShoppingCart,   color: 'var(--amber)',  lightBg: 'var(--amber-light)'  },
  Transporte:   { icon: Car,            color: 'var(--violet)', lightBg: 'var(--violet-light)' },
  Educación:    { icon: BookOpen,       color: 'var(--green)',  lightBg: 'var(--green-light)'  },
  Servicios:    { icon: Wifi,           color: 'var(--teal)',   lightBg: '#E6F7F4'             },
  Otros:        { icon: MoreHorizontal, color: 'var(--text2)',  lightBg: 'var(--bg)'           },
}

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

function barColor(pct) {
  if (pct > 100) return 'var(--coral)'
  if (pct >= 80)  return 'var(--amber)'
  return 'var(--teal)'
}

export default function PersonalFinance() {
  const sales            = useWorkspaceStore(s => s.sales)
  const personalExpenses = useWorkspaceStore(s => s.personalExpenses)
  const personalBudgets  = useWorkspaceStore(s => s.personalBudgets)

  const monthIncome = sales
    .filter(s => s.date?.startsWith(THIS_MONTH))
    .reduce((sum, s) => sum + s.amount, 0)

  const monthPersonal = personalExpenses.filter(e => e.date?.startsWith(THIS_MONTH))

  const spentByCategory = {}
  monthPersonal.forEach(e => {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount
  })

  const personalTotal = Object.values(spentByCategory).reduce((s, v) => s + v, 0)
  const balance       = monthIncome - personalTotal
  const isPositive    = balance >= 0
  const coveragePct   = personalTotal > 0 ? Math.min(100, Math.round((monthIncome / personalTotal) * 100)) : 100
  const categories    = Object.keys(personalBudgets)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Salud financiera ──────────────────────────────────────── */}
      <div style={CARD}>
        <div style={CT}>
          <TrendingUp size={13} style={{ color: 'var(--teal)' }} />
          Salud Financiera
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: isPositive ? 'var(--teal-dark)' : 'var(--coral)', letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 4 }}>
            {isPositive ? '+' : '-'}{fmt(Math.abs(balance))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            Ingresos negocio vs gastos personales
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              El negocio cubre el {coveragePct}% de tus gastos personales
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: isPositive ? 'var(--teal-dark)' : 'var(--coral)' }}>
              {coveragePct}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 5, background: '#F0F2F8', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5,
              background: isPositive ? 'var(--teal)' : 'var(--coral)',
              width: `${coveragePct}%`, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Sherix message */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px',
          borderRadius: 10, background: '#E6F7F4', border: '1px solid var(--teal-mid)',
          fontSize: 13, color: 'var(--teal-dark)', fontWeight: 500, lineHeight: 1.5,
        }}>
          {isPositive
            ? `💡 ¡Vas bien! Tu negocio genera ${fmt(Math.abs(balance))} de sobrante este mes.`
            : `💡 Necesitas vender ${fmt(Math.abs(balance))} más para cubrir todos tus gastos personales.`
          }
        </div>
      </div>

      {/* ── Categorías de presupuesto ─────────────────────────────── */}
      {categories.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4A4F6A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Presupuesto por Categoría
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {categories.map(cat => {
              const meta      = CATEGORY_META[cat] || CATEGORY_META.Otros
              const Icon      = meta.icon
              const spent     = spentByCategory[cat] || 0
              const budget    = personalBudgets[cat] || 0
              const pct       = budget > 0 ? Math.round((spent / budget) * 100) : 0
              const over      = spent > budget
              const remaining = budget - spent

              return (
                <div key={cat} style={{ ...CARD, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: meta.lightBg, color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{cat}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>
                        {fmt(spent)} de {fmt(budget)}
                      </div>
                    </div>
                    {over && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                        background: 'var(--coral-light)', color: 'var(--coral)', flexShrink: 0,
                      }}>
                        Excedido
                      </span>
                    )}
                  </div>

                  <div style={{ height: 6, borderRadius: 5, background: '#F0F2F8', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{
                      height: '100%', borderRadius: 5,
                      background: barColor(pct),
                      width: `${Math.min(100, pct)}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#8890AB' }}>{pct}% utilizado</span>
                    {over ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--coral)' }}>
                        +{fmt(Math.abs(remaining))} excedido
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>
                        {fmt(remaining)} disponible
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Historial personal ────────────────────────────────────── */}
      <div style={CARD}>
        <div style={CT}>
          <List size={13} style={{ color: 'var(--teal)' }} />
          Historial Personal
        </div>

        {monthPersonal.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
            Sin gastos registrados este mes
          </p>
        ) : (
          monthPersonal
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .map((e, i) => {
              const meta = CATEGORY_META[e.category] || CATEGORY_META.Otros
              const Icon = meta.icon
              return (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px',
                  background: i % 2 === 1 ? '#F0F2F8' : 'transparent',
                  borderRadius: 8,
                  borderBottom: i < monthPersonal.length - 1 ? '1px solid #F0F2F8' : 'none',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: meta.lightBg, color: meta.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={13} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.concept}
                    </div>
                    <div style={{ fontSize: 11, color: '#8890AB', marginTop: 1 }}>{e.category} · {e.date}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--coral)', flexShrink: 0 }}>
                    -{fmt(e.amount)}
                  </span>
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}
