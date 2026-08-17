import { useMemo } from 'react'
import { CheckSquare, Users, Feather, Sparkles, AlertTriangle, Coins, ArrowRight } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'

const THIS_MONTH = new Date().toISOString().slice(0, 7)

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0 })
}

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function staleProspects(prospects) {
  return prospects.filter(p => {
    if (p.stage === 'Cliente') return false
    const ints = p.interactions || []
    const last = ints.length
      ? [...ints].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : p.date || null
    if (!last) return true
    const [y, m, d] = last.split('-').map(Number)
    const then = new Date(y, m - 1, d)
    const now = new Date(); now.setHours(0, 0, 0, 0)
    return (now - then) / 86400000 > 3
  })
}

function buildActions(tasks, prospects, weeklyContent, setActiveModule) {
  const actions = []

  const urgent = tasks.find(t => t.priority === 'Alta' && (t.status === 'Pendiente' || t.status === 'En proceso'))
  if (urgent) {
    actions.push({
      title: urgent.title,
      desc: urgent.description || 'Tarea de alta prioridad para hoy',
      go: () => setActiveModule('tasks'),
    })
  }

  const stale = staleProspects(prospects)
  if (stale.length > 0 && actions.length < 3) {
    actions.push({
      title: `Escríbele a ${stale[0].name} hoy`,
      desc: `Lleva +3 días sin respuesta — el agente tiene el mensaje listo`,
      go: () => setActiveModule('crm'),
    })
  }

  if (actions.length < 3) {
    const unpub = weeklyContent.find(p => !p.published)
    actions.push({
      title: unpub ? 'Publica el contenido de hoy' : 'Crea contenido para hoy',
      desc: unpub
        ? (unpub.platform ? `${unpub.platform} · ${unpub.time || 'programa ahora'}` : 'Listo para publicar')
        : 'El detector de oportunidades identificó qué publicar',
      go: () => setActiveModule('content'),
    })
  }

  const more = tasks.filter(t => t.status === 'Pendiente' && t.priority !== 'Alta')
  for (const t of more) {
    if (actions.length >= 3) break
    actions.push({ title: t.title, desc: t.description || '', go: () => setActiveModule('tasks') })
  }

  return actions.slice(0, 3)
}

// ── Num bubble colors — soft (light bg, colored text like mockup)
const NUM_STYLES = [
  { background: 'var(--coral-light)', color: 'var(--coral)' },
  { background: 'var(--amber-light)', color: 'var(--amber)' },
  { background: '#E6F7F4',            color: 'var(--teal-dark)' },
]

// ── Stage → pill style
function stagePill(stage, isStale) {
  if (isStale)         return { bg: 'var(--coral-light)', color: 'var(--coral)', label: 'Urgente' }
  if (stage === 'Cliente')    return { bg: 'var(--green-light)', color: 'var(--green)', label: 'Cliente' }
  if (stage === 'Por cerrar') return { bg: 'var(--coral-light)', color: 'var(--coral)', label: 'Por cerrar' }
  if (stage === 'Interesado') return { bg: 'var(--amber-light)', color: 'var(--amber)', label: 'En proceso' }
  if (stage === 'Contactado') return { bg: 'var(--amber-light)', color: 'var(--amber)', label: 'En proceso' }
  return { bg: 'var(--teal-light)', color: 'var(--teal-dark)', label: 'Nuevo' }
}

// ── Stage → avatar color
function stageAvatar(stage) {
  if (stage === 'Cliente')    return { bg: 'var(--green-light)', color: 'var(--green)' }
  if (stage === 'Por cerrar') return { bg: 'var(--coral-light)', color: 'var(--coral)' }
  if (stage === 'Interesado') return { bg: 'var(--amber-light)', color: 'var(--amber)' }
  if (stage === 'Contactado') return { bg: 'var(--blue-light)', color: 'var(--blue)' }
  return { bg: 'var(--teal-light)', color: 'var(--teal-dark)' }
}

const CARD = {
  background: '#fff',
  border: '1px solid #E2E5EF',
  borderRadius: 14,
  padding: 18,
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
}

const CARD_TITLE = {
  fontSize: 12, fontWeight: 700, color: '#4A4F6A',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  display: 'flex', alignItems: 'center', gap: 6,
  marginBottom: 14,
}

