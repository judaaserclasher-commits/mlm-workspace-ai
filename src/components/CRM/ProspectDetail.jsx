import { useState } from 'react'
import { X, Plus, MapPin, Tag, Calendar, ShoppingBag, Network } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'

const STAGE_PILL = {
  'Nuevo':      { bg: '#E6F7F4',            color: 'var(--teal-dark)', border: 'var(--teal-mid)' },
  'Contactado': { bg: 'var(--blue-light)',  color: 'var(--blue)',      border: '#BFDBFE' },
  'Interesado': { bg: 'var(--amber-light)', color: 'var(--amber)',     border: '#FDE68A' },
  'Por cerrar': { bg: 'var(--coral-light)', color: 'var(--coral)',     border: 'rgba(232,69,69,0.35)' },
  'Cliente':    { bg: 'var(--green-light)', color: 'var(--green)',     border: '#BBF7D0' },
}

const STAGE_AVATAR = {
  'Nuevo':      { bg: '#E6F7F4',            color: 'var(--teal-dark)' },
  'Contactado': { bg: 'var(--blue-light)',  color: 'var(--blue)' },
  'Interesado': { bg: 'var(--amber-light)', color: 'var(--amber)' },
  'Por cerrar': { bg: 'var(--coral-light)', color: 'var(--coral)' },
  'Cliente':    { bg: 'var(--green-light)', color: 'var(--green)' },
}

const INTERACTION_DOT = {
  'Primer contacto': 'var(--violet)',
  'Seguimiento':     'var(--blue)',
  'Llamada':         'var(--green)',
  'Mensaje':         'var(--teal)',
  'Sin respuesta':   'var(--amber)',
  'Cambio de etapa': '#A855F7',
  'Reunión':         '#EC4899',
  'Propuesta':       'var(--coral)',
}

const NOTE_TYPES = ['Seguimiento', 'Llamada', 'Mensaje', 'Reunión', 'Sin respuesta', 'Propuesta']

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div style={{ background: '#F0F2F8', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
        <Icon size={11} style={{ color: 'var(--text3)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
        {value || '—'}
      </div>
    </div>
  )
}

export default function ProspectDetail({ prospectId, onClose }) {
  const prospect       = useWorkspaceStore(s => s.prospects.find(p => p.id === prospectId))
  const addInteraction = useWorkspaceStore(s => s.addInteraction)

  const [noteInput, setNoteInput] = useState('')
  const [noteType,  setNoteType]  = useState('Seguimiento')
  const [saving,    setSaving]    = useState(false)

  if (!prospect) return null

  const initials  = prospect.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const av        = STAGE_AVATAR[prospect.stage] || { bg: 'var(--bg)', color: 'var(--text3)' }
  const pill      = STAGE_PILL[prospect.stage]   || STAGE_PILL['Nuevo']
  const OpIcon    = prospect.opportunityType === 'Expansión de red' ? Network : ShoppingBag

  const sortedInteractions = [...(prospect.interactions || [])].sort((a, b) =>
    a.date.localeCompare(b.date) || (a.id > b.id ? 1 : -1)
  )

  const handleAddNote = () => {
    const note = noteInput.trim()
    if (!note) return
    setSaving(true)
    addInteraction(prospect.id, note, noteType)
    setNoteInput('')
    setSaving(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(10,10,15,0.45)',
          backdropFilter: 'blur(1px)',
        }}
      />

      {/* Slide-in panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, zIndex: 50,
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, borderBottom: '1px solid var(--border)',
          padding: '18px 20px', background: 'var(--surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Avatar 56px */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: av.bg, color: av.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px',
            }}>
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {prospect.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`,
                }}>
                  {prospect.stage}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <OpIcon size={11} style={{ color: 'var(--text3)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {prospect.opportunityType || 'Venta directa'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text3)', cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Info tiles ──────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <InfoTile icon={Tag}    label="Interés"         value={prospect.interest} />
            <InfoTile icon={MapPin} label="Zona"            value={prospect.zone} />
            <InfoTile icon={Calendar} label="Primer contacto" value={prospect.date} />
            <InfoTile icon={OpIcon}   label="Tipo"          value={prospect.opportunityType || 'Venta directa'} />
          </div>
        </div>

        {/* ── Timeline ────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 16 }}>
            Historial · {sortedInteractions.length}
          </div>

          {sortedInteractions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text3)' }}>
              Sin interacciones registradas
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Teal vertical line */}
              <div style={{
                position: 'absolute', left: 55, top: 6, bottom: 6,
                width: 2, background: '#E6F7F4', borderRadius: 2,
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {sortedInteractions.map((interaction, i) => {
                  const dot      = INTERACTION_DOT[interaction.type] || 'var(--teal)'
                  const isLatest = i === sortedInteractions.length - 1
                  return (
                    <div key={interaction.id} style={{ display: 'flex', gap: 0, position: 'relative' }}>
                      {/* Date — left side */}
                      <div style={{ width: 44, flexShrink: 0, paddingTop: 3, textAlign: 'right', paddingRight: 0 }}>
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>
                          {interaction.date?.slice(5).replace('-', '/')}
                        </span>
                      </div>

                      {/* Dot centered on the line */}
                      <div style={{ width: 22, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4, zIndex: 2, position: 'relative' }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', background: dot,
                          boxShadow: `0 0 0 3px var(--surface)`,
                        }} />
                      </div>

                      {/* Note — right side */}
                      <div style={{ flex: 1, paddingLeft: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: dot, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {interaction.type}
                          </span>
                          {isLatest && (
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                              background: '#E6F7F4', color: 'var(--teal-dark)',
                            }}>
                              Última
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                          {interaction.note}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Add note form ────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, borderTop: '1px solid var(--border)',
          padding: '14px 20px', background: 'var(--surface)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: 10 }}>
            Registrar interacción
          </div>
          <select
            value={noteType}
            onChange={e => setNoteType(e.target.value)}
            style={{
              width: '100%', marginBottom: 8, borderRadius: 8, padding: '8px 10px',
              fontSize: 12, border: '1.5px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text)', outline: 'none', cursor: 'pointer',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--teal)' }}
            onBlur={e  => { e.target.style.borderColor = 'var(--border)' }}
          >
            {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }}
              placeholder="¿Qué pasó en esta interacción?"
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 12,
                border: '1.5px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text)', outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--teal)' }}
              onBlur={e  => { e.target.style.borderColor = 'var(--border)' }}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteInput.trim() || saving}
              style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: 'var(--teal)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: !noteInput.trim() || saving ? 0.35 : 1,
                transition: 'opacity 0.12s',
              }}
            >
              <Plus size={16} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
