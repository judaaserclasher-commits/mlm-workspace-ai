import { useState } from 'react'
import { MessageCircle, AlarmClock, Zap, Clock, Plus, Paperclip, Mic, Send } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useWorkspaceStore } from '../../store/workspaceStore'

// ─── Design tokens ────────────────────────────────────────────────────────────
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

// ─── Hardcoded demo conversation ──────────────────────────────────────────────
const DEMO_MESSAGES = [
  {
    id: 1, from: 'user', text: 'Cerré con Ana, $350 de proteína', time: '8:01',
  },
  {
    id: 2, from: 'sherix',
    text: 'Venta registrada — $350 · Ana M.',
    pills: [
      { label: 'Cliente actualizado', color: 'teal' },
      { label: 'Finanzas +$350', color: 'teal' },
    ],
    followup: '¡Llevas $1,820 este mes! 🔥 ¿Algo más?',
    time: '8:01',
  },
  {
    id: 3, from: 'user', text: 'La clienta dice que es muy caro', time: '8:04',
  },
  {
    id: 4, from: 'sherix',
    text: 'Usa esta respuesta ahora:',
    pills: [{ label: 'Respuesta a objeción', color: 'amber' }],
    blockquote: '\'Entiendo. ¿Cuánto te cuesta seguir sin resolverlo? Mis clientas recuperan la inversión en la primera semana.\'',
    time: '8:04',
  },
  {
    id: 5, from: 'user', text: '[foto del producto] Hazme un video corto para stories', time: '8:09',
  },
  {
    id: 6, from: 'sherix',
    text: 'Veo 3.1 — creando reel 9:16 de 8 segundos con tu foto\nListo en ~30 segundos. ¿También hago el texto del post?',
    pills: [{ label: 'Generando contenido', color: 'violet' }],
    actions: ['Sí, hazlo', 'Solo el video'],
    time: '8:09',
  },
]

const CAPABILITIES = [
  { label: 'Registrar una venta',                desc: 'CRM y finanzas se actualizan solos' },
  { label: 'Responder a una objeción',           desc: 'En menos de 3 segundos' },
  { label: 'Foto del producto → reel',           desc: '8 segundos con Veo 3.1' },
  { label: 'Agregar un prospecto nuevo',          desc: 'Aparece directo en clientes' },
  { label: 'Anotar un pendiente',                desc: 'Aparece en tu tablero de tareas' },
]

const PILL_COLORS = {
  teal:   { bg: 'var(--teal-light)',   color: 'var(--teal-dark)',  border: 'var(--teal-mid)' },
  violet: { bg: 'var(--violet-light)', color: 'var(--violet)',     border: 'rgba(108,92,231,0.25)' },
  amber:  { bg: 'var(--amber-light)',  color: 'var(--amber)',      border: 'rgba(217,119,6,0.2)' },
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.from === 'user'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <div style={{ maxWidth: '72%' }}>
          <div style={{
            background: '#DCF8C6', borderRadius: '8px 0px 8px 8px',
            padding: '8px 12px', fontSize: 13, color: '#111',
            lineHeight: 1.45,
          }}>
            {msg.text}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: '#8A9BB0' }}>{msg.time}</span>
            <span style={{ fontSize: 11, color: '#53BDEB' }}>✓✓</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: '#fff', borderRadius: '0px 8px 8px 8px',
          padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }}>
          {/* Main text */}
          <p style={{ fontSize: 13, color: '#111', lineHeight: 1.5, marginBottom: msg.pills?.length ? 8 : 0, whiteSpace: 'pre-line' }}>
            {msg.text}
          </p>

          {/* Action pills */}
          {msg.pills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: msg.blockquote || msg.followup || msg.actions ? 8 : 0 }}>
              {msg.pills.map((p, i) => {
                const c = PILL_COLORS[p.color] || PILL_COLORS.teal
                return (
                  <span key={i} style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                  }}>
                    {p.label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Blockquote */}
          {msg.blockquote && (
            <div style={{
              borderLeft: '3px solid var(--teal-mid)', paddingLeft: 10,
              margin: '6px 0', fontSize: 13, fontStyle: 'italic',
              color: '#333', lineHeight: 1.5,
            }}>
              {msg.blockquote}
            </div>
          )}

          {/* Follow-up text */}
          {msg.followup && (
            <p style={{ fontSize: 13, color: '#111', lineHeight: 1.5, marginTop: 6 }}>
              {msg.followup}
            </p>
          )}

          {/* Action buttons */}
          {msg.actions?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={{
                fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 7,
                background: 'var(--teal)', color: '#fff', border: 'none', cursor: 'default',
              }}>
                {msg.actions[0]}
              </button>
              <button style={{
                fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 7,
                background: 'transparent', color: 'var(--teal-dark)',
                border: '1.5px solid var(--teal-mid)', cursor: 'default',
              }}>
                {msg.actions[1]}
              </button>
            </div>
          )}
        </div>
        <div style={{ marginTop: 2, paddingLeft: 4 }}>
          <span style={{ fontSize: 10, color: '#8A9BB0' }}>{msg.time}</span>
        </div>
      </div>
    </div>
  )
}

