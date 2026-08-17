import { useMemo } from 'react'
import { Home, User, Users, Wallet, Feather, CheckSquare, ShieldCheck, Radar, Smartphone } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'

const ITEMS = [
  { key: 'inicio',        label: 'Inicio',    icon: Home },
  { key: 'perfil',        label: 'Perfil',    icon: User },
  'sep',
  { key: 'crm',           label: 'Clientes',  icon: Users,       badge: 'stale' },
  { key: 'finanzas',      label: 'Dinero',    icon: Wallet },
  { key: 'content',       label: 'Contenido', icon: Feather },
  { key: 'tasks',         label: 'Tareas',    icon: CheckSquare, badge: 'tasks' },
  'sep',
  { key: 'simulator',     label: 'Práctica',  icon: ShieldCheck },
  { key: 'oportunidades', label: 'Radar',     icon: Radar },
  { key: 'campo',         label: 'Campo',     icon: Smartphone },
]

const MODULE_GROUPS = {
  inicio:        ['inicio'],
  perfil:        ['perfil', 'knowledge'],
  crm:           ['crm'],
  finanzas:      ['finanzas', 'business', 'personal'],
  content:       ['content'],
  tasks:         ['tasks'],
  simulator:     ['simulator'],
  oportunidades: ['oportunidades'],
  campo:         ['campo'],
}

export default function Sidebar() {
  const activeModule    = useWorkspaceStore(s => s.activeModule)
  const setActiveModule = useWorkspaceStore(s => s.setActiveModule)
  const prospects       = useWorkspaceStore(s => s.prospects)
  const tasks           = useWorkspaceStore(s => s.tasks)

  const staleCount = useMemo(() => prospects.filter(p => {
    if (p.stage === 'Cliente') return false
    const ints = p.interactions || []
    const last = ints.length ? [...ints].sort((a,b) => b.date.localeCompare(a.date))[0].date : p.date || null
    if (!last) return true
    const [y,m,d] = last.split('-').map(Number)
    const then = new Date(y,m-1,d); const now = new Date(); now.setHours(0,0,0,0)
    return (now-then)/86400000 > 3
  }).length, [prospects])

  const pendingCount = useMemo(
    () => tasks.filter(t => t.status === 'Pendiente' || t.status === 'Bloqueada').length,
    [tasks]
  )

  function getBadge(badgeKey) {
    if (badgeKey === 'stale') return staleCount || null
    if (badgeKey === 'tasks') return pendingCount || null
    return null
  }

  return (
    <div
      className="flex flex-col items-center py-2 shrink-0 overflow-y-auto"
      style={{ width: 72, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      {ITEMS.map((item, i) => {
        if (item === 'sep') {
          return (
            <div
              key={`sep-${i}`}
              className="my-1.5"
              style={{ width: 36, height: 1, background: 'var(--border)' }}
            />
          )
        }
        const Icon     = item.icon
        const isActive = MODULE_GROUPS[item.key]?.includes(activeModule)
        const badge    = getBadge(item.badge)

        return (
          <button
            key={item.key}
            onClick={() => setActiveModule(item.key)}
            className="relative flex flex-col items-center justify-center gap-1 rounded-[10px] transition-colors"
            style={{
              width: 52,
              minHeight: 56,
              padding: '8px 4px',
              background: isActive ? '#E6F7F4' : 'transparent',
              color: isActive ? 'var(--teal-dark)' : 'var(--text3)',
            }}
            onMouseEnter={e => {
              if (!isActive) { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text2)' }
            }}
            onMouseLeave={e => {
              if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)' }
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                lineHeight: 1.2,
                textAlign: 'center',
              }}
            >
              {item.label}
            </span>
            {badge && (
              <div
                className="absolute flex items-center justify-center font-bold text-white rounded-full"
                style={{
                  top: 5, right: 5,
                  width: 14, height: 14,
                  fontSize: 8,
                  background: 'var(--coral)',
                  border: '1.5px solid var(--surface)',
                }}
              >
                {badge > 9 ? '9+' : badge}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
