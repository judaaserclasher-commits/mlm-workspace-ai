import { useState, useRef, useEffect } from 'react'
import { Send, RotateCcw, Trophy, Users, CheckCircle2, AlertTriangle, Minus } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import {
  PROFILES,
  evaluateResponse, getSimInit, getClientResponse, generateFeedback,
} from '../../services/SimEngine'

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

// ─── Ping animation ───────────────────────────────────────────────────────────
if (!document.getElementById('sim-anim-style')) {
  const s = document.createElement('style')
  s.id = 'sim-anim-style'
  s.textContent = `
    @keyframes simPing { 75%,100%{ transform:scale(2.2); opacity:0; } }
    .sim-ping { animation: simPing 1.2s cubic-bezier(0,0,.2,1) infinite; }
    @keyframes simBounce { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-4px); } }
    .sim-bounce-1 { animation: simBounce 1s ease infinite 0ms; }
    .sim-bounce-2 { animation: simBounce 1s ease infinite 160ms; }
    .sim-bounce-3 { animation: simBounce 1s ease infinite 320ms; }
  `
  document.head.appendChild(s)
}

// ─── UI profile overrides (display text per spec) ────────────────────────────
const UI_PROFILES = {
  price:      { emoji: '💰', label: '"Es muy caro"',                   desc: 'Compara precios, no ve el valor' },
  tried:      { emoji: '😒', label: '"Ya probé algo así"',             desc: 'Tuvo mala experiencia antes' },
  notime:     { emoji: '⏰', label: '"No tengo tiempo"',               desc: 'Le interesa pero pone pretextos' },
  indecisive: { emoji: '🤔', label: '"No me decido"',                  desc: 'Pospone sin objeción clara' },
  family:     { emoji: '👥', label: '"Mi cuñada vende algo parecido"', desc: 'Familiar en otra MLM' },
  mlm:        { emoji: '🤨', label: '"¿Eso no es pirámide?"',          desc: 'Desconfía del modelo de negocio' },
}