const BTN_OUTLINE_SM = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 20, fontSize: 12,
  fontWeight: 600, cursor: 'pointer', border: '1.5px solid var(--border2)',
  background: 'var(--surface)', color: 'var(--text2)',
}

const BAR_TRACK = {
  height: 8, background: 'var(--surface2)',
  borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)',
}

export default function DashboardModule() {
  const {
    userProfile, prospects, tasks, sales, expenses,
    weeklyContent, salesGoal, setActiveModule,
  } = useWorkspaceStore()

  const firstName = userProfile?.name?.split(' ')[0] || 'Distribuidor'
  const greeting  = getGreeting()
  const today     = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  const monthlySales    = useMemo(() => sales.filter(s => s.date?.startsWith(THIS_MONTH)).reduce((a, s) => a + Number(s.amount), 0), [sales])
  const monthlyExpenses = useMemo(() => expenses.filter(e => e.date?.startsWith(THIS_MONTH)).reduce((a, e) => a + Number(e.amount), 0), [expenses])
  const profit          = monthlySales - monthlyExpenses
  const goal            = salesGoal || 5000
  const goalPct         = Math.min(100, Math.round((monthlySales / goal) * 100))
  const expPct          = goal > 0 ? Math.min(100, Math.round((monthlyExpenses / goal) * 100)) : 0
  const profitPct       = monthlySales > 0 ? Math.round((profit / monthlySales) * 100) : 0

  const stale           = useMemo(() => staleProspects(prospects), [prospects])
  const activeProspects = useMemo(() => prospects.filter(p => p.stage !== 'Cliente').length, [prospects])
  const pendingTasks    = useMemo(() => tasks.filter(t => t.status === 'Pendiente' || t.status === 'Bloqueada').length, [tasks])
  const dailyActions    = useMemo(() => buildActions(tasks, prospects, weeklyContent, setActiveModule), [tasks, prospects, weeklyContent])
  const todayPost       = weeklyContent.find(p => !p.published)

  // Dashboard CRM list: stale first, then recent non-stale active, max 3
  const dashProspects = useMemo(() => {
    const staleIds = new Set(stale.map(p => p.id))
    const staleItems = stale.slice(0, 3).map(p => ({ ...p, isStale: true }))
    if (staleItems.length >= 3) return staleItems.slice(0, 3)
    const nonStale = prospects
      .filter(p => !staleIds.has(p.id))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 3 - staleItems.length)
      .map(p => ({ ...p, isStale: false }))
    return [...staleItems, ...nonStale]
  }, [stale, prospects])

  return (
    <div className="overflow-y-auto h-full pb-6" style={{ padding: 20 }}>

      {/* ── Plan del día ──────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #E6F7F4 0%, #EDF9F7 100%)',
          border: '1.5px solid var(--teal-mid)',
          borderRadius: 14,
          padding: 18,
          boxShadow: 'var(--shadow)',
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal-dark)' }}>
              ¡{greeting}, {firstName}! 👋
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, textTransform: 'capitalize' }}>
              {today} · tu plan de hoy
            </div>
          </div>
          <div
            className="flex items-center gap-1"
            style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)', border: '1px solid var(--teal-mid)', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}
          >
            <Sparkles size={12} /> Generado por IA
          </div>
        </div>

        {/* Actions */}
        {dailyActions.map((action, i) => (
          <button
            key={i}
            onClick={action.go}
            className="w-full text-left"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: 12, background: '#fff', border: '1px solid var(--teal-mid)',
              borderRadius: 10, marginBottom: i < 2 ? 8 : 0,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow2)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
          >
            <div
              style={{ ...NUM_STYLES[i], width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}
            >
              {i + 1}
            </div>
            <div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text)', fontWeight: 600 }}>
                {action.title}
              </div>
              {action.desc && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3, fontWeight: 400 }}>
                  {action.desc}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* ── 4 Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-4" style={{ gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Ventas junio',  value: fmt(monthlySales),    color: 'var(--teal)',   sub: `+${Math.max(0, profitPct)}% margen` },
          { label: 'Ganancia',      value: fmt(profit),           color: profit >= 0 ? 'var(--teal)' : 'var(--coral)', sub: `${goalPct}% de la meta` },
          { label: 'Prospectos',    value: activeProspects,       color: 'var(--amber)',  sub: stale.length > 0 ? `${stale.length} urgentes hoy` : 'Al día' },
          { label: 'Tareas',        value: pendingTasks,          color: 'var(--coral)',  sub: pendingTasks > 0 ? `${pendingTasks} pendientes` : 'Todo listo' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E5EF', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#4A4F6A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#8890AB', marginTop: 5, fontWeight: 500 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── g2: Clientes | [Dinero + Contenido] ──────────────────── */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Clientes — revisar hoy */}
        <div style={CARD}>
          <div style={CARD_TITLE}>
            <Users size={16} /> Clientes — revisar hoy
          </div>

          {stale.length > 0 && (
            <div
              className="flex items-center gap-2"
              style={{ background: 'var(--coral-light)', border: '1px solid #FBBCBC', borderRadius: 10, padding: '8px 12px', marginBottom: 10, fontSize: 13, fontWeight: 500, color: 'var(--coral)' }}
            >
              <AlertTriangle size={14} />
              {stale[0].name} lleva +3 días sin contacto
            </div>
          )}

          <div className="flex flex-col gap-2">
            {dashProspects.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                No hay prospectos activos
              </p>
            ) : (
              dashProspects.map(p => {
                const av   = stageAvatar(p.stage)
                const pill = stagePill(p.stage, p.isStale)
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveModule('crm')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                      {initials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>
                        {p.interest}{p.isStale ? ' · +3 días sin contacto' : ''}
                      </div>
                    </div>
                    <div style={{ background: pill.bg, color: pill.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                      {pill.label}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setActiveModule('crm')}
              style={BTN_OUTLINE_SM}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)' }}
            >
              <ArrowRight size={13} /> Ver todos los clientes
            </button>
          </div>
        </div>

        {/* Right column: Dinero + Contenido */}
        <div className="flex flex-col gap-[14px]">

          {/* Dinero del negocio */}
          <div style={CARD}>
            <div style={CARD_TITLE}>
              <Coins size={16} /> Dinero del negocio
            </div>
            <div className="flex items-baseline gap-[6px]" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--teal)' }}>{fmt(monthlySales)}</span>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>de {fmt(goal)} meta</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="flex justify-between" style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 5 }}>
                <span>Progreso</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{goalPct}%</span>
              </div>
              <div style={BAR_TRACK}>
                <div style={{ height: '100%', borderRadius: 8, background: 'var(--teal)', width: `${goalPct}%` }} />
              </div>
            </div>

            <div style={{ marginBottom: 4 }}>
              <div className="flex justify-between" style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 5 }}>
                <span>Gastos</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(monthlyExpenses)}</span>
              </div>
              <div style={BAR_TRACK}>
                <div style={{ height: '100%', borderRadius: 8, background: 'var(--coral)', width: `${expPct}%` }} />
              </div>
            </div>

            <button
              onClick={() => setActiveModule('finanzas')}
              style={{ ...BTN_OUTLINE_SM, marginTop: 4 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)' }}
            >
              <ArrowRight size={13} /> Ver finanzas completas
            </button>
          </div>

          {/* Contenido de hoy */}
          <div style={CARD}>
            <div style={CARD_TITLE}>
              <Feather size={16} /> Contenido de hoy
            </div>

            {todayPost ? (
              <>
                <div
                  className="inline-flex items-center gap-1"
                  style={{ background: 'var(--coral-light)', color: 'var(--coral)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginBottom: 5 }}
                >
                  Venta · {todayPost.platform || 'Instagram'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, marginBottom: 12 }}>
                  {(todayPost.caption || todayPost.content || 'Contenido listo para publicar').slice(0, 100)}…
                </div>
                <button
                  onClick={() => setActiveModule('content')}
                  className="flex items-center gap-1.5"
                  style={{ background: 'var(--teal)', color: '#fff', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-dark)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--teal)' }}
                >
                  <Sparkles size={12} /> Generar con IA
                </button>
              </>
            ) : (
              <>
                <div
                  className="inline-flex items-center gap-1"
                  style={{ background: 'var(--coral-light)', color: 'var(--coral)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, marginBottom: 5 }}
                >
                  Venta · Instagram
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, marginBottom: 12 }}>
                  Tu mejor día de la semana. Sube un reel con resultado de cliente + llamada a acción.
                </div>
                <button
                  onClick={() => setActiveModule('content')}
                  className="flex items-center gap-1.5"
                  style={{ background: 'var(--teal)', color: '#fff', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-dark)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--teal)' }}
                >
                  <Sparkles size={12} /> Generar con IA
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
