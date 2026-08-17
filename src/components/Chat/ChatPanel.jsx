import { useState, useRef } from 'react'
import { Send, Brain } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { sendMessage } from '../../services/anthropic'
import { fireSaleCelebration } from '../../services/animations'
import MessageList from './MessageList'

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy **Sherix**, tu asistente MLM. Cuéntame qué pasó hoy — ventas, prospectos nuevos, tareas pendientes. Detecto tus intenciones y actualizo los módulos automáticamente.',
  timestamp: new Date(),
}

function buildWelcomeBack(memory) {
  if (!memory) return WELCOME
  const firstName = memory.name ? memory.name.split(' ')[0] : null
  const parts = []
  if (firstName) parts.push(`¡Hola de nuevo, **${firstName}**!`)
  else parts.push('¡Hola de nuevo!')
  if (memory.recentWins?.length) parts.push(`La última vez cerraste con **${memory.recentWins[0]}**.`)
  if (memory.pendingFollowups?.length) parts.push(`Tienes seguimiento pendiente con **${memory.pendingFollowups[0]}**.`)
  parts.push('¿En qué te ayudo hoy?')
  return { id: 'welcome-back', role: 'assistant', content: parts.join(' '), timestamp: new Date() }
}

const EXAMPLES = [
  '¿qué publico hoy?',
  'cerré con Ana $350 de proteína',
  'conocí a Sofía, le interesa nutrición',
  'gasté $500 en inventario',
  '¿cuánto gané este mes?',
]

export default function ChatPanel() {
  const [input, setInput]             = useState('')
  const [streamingText, setStreaming] = useState('')
  const inputRef         = useRef(null)
  const pendingActionRef = useRef(null)

  const {
    messages, chatHistory, memory, rag,
    tasks, prospects, sales, expenses, personalExpenses, userProfile,
    isTyping, addMessage, setTyping, applyActions,
    saveChatTurn, updateMemory,
  } = useWorkspaceStore()

  const hasHistory   = chatHistory.length > 0
  const welcomeMsg   = hasHistory ? buildWelcomeBack(memory) : WELCOME
  const historySlice = chatHistory.slice(-20)

  const separatorItem = { id: 'separator', role: 'separator', label: '— Sesión anterior —' }
  const allMessages = hasHistory
    ? [...historySlice, separatorItem, welcomeMsg, ...messages]
    : [welcomeMsg, ...messages]

  const handleSend = async (text) => {
    const content = (text || input).trim()
    if (!content || isTyping) return

    const userMsg = { role: 'user', content, timestamp: new Date() }
    addMessage(userMsg)
    setInput('')
    setTyping(true)
    setStreaming('')

    if (inputRef.current) inputRef.current.style.height = 'auto'

    try {
      const history = [...messages, userMsg]
      const context = {
        tasks, prospects, sales, expenses, personalExpenses, userProfile,
        pendingAction: pendingActionRef.current,
        chatHistory: historySlice.slice(-10),
        memory,
        rag,
      }
      const result = await sendMessage(history, (partial) => setStreaming(partial), context)

      setStreaming('')
      addMessage({ role: 'assistant', content: result.message, timestamp: new Date(), actions: result.actions })
      applyActions(result.actions)
      pendingActionRef.current = result.pendingAction

      saveChatTurn()
      updateMemory(result.actions)

      if (result.actions?.some(a => a.type === 'ADD_SALE')) {
        fireSaleCelebration()
      }
    } catch (err) {
      setStreaming('')
      addMessage({ role: 'assistant', content: `Algo salió mal: ${err.message}`, timestamp: new Date() })
    } finally {
      setTyping(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: '#fff',
        borderBottom: '1px solid #E2E5EF', flexShrink: 0,
      }}>
        {/* Avatar 40px */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color: '#fff', userSelect: 'none',
        }}>
          SH
        </div>

        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
            Tu consultor IA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            {/* Pulsing green dot */}
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: '#22C55E', opacity: 0.6,
                animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
              }} />
              <span style={{
                position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#22C55E',
              }} />
            </span>
            <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 500 }}>Sherix · En línea ahora</span>
          </div>
        </div>

        {/* "Sherix te recuerda" badge */}
        {hasHistory && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20, flexShrink: 0,
            background: 'var(--teal-light)', color: 'var(--teal-dark)',
            fontSize: 11, fontWeight: 600,
          }}>
            <Brain size={12} />
            Sherix te recuerda
          </div>
        )}
      </div>

      {/* ── Messages ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <MessageList
          messages={allMessages}
          isTyping={isTyping}
          streamingText={streamingText}
          historyCount={hasHistory ? historySlice.length : 0}
        />

        {/* Quick chips — only when current session is empty */}
        {messages.length === 0 && !isTyping && (
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            padding: '8px 16px', flexShrink: 0,
            scrollbarWidth: 'none',
          }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => handleSend(ex)}
                style={{
                  fontSize: 12, padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                  border: '1px solid #E2E5EF', color: 'var(--text2)', background: '#fff',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.12s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--teal)'
                  e.currentTarget.style.color = 'var(--teal-dark)'
                  e.currentTarget.style.background = 'var(--teal-light)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E2E5EF'
                  e.currentTarget.style.color = 'var(--text2)'
                  e.currentTarget.style.background = '#fff'
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Input area ────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 16px', background: '#fff',
        borderTop: '1px solid #E2E5EF', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Input pill */}
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escríbele al agente..."
              rows={1}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#F5F6FA', border: '1px solid #E2E5EF',
                borderRadius: 24, padding: '10px 16px',
                fontSize: 13, color: 'var(--text)', resize: 'none',
                outline: 'none', lineHeight: 1.5,
                minHeight: 42, maxHeight: 100,
                transition: 'border-color 0.15s',
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.background = '#fff' }}
              onBlur={e  => { e.target.style.borderColor = '#E2E5EF'; e.target.style.background = '#F5F6FA' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
              }}
            />
          </div>

          {/* Send button 36px */}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'var(--teal)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: !input.trim() || isTyping ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'var(--teal-dark)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--teal)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Send size={15} style={{ color: '#fff', marginLeft: 1 }} />
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>
          Enter · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  )
}
