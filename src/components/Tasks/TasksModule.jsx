import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  GripVertical, UserCircle, Circle, Clock, Hourglass, CheckCircle2,
} from 'lucide-react'
import { useWorkspaceStore, nameInText } from '../../store/workspaceStore'

// ─── Column definitions ────────────────────────────────────────────────────────
// key = internal store status value; label = display name
const STATUSES = [
  { key: 'Pendiente', label: 'Pendiente', dot: 'var(--coral)',  EmptyIcon: Circle      },
  { key: 'En proceso', label: 'En Proceso', dot: 'var(--teal)',  EmptyIcon: Clock       },
  { key: 'Bloqueada',  label: 'Esperando', dot: 'var(--amber)', EmptyIcon: Hourglass   },
  { key: 'Hecha',      label: 'Listas',    dot: 'var(--green)', EmptyIcon: CheckCircle2 },
]

// ─── Priority meta ─────────────────────────────────────────────────────────────
const PRIORITY = {
  Alta:  { dot: '#DC2626', label: 'Alta prioridad',  color: 'var(--coral)',  bg: 'var(--coral-light)',  border: 'rgba(232,69,69,0.2)' },
  Media: { dot: '#D97706', label: 'Media prioridad', color: 'var(--amber)',  bg: 'var(--amber-light)',  border: 'rgba(217,119,6,0.2)' },
  Baja:  { dot: '#C8CCDC', label: 'Baja prioridad',  color: 'var(--text3)', bg: 'var(--bg)',           border: 'var(--border)' },
}

// ─── Stale prospect detection ─────────────────────────────────────────────────
function getStaleProspects(prospects) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return prospects
    .filter(p => p.stage !== 'Cliente')
    .map(p => {
      const sorted = p.notes?.length
        ? [...p.notes].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        : []
      const lastDate = sorted[0]?.date || p.date || ''
      const daysSince = lastDate
        ? Math.floor((today - new Date(lastDate)) / 864e5)
        : 0
      return { ...p, daysSince }
    })
    .filter(p => p.daysSince > 3)
    .sort((a, b) => b.daysSince - a.daysSince)
}

// ─── Stale banner ─────────────────────────────────────────────────────────────
function StaleBanner({ stale }) {
  if (!stale.length) return null
  const top = stale[0]

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFF9F0, #FFF3DC)',
      border: '1.5px solid #FFD8A0', borderRadius: 12, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>☀️</span>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>
        Tu aviso de hoy a las 8am:{' '}
        <span style={{ color: 'var(--coral)', fontWeight: 700 }}>{top.name}</span>
        {' '}lleva{' '}
        <span style={{ fontWeight: 700 }}>{top.daysSince} días</span>
        {' '}sin contacto — y tienes{' '}
        <span style={{ fontWeight: 700 }}>{stale.length}</span>
        {' '}prospectos pendientes.
      </p>
    </div>
  )
}