// ─── WhatsApp simulation ───────────────────────────────────────────────────────
function WhatsAppSim() {
  return (
    <div style={{
      ...CARD, padding: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 480,
    }}>
      {/* WA Header */}
      <div style={{
        background: '#075E54', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: '#128C7E', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2,
        }}>
          MLM
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1 }}>MLM Workspace</div>
          <div style={{ fontSize: 12, color: '#4ADE80', marginTop: 2 }}>En línea</div>
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, background: '#ECE5DD', padding: '12px 14px',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {DEMO_MESSAGES.map(msg => <Bubble key={msg.id} msg={msg} />)}
      </div>

      {/* Input bar */}
      <div style={{
        flexShrink: 0, padding: '8px 10px',
        background: '#F0F2F5', display: 'flex', alignItems: 'center', gap: 8,
        borderTop: '1px solid #E2E5EF',
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', borderRadius: 24, padding: '8px 14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }}>
          <Paperclip size={18} style={{ color: '#8A9BB0', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#8A9BB0', flex: 1 }}>Escribe un mensaje...</span>
          <Mic size={18} style={{ color: '#8A9BB0', flexShrink: 0 }} />
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: '#075E54',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Send size={17} style={{ color: '#fff', marginLeft: 2 }} />
        </div>
      </div>

      {/* Simulation badge */}
      <div style={{
        flexShrink: 0, padding: '6px 14px', background: '#FFF9F0',
        borderTop: '1px solid #FFD8A0', textAlign: 'center',
        fontSize: 11, color: 'var(--amber)', fontWeight: 600,
      }}>
        Simulación — conecta WhatsApp próximamente
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CampoModule() {
  const uid = useWorkspaceStore(s => s.uid)
  const [waitlisted, setWaitlisted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleWaitlist = async () => {
    if (!uid || waitlisted) return
    setLoading(true)
    try {
      await setDoc(doc(db, 'waitlist', uid), {
        uid,
        email: '',
        timestamp: new Date().toISOString(),
        feature: 'whatsapp-integration',
      })
      setWaitlisted(true)
    } catch {
      setWaitlisted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 20, gap: 16, boxSizing: 'border-box' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Campo — WhatsApp
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 0 }}>
          Tu asistente en la calle — registra, responde y genera contenido sin abrir la app
        </p>
      </div>

      {/* ── 2-col layout ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', gap: 16, overflow: 'hidden', minHeight: 0 }}>

        {/* Left col — WhatsApp sim (55%) */}
        <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <WhatsAppSim />
        </div>

        {/* Right col — panels (45%) */}
        <div style={{ flex: '0 0 calc(45% - 16px)', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', minHeight: 0, paddingBottom: 4 }}>

          {/* Capabilities card */}
          <div style={CARD}>
            <div style={CT}>
              <MessageCircle size={14} />
              Todo lo que puedes hacer desde WhatsApp
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CAPABILITIES.map((cap, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--teal)', flexShrink: 0, marginTop: 5,
                  }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{cap.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{cap.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Morning alert card */}
          <div style={{
            background: '#FFF9F0', border: '1.5px solid #FFD8A0',
            borderRadius: 12, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlarmClock size={18} style={{ color: 'var(--amber)', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Aviso matutino — 8:00 AM</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
              Cada mañana recibes: tu tarea más importante + cuántos prospectos necesitan atención.
            </p>
          </div>

          {/* Coming soon card */}
          <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={CT}>
                <Zap size={14} />
                Conecta tu WhatsApp
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: 'var(--violet-light)', color: 'var(--violet)',
                border: '1px solid rgba(108,92,231,0.25)', flexShrink: 0, marginTop: -14,
              }}>
                En desarrollo
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14 }}>
              La integración completa con WhatsApp Business llegará en la siguiente versión. Por ahora, todo desde la app.
            </p>
            <button
              onClick={handleWaitlist}
              disabled={loading || waitlisted}
              style={{
                fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 8,
                cursor: loading || waitlisted ? 'default' : 'pointer',
                background: waitlisted ? 'var(--teal-light)' : 'transparent',
                color: waitlisted ? 'var(--teal-dark)' : 'var(--teal-dark)',
                border: waitlisted ? '1.5px solid var(--teal-mid)' : '1.5px solid var(--teal-mid)',
                width: '100%', transition: 'all 0.15s',
              }}
            >
              {waitlisted ? '¡Anotado! Te avisaremos 🎉' : loading ? 'Guardando...' : 'Avisar cuando esté listo'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