// ─── Eval meta (badges inline) ────────────────────────────────────────────────
const EVAL = {
  good:     { label: '✓ Argumento efectivo', bg: 'var(--green-light)',  color: 'var(--green)',  border: '#BBF7D0' },
  moderate: { label: '~ Aceptable',          bg: 'var(--amber-light)',  color: 'var(--amber)',  border: 'rgba(217,119,6,0.2)' },
  weak:     { label: '⚠ Argumento débil',   bg: 'var(--coral-light)',  color: 'var(--coral)',  border: 'rgba(232,69,69,0.2)' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildLastPractice(sim, feedback) {
  const uip      = UI_PROFILES[sim.profileId] || {}
  const goodTurns = feedback.turnDetails?.filter(t => t.evaluation === 'good') || []
  const weakTurns = feedback.turnDetails?.filter(t => t.evaluation === 'weak') || []

  const positives = goodTurns.length > 0
    ? goodTurns.slice(0, 2).map(t => t.stageName)
    : ['Mantuviste la conversación activa']

  const improvements = (feedback.recommendations || []).slice(0, 2)
    .map(r => r.replace(/^[💡🛡️📣🎯⚡✅]\s*/, '').split('.')[0])

  const clientMsgs = (sim.messages || []).filter(m => m.role === 'client' && m.id !== 'opening')
  const quote = clientMsgs[clientMsgs.length - 1]?.content
             || sim.messages?.[0]?.content
             || ''

  return {
    profileId: sim.profileId,
    emoji: uip.emoji || '🤝',
    label: uip.label || sim.profileId,
    score: feedback.score,
    positives,
    improvements,
    quote: quote.length > 140 ? quote.slice(0, 137) + '…' : quote,
  }
}

// ─── Left panel — profile selector ────────────────────────────────────────────
function ProfileSelector({ selectedProfileId, onSelect, simActive }) {
  return (
    <div style={CARD}>
      <div style={CT}>
        <Users size={13} style={{ color: 'var(--teal)' }} />
        Elige el tipo de cliente
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PROFILES.map(p => {
          const ui         = UI_PROFILES[p.id] || {}
          const isSelected = selectedProfileId === p.id
          const isDisabled = simActive && !isSelected

          return (
            <button
              key={p.id}
              onClick={() => !simActive && onSelect(p.id)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '14px 16px', borderRadius: 10, textAlign: 'left',
                background:    isSelected ? '#E6F7F4' : '#fff',
                border:        isSelected ? '2px solid var(--teal)' : '1.5px solid #E2E5EF',
                cursor:        simActive ? 'default' : 'pointer',
                opacity:       isDisabled ? 0.4 : 1,
                transition:    'all 0.12s',
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>{ui.emoji || p.emoji}</span>
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: isSelected ? 'var(--teal-dark)' : 'var(--text)',
                  marginBottom: 3, lineHeight: 1.2,
                }}>
                  {ui.label || p.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.35 }}>
                  {ui.desc || p.subtitle}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Last practice card ───────────────────────────────────────────────────────
function LastPracticeCard({ data }) {
  if (!data) return null
  const scoreColor = data.score >= 7 ? 'var(--teal-dark)' : data.score >= 4 ? 'var(--amber)' : 'var(--coral)'

  return (
    <div style={CARD}>
      <div style={CT}>
        <Trophy size={13} style={{ color: 'var(--teal)' }} />
        Tu Última Práctica
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{data.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
            {data.label}
          </div>
        </div>
        <span style={{
          fontSize: 16, fontWeight: 800, color: scoreColor,
          background: 'var(--bg)', border: '1.5px solid var(--border)',
          borderRadius: 10, padding: '4px 10px', flexShrink: 0,
        }}>
          {data.score}/10
        </span>
      </div>

      {/* Feedback bullets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {data.positives.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.4 }}>
            <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ color: 'var(--text)' }}>{p}</span>
          </div>
        ))}
        {data.improvements.map((imp, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.4 }}>
            <span style={{ color: 'var(--coral)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✗</span>
            <span style={{ color: 'var(--text)' }}>{imp}</span>
          </div>
        ))}
      </div>

      {/* Blockquote */}
      {data.quote && (
        <div style={{
          borderLeft: '3px solid var(--teal)',
          background: '#E6F7F4', borderRadius: '0 8px 8px 0',
          padding: '10px 12px',
        }}>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--teal-dark)', margin: 0, lineHeight: 1.5 }}>
            "{data.quote}"
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Right panel — empty state ────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      ...CARD, flex: 1,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: 16,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: '#E6F7F4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Users size={32} style={{ color: 'var(--teal)' }} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Elige un perfil y empieza
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, maxWidth: 260, margin: '0 auto' }}>
          El agente actuará como el cliente.{'\n'}
          Tú respondes como lo harías en campo.
        </div>
      </div>
    </div>
  )
}

// ─── Right panel — simulation chat ────────────────────────────────────────────
function SimChat({ sim, onSend, onEnd }) {
  const [input, setInput]   = useState('')
  const bottomRef           = useRef(null)
  const inputRef            = useRef(null)
  const uip                 = UI_PROFILES[sim.profileId] || {}

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sim.messages, sim.isTyping])

  function handleSend() {
    const text = input.trim()
    if (!text || sim.isTyping) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    onSend(text)
  }

  return (
    <div style={{ ...CARD, flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

      {/* Sim header */}
      <div style={{
        padding: '12px 16px', flexShrink: 0,
        background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid #E2E5EF',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Pulsating badge */}
          <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10, flexShrink: 0 }}>
            <span className="sim-ping" style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: '#EF4444', opacity: 0.55,
            }} />
            <span style={{
              position: 'relative', width: 10, height: 10, borderRadius: '50%',
              background: '#EF4444', display: 'inline-block',
            }} />
          </span>
          <span style={{
            fontSize: 11, fontWeight: 800, color: '#EF4444',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            En práctica
          </span>
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            {uip.emoji} {uip.label || sim.clientName}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sim.messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 4,
            }}
          >
            <div
              style={{
                maxWidth: '80%', padding: '10px 14px',
                fontSize: 13, lineHeight: 1.55,
                ...(msg.role === 'user' ? {
                  background: 'var(--teal)',
                  color: '#fff',
                  borderRadius: '14px 4px 14px 14px',
                } : {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px 14px 14px 14px',
                }),
              }}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && msg.evaluation && EVAL[msg.evaluation] && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: '2px 10px', borderRadius: 20,
                background: EVAL[msg.evaluation].bg,
                color: EVAL[msg.evaluation].color,
                border: `1px solid ${EVAL[msg.evaluation].border}`,
              }}>
                {EVAL[msg.evaluation].label}
              </span>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {sim.isTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <div style={{
              padding: '10px 14px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '4px 14px 14px 14px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              <span className="sim-bounce-1" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)', display: 'inline-block' }} />
              <span className="sim-bounce-2" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)', display: 'inline-block' }} />
              <span className="sim-bounce-3" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)', display: 'inline-block' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid #E2E5EF' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Responde a la objeción..."
            rows={1}
            disabled={sim.isTyping}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13,
              resize: 'none', outline: 'none', minHeight: 42, maxHeight: 90,
              background: '#F8F9FC', border: '1.5px solid var(--border)',
              color: 'var(--text)', lineHeight: 1.5,
            }}
            onFocus={e  => { e.target.style.borderColor = 'var(--teal-mid)' }}
            onBlur={e   => { e.target.style.borderColor = 'var(--border)' }}
            onInput={e  => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sim.isTyping}
            style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: !input.trim() || sim.isTyping ? '#F0F2F8' : 'var(--teal)',
              color: !input.trim() || sim.isTyping ? '#C8CCDC' : '#fff',
              border: 'none', cursor: !input.trim() || sim.isTyping ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Send size={15} />
          </button>
        </div>

        {/* Ver feedback button */}
        <button
          onClick={onEnd}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            background: 'transparent',
            color: 'var(--coral)', border: '1.5px solid var(--coral)',
            cursor: 'pointer',
          }}
        >
          Ver feedback
        </button>
      </div>
    </div>
  )
}