// ─── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, index, statusKey, isHighlighted, onProspectBadgeClick }) {
  const [hovered, setHovered] = useState(false)

  const isDone    = statusKey === 'Hecha'
  const isWaiting = statusKey === 'Bloqueada'
  const prio      = PRIORITY[task.priority || 'Media']

  // Card visual style varies by column
  const cardStyle = {
    background: isHighlighted ? 'rgba(0,169,143,0.05)'
              : isDone        ? '#F8F8F8'
              : isWaiting     ? '#FFFBF0'
              : '#fff',
    border: isHighlighted ? '1.5px solid var(--teal-mid)'
          : isWaiting     ? '1.5px solid #FFD8A0'
          : '1px solid #E2E5EF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    userSelect: 'none',
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...provided.draggableProps.style,
            ...cardStyle,
            ...(snapshot.isDragging ? {
              background: '#fff',
              border: '1.5px solid var(--teal-mid)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
              transform: `${provided.draggableProps.style?.transform || ''} rotate(1.5deg)`,
            } : {}),
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {/* Grip handle — visible on hover */}
            <div
              {...provided.dragHandleProps}
              style={{
                marginTop: 1, cursor: 'grab', flexShrink: 0,
                color: hovered || snapshot.isDragging ? '#8890AB' : 'transparent',
                transition: 'color 0.12s',
              }}
            >
              <GripVertical size={14} />
            </div>

            {/* Card content */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Priority badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600,
                padding: '2px 9px', borderRadius: 20,
                background: prio.bg, color: prio.color, border: `1px solid ${prio.border}`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: prio.dot, flexShrink: 0 }} />
                {prio.label}
              </span>

              {/* Title */}
              <div style={{
                fontSize: 14, fontWeight: 700, lineHeight: 1.3,
                color: isDone ? 'var(--text3)' : 'var(--text)',
                textDecoration: isDone ? 'line-through' : 'none',
                margin: '6px 0 4px',
              }}>
                {task.title}
              </div>

              {/* Subtitle */}
              {(task.description || task.date) && (
                <div style={{
                  fontSize: 12, color: 'var(--text2)', lineHeight: 1.45, marginBottom: 8,
                }}>
                  {isDone && task.date
                    ? `Completada el ${task.date}`
                    : task.description
                    ? task.description
                    : task.date}
                </div>
              )}

              {/* Badges row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                {/* "Espera a…" badge for waiting column */}
                {isWaiting && task.prospectName && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                    background: 'var(--amber-light)', color: 'var(--amber)',
                    border: '1px solid rgba(217,119,6,0.2)',
                  }}>
                    Espera a {task.prospectName}
                  </span>
                )}
                {/* Prospect pill (non-done, non-waiting) */}
                {task.prospectName && !isDone && !isWaiting && (
                  <button
                    onClick={e => { e.stopPropagation(); onProspectBadgeClick(task.prospectId) }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600,
                      padding: '2px 9px', borderRadius: 20,
                      background: '#E6F7F4', color: 'var(--teal-dark)',
                      border: '1px solid var(--teal-mid)',
                      cursor: 'pointer',
                    }}
                  >
                    <UserCircle size={11} />
                    {task.prospectName}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

// ─── Kanban column ─────────────────────────────────────────────────────────────
function KanbanColumn({ status, tasks, highlightProspectId, highlightProspectName, onProspectBadgeClick }) {
  const { EmptyIcon } = status

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 8, padding: '8px 12px',
        background: 'var(--surface)', borderRadius: 10,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: status.dot, flexShrink: 0,
        }} />
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#4A4F6A',
          textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {status.label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          minWidth: 22, height: 22, borderRadius: '50%',
          background: '#fff', color: '#4A4F6A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1, borderRadius: 14, padding: 12,
              background: snapshot.isDraggingOver ? 'rgba(0,169,143,0.05)' : '#F0F2F8',
              border: snapshot.isDraggingOver
                ? '2px solid var(--teal-mid)'
                : '2px solid transparent',
              minHeight: 100, transition: 'all 0.12s',
            }}
          >
            {/* Empty state */}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '24px 0', gap: 6,
              }}>
                <EmptyIcon size={18} style={{ color: '#C8CCDC' }} />
                <span style={{ fontSize: 12, color: '#C8CCDC' }}>Sin tareas aquí</span>
              </div>
            )}

            {tasks.map((task, i) => {
              const isHighlighted = !!highlightProspectId && (
                task.prospectId === highlightProspectId ||
                (highlightProspectName && nameInText(highlightProspectName, task.title))
              )
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  statusKey={status.key}
                  isHighlighted={isHighlighted}
                  onProspectBadgeClick={onProspectBadgeClick}
                />
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TasksModule() {
  const tasks                  = useWorkspaceStore(s => s.tasks)
  const prospects              = useWorkspaceStore(s => s.prospects)
  const moveTaskById           = useWorkspaceStore(s => s.moveTaskById)
  const taskHighlightProspectId = useWorkspaceStore(s => s.taskHighlightProspectId)
  const setTaskHighlight       = useWorkspaceStore(s => s.setTaskHighlight)
  const setActiveModule        = useWorkspaceStore(s => s.setActiveModule)
  const setCrmFocus            = useWorkspaceStore(s => s.setCrmFocus)

  const highlightedProspect = taskHighlightProspectId
    ? prospects.find(p => p.id === taskHighlightProspectId)
    : null

  useEffect(() => {
    if (!taskHighlightProspectId) return
    const t = setTimeout(() => setTaskHighlight(null), 3000)
    return () => clearTimeout(t)
  }, [taskHighlightProspectId])

  const staleProspects = getStaleProspects(prospects)

  const handleProspectBadgeClick = (prospectId) => {
    if (!prospectId) return
    setCrmFocus(prospectId)
    setActiveModule('crm')
  }

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return
    if (destination.droppableId === source.droppableId) return
    moveTaskById(draggableId, destination.droppableId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Tus tareas
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          El agente las organiza por prioridad · agrega tareas escribiéndole
        </p>
      </div>

      {/* ── Stale prospect banner ────────────────────────────────── */}
      <StaleBanner stale={staleProspects} />

      {/* ── Kanban board ─────────────────────────────────────────── */}
      {tasks.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          border: '1.5px dashed var(--border)', borderRadius: 14,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
            Sin tareas pendientes
          </p>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Dile a Sherix que tienes una tarea y la agrega al kanban
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{
            display: 'flex', gap: 12, flex: 1,
            overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4,
          }}>
            {STATUSES.map(status => (
              <KanbanColumn
                key={status.key}
                status={status}
                tasks={tasks.filter(t => t.status === status.key)}
                highlightProspectId={taskHighlightProspectId}
                highlightProspectName={highlightedProspect?.name || null}
                onProspectBadgeClick={handleProspectBadgeClick}
              />
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}
