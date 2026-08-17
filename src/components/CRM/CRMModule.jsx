import { useState, useEffect } from 'react'
import { useWorkspaceStore, nameInText } from '../../store/workspaceStore'
import { AlertTriangle, ShoppingBag, Network, CheckSquare, Users } from 'lucide-react'
import ProspectDetail from './ProspectDetail'

const STAGES = [
  { key: 'Nuevo',      dot: 'var(--teal)'  },
  { key: 'Contactado', dot: 'var(--blue)'  },
  { key: 'Interesado', dot: 'var(--amber)' },
  { key: 'Por cerrar', dot: 'var(--coral)' },
  { key: 'Cliente',    dot: 'var(--green)' },
]

function stageAvatar(stage) {
  if (stage === 'Nuevo')      return { bg: '#E6F7F4',            color: 'var(--teal-dark)' }
  if (stage === 'Contactado') return { bg: 'var(--blue-light)',  color: 'var(--blue)' }
  if (stage === 'Interesado') return { bg: 'var(--amber-light)', color: 'var(--amber)' }
  if (stage === 'Por cerrar') return { bg: 'var(--coral-light)', color: 'var(--coral)' }
  if (stage === 'Cliente')    return { bg: 'var(--green-light)', color: 'var(--green)' }
  return { bg: 'var(--bg)', color: 'var(--text3)' }
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  const [y, m, d] = dateStr.split('-').map(Number)
  const then = new Date(y, m - 1, d); const today = new Date(); today.setHours(0,0,0,0)
  return Math.max(0, Math.floor((today - then) / 86400000))
}

function getLastDate(p) {
  if (!p?.interactions?.length) return p?.date || null
  return [...p.interactions].sort((a, b) => b.date.localeCompare(a.date))[0].date
}

function getStale(prospects) {
  return prospects
    .filter(p => p.stage !== 'Cliente')
    .map(p => ({ ...p, days: daysSince(getLastDate(p)) }))
    .filter(p => p.days > 3)
    .sort((a, b) => b.days - a.days)
}