// ─── Right panel — feedback screen ────────────────────────────────────────────
function FeedbackScreen({ sim, fb, onRetry, onExit }) {
  const uip = UI_PROFILES[sim.profileId] || {}

  const scoreColor = fb.score >= 7 ? 'var(--teal)'  :
                     fb.score >= 4 ? 'var(--amber)'  : 'var(--coral)'
  const scoreLabel = fb.score >= 7 ? '¡Excelente práctica!' :
                     fb.score >= 4 ? 'Práctica aceptable'   : 'Necesitas más práctica'

  const goodTurns = (fb.turnDetails || []).filter(t => t.evaluation === 'good')
  const weakTurns = (fb.turnDetails || []).filter(t => t.evaluation === 'weak')

  const workedItems = goodTurns.length > 0
    ? goodTurns.map(t => t.stageName)
    : ['Completaste la práctica completa', 'Te mantuviste en conversación']

  const improveItems = weakTurns.length > 0
    ? weakTurns.map(t => t.stageName)
    : ['Refuerza los argumentos clave']

  return (
    <div style={{ ...CARD, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: 18 }}>

      {/* Score circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0' }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          border: `4px solid ${scoreColor}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{fb.score}</span>
          <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>/10</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 4 }}>
            {scoreLabel}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>
            Practicaste con {uip.emoji} {uip.label}
          </div>
        </div>
      </div>

      {/* 2-column grid: worked | improve */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Left — Lo que funcionó */}
        <div style={{
          borderRadius: 12, padding: '14px 16px',
          background: 'var(--green-light)',
          border: '1px solid #BBF7D0',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>
            ✓ Lo que funcionó
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {workedItems.map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                · {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right — A mejorar */}
        <div style={{
          borderRadius: 12, padding: '14px 16px',
          background: 'var(--coral-light)',
          border: '1px solid rgba(232,69,69,0.2)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)', marginBottom: 10 }}>
            ✗ A mejorar
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {improveItems.map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                · {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 recommendation cards */}
      {fb.recommendations?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4A4F6A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Recomendaciones
          </div>
          {fb.recommendations.slice(0, 3).map((rec, i) => (
            <div
              key={i}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: 'var(--surface)', borderRadius: 10, padding: '12px 14px',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'var(--teal)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, marginTop: 1,
              }}>
                {i + 1}
              </span>
              <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
                {rec.replace(/^[💡🛡️📣🎯⚡✅]\s*/, '')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={onRetry}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: 'transparent', color: 'var(--coral)', border: '1.5px solid var(--coral)',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={13} /> Practicar de nuevo
        </button>
        <button
          onClick={onExit}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: 'var(--teal)', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          <Trophy size={13} /> Volver al workspace
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SimulatorModule() {
  const setSimulating = useWorkspaceStore(s => s.setSimulating)

  const [view,              setView]              = useState('config')
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [sim,               setSim]               = useState(null)
  const [feedback,          setFeedback]           = useState(null)
  const [lastPractice,      setLastPractice]       = useState(null)

  const simActive = view === 'sim'

  function startSim() {
    if (!selectedProfileId) return
    const init = getSimInit(selectedProfileId)
    if (!init) return
    setSim({
      profileId:   selectedProfileId,
      clientName:  init.clientName,
      messages:    [{ id: 'opening', role: 'client', content: init.openingMessage }],
      sessionLog:  [],
      clientStage: 0,
      isTyping:    false,
      startTime:   Date.now(),
      endTime:     null,
    })
    setSimulating(true)
    setView('sim')
  }

  function endSim() {
    if (!sim) return
    const finalSim = { ...sim, endTime: Date.now() }
    const fb       = generateFeedback(sim.profileId, sim.sessionLog)
    setSim(finalSim)
    setFeedback(fb)
    setSimulating(false)
    setView('feedback')
  }

  function resetSim() {
    if (sim && feedback) {
      setLastPractice(buildLastPractice(sim, feedback))
    }
    setSim(null)
    setFeedback(null)
    setSimulating(false)
    setView('config')
  }

  async function handleUserMessage(text) {
    if (!sim || sim.isTyping) return
    const { profileId, clientStage, sessionLog } = sim
    const evaluation = evaluateResponse(profileId, text)
    const profile    = PROFILES.find(p => p.id === profileId)
    const shouldAdvance = evaluation === 'good' || evaluation === 'moderate'
    const newClientStage = shouldAdvance
      ? Math.min(clientStage + 1, profile.turns.length)
      : clientStage

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text, evaluation }
    const newLog  = [...sessionLog, { text, evaluation, clientStage,
      stageName: profile.turns[clientStage]?.stageName || 'Cierre' }]

    setSim(prev => ({ ...prev, messages: [...prev.messages, userMsg], isTyping: true, sessionLog: newLog }))

    await new Promise(r => setTimeout(r, 700 + Math.random() * 500))

    const clientResp = getClientResponse(profileId, newClientStage, evaluation)
    const clientMsg  = { id: `c-${Date.now()}`, role: 'client', content: clientResp.message }

    setSim(prev => ({ ...prev, messages: [...prev.messages, clientMsg], clientStage: newClientStage, isTyping: false }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Práctica de ventas
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          El agente actúa como cliente difícil · practica antes de salir a campo
        </p>
      </div>

      {/* ── 2-col body ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>

        {/* Left column — 55% */}
        <div style={{
          width: '55%', flexShrink: 0,
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
          paddingBottom: 4,
        }}>
          {/* Profile selector card */}
          <ProfileSelector
            selectedProfileId={selectedProfileId}
            onSelect={setSelectedProfileId}
            simActive={simActive}
          />

          {/* Start button */}
          <button
            onClick={simActive ? undefined : (view === 'feedback' ? resetSim : startSim)}
            disabled={!simActive && !selectedProfileId}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12,
              fontSize: 14, fontWeight: 700,
              background: simActive ? '#F0F2F8'
                        : !selectedProfileId ? '#F0F2F8'
                        : 'var(--teal)',
              color: simActive ? 'var(--text3)'
                   : !selectedProfileId ? '#C8CCDC'
                   : '#fff',
              border: 'none',
              cursor: !simActive && selectedProfileId ? 'pointer' : 'default',
              boxShadow: !simActive && selectedProfileId ? '0 2px 8px rgba(0,169,143,0.25)' : 'none',
              transition: 'all 0.12s',
            }}
          >
            {simActive ? 'Simulación en curso...' : 'Empezar práctica'}
          </button>

          {/* Last practice card */}
          <LastPracticeCard data={lastPractice} />
        </div>

        {/* Right column — flex-1 (~45%) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {view === 'config' && <EmptyState />}
          {view === 'sim' && sim && (
            <SimChat
              sim={sim}
              onSend={handleUserMessage}
              onEnd={endSim}
            />
          )}
          {view === 'feedback' && sim && feedback && (
            <FeedbackScreen
              sim={sim}
              fb={feedback}
              onRetry={resetSim}
              onExit={resetSim}
            />
          )}
        </div>

      </div>
    </div>
  )
}