// ─── Prospect card ────────────────────────────────────────────────────────────
function ProspectCard({ prospect, onOpen, pendingTaskCount, onTasksBadge }) {
  const initials = prospect.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const av       = stageAvatar(prospect.stage)
  const days     = daysSince(getLastDate(prospect))
  const isStale  = days > 3 && prospect.stage !== 'Cliente'
  const isExp    = prospect.opportunityType === 'Expansión de red'
  const OpIcon   = isExp ? Network : ShoppingBag
  const lastDate = getLastDate(prospect)

  return (
    <div
      onClick={() => onOpen(prospect.id)}
      style={{
        background: '#fff', border: '1px solid #E2E5EF', borderRadius: 10, padding: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'grab', flexShrink: 0,
        transition: 'border-color 0.12s, box-shadow 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal-mid)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E5EF'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)' }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: av.bg, color: av.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {prospect.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {prospect.interest}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {isStale && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
              background: 'var(--coral-light)', color: 'var(--coral)',
            }}>
              {days}d sin contacto
            </span>
          )}
          {!isStale && pendingTaskCount > 0 && (
            <button
              onClick={e => { e.stopPropagation(); onTasksBadge(prospect.id) }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                background: 'var(--amber-light)', color: 'var(--amber)',
                border: '1px solid rgba(224,124,0,0.25)', cursor: 'pointer',
              }}
            >
              <CheckSquare size={10} />
              {pendingTaskCount}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <OpIcon size={11} style={{ color: 'var(--text3)' }} />
          {lastDate && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {lastDate.slice(5).replace('-', '/')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Stage column ─────────────────────────────────────────────────────────────
function StageColumn({ stage, prospects, onOpen, pendingTasksMap, onTasksBadge }) {
  return (
    <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: '#F0F2F8', borderRadius: 14, padding: 12,
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        {/* Column header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: stage.dot, flexShrink: 0 }} />
          <span style={{
            fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#4A4F6A', flex: 1,
          }}>
            {stage.key}
          </span>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff', border: '1px solid #E2E5EF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#4A4F6A', flexShrink: 0,
          }}>
            {prospects.length}
          </div>
        </div>

        {/* Cards */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {prospects.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '24px 8px', textAlign: 'center', gap: 6,
            }}>
              <Users size={18} style={{ color: '#C8CCDC' }} />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Sin prospectos aquí todavía</span>
            </div>
          ) : (
            prospects.map(p => (
              <ProspectCard
                key={p.id}
                prospect={p}
                onOpen={onOpen}
                pendingTaskCount={pendingTasksMap[p.id] || 0}
                onTasksBadge={onTasksBadge}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Stale banner ─────────────────────────────────────────────────────────────
function StaleBanner({ staleProspects, onOpen }) {
  if (!staleProspects.length) return null
  const shown = staleProspects.slice(0, 4)
  const extra = staleProspects.length - shown.length

  return (
    <div style={{
      background: 'var(--coral-light)', border: '1px solid var(--coral)',
      borderRadius: 10, padding: '10px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, flexShrink: 0,
    }}>
      <AlertTriangle size={15} style={{ color: 'var(--coral)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--coral)', marginBottom: 7 }}>
          {staleProspects.length} prospecto{staleProspects.length > 1 ? 's' : ''} sin seguimiento
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {shown.map(p => (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              style={{
                fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: '#fff', color: 'var(--coral)',
                border: '1px solid rgba(232,69,69,0.3)', cursor: 'pointer',
              }}
            >
              {p.name} ({p.days}d)
            </button>
          ))}
          {extra > 0 && (
            <span style={{ fontSize: 12, color: 'var(--coral)', padding: '3px 4px' }}>+{extra} más</span>
          )}
        </div>
      </div>
    </div>
  )
}

const STAT_CARD = {
  background: '#fff',
  border: '1px solid #E2E5EF',
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CRMModule() {
  const prospects          = useWorkspaceStore(s => s.prospects)
  const tasks              = useWorkspaceStore(s => s.tasks)
  const crmFocusProspectId = useWorkspaceStore(s => s.crmFocusProspectId)
  const setCrmFocus        = useWorkspaceStore(s => s.setCrmFocus)
  const setActiveModule    = useWorkspaceStore(s => s.setActiveModule)
  const setTaskHighlight   = useWorkspaceStore(s => s.setTaskHighlight)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!crmFocusProspectId) return
    setSelectedId(crmFocusProspectId)
    setCrmFocus(null)
  }, [crmFocusProspectId])

  const handleTasksBadge = id => { setTaskHighlight(id); setActiveModule('tasks') }

  const pendingTasksMap = {}
  prospects.forEach(p => {
    const count = tasks.filter(t =>
      t.status !== 'Hecha' && (t.prospectId === p.id || nameInText(p.name, t.title))
    ).length
    if (count > 0) pendingTasksMap[p.id] = count
  })

  const total   = prospects.length
  const clients = prospects.filter(p => p.stage === 'Cliente').length
  const rate    = total > 0 ? Math.round((clients / total) * 100) : 0
  const stale   = getStale(prospects)

  const STATS = [
    { label: 'Total prospectos', value: total,        sub: 'En tu pipeline',                     color: 'var(--text)' },
    { label: 'Clientes',         value: clients,      sub: 'Conversiones',                       color: 'var(--teal-dark)' },
    { label: 'Tasa de cierre',   value: `${rate}%`,  sub: 'Del total',                          color: 'var(--teal-dark)' },
    { label: 'Sin seguimiento',  value: stale.length, sub: stale.length > 0 ? 'Urgente atender' : 'Todo al día', color: stale.length > 0 ? 'var(--amber)' : 'var(--text3)' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg)', overflow: 'hidden',
    }}>
      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Tus clientes
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          Gestiona tu pipeline y nunca pierdas un seguimiento
        </p>
      </div>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14, flexShrink: 0 }}>
        {STATS.map(s => (
          <div key={s.label} style={STAT_CARD}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4A4F6A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#8890AB', marginTop: 5 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Stale banner ─────────────────────────────────────────── */}
      <StaleBanner staleProspects={stale} onOpen={setSelectedId} />

      {/* ── Kanban ───────────────────────────────────────────────── */}
      {prospects.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          border: '1.5px dashed var(--border)', borderRadius: 14,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
            Aún no tienes prospectos
          </p>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, maxWidth: 240 }}>
            Cuéntale a Sherix sobre alguien que conociste hoy y lo agrego automáticamente
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex', gap: 12, flex: 1,
          overflowX: 'auto', overflowY: 'hidden',
          paddingBottom: 4,
        }}>
          {STAGES.map(stage => (
            <StageColumn
              key={stage.key}
              stage={stage}
              prospects={prospects.filter(p => p.stage === stage.key)}
              onOpen={setSelectedId}
              pendingTasksMap={pendingTasksMap}
              onTasksBadge={handleTasksBadge}
            />
          ))}
        </div>
      )}

      {selectedId && (
        <ProspectDetail prospectId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
