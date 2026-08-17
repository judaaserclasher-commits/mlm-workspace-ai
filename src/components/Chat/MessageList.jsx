import { useEffect, useRef } from 'react'

function formatContent(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

function fmtTime(ts) {
  if (!ts) return ''
  const d = ts instanceof Date ? ts : new Date(ts)
  return isNaN(d) ? '' : d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function Message({ msg, dimmed }) {
  const isBot = msg.role === 'assistant'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isBot ? 'flex-start' : 'flex-end',
      marginBottom: 12,
      opacity: dimmed ? 0.45 : 1,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ maxWidth: '84%', display: 'flex', flexDirection: 'column', alignItems: isBot ? 'flex-start' : 'flex-end' }}>
        {/* Bubble */}
        <div style={isBot ? {
          background: '#fff',
          border: '1px solid #E2E5EF',
          borderRadius: '4px 14px 14px 14px',
          padding: '10px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          fontSize: 13,
          color: 'var(--text)',
          lineHeight: 1.55,
        } : {
          background: 'var(--teal)',
          borderRadius: '14px 4px 14px 14px',
          padding: '10px 14px',
          fontSize: 13,
          color: '#fff',
          fontWeight: 500,
          lineHeight: 1.55,
        }}>
          <span dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
        </div>
        {/* Timestamp */}
        <div style={{
          fontSize: 11,
          color: isBot ? 'var(--text3)' : 'rgba(255,255,255,0.7)',
          marginTop: 4,
          paddingLeft: isBot ? 2 : 0,
          paddingRight: isBot ? 0 : 2,
        }}>
          {fmtTime(msg.timestamp)}
        </div>
      </div>
    </div>
  )
}

function HistorySeparator({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function TypingIndicator({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
      <div style={{
        background: '#fff',
        border: '1px solid #E2E5EF',
        borderRadius: '4px 14px 14px 14px',
        padding: '10px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        maxWidth: '84%',
      }}>
        {text ? (
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
            <span dangerouslySetInnerHTML={{ __html: formatContent(text) }} />
            <span style={{
              display: 'inline-block', width: 2, height: 14, marginLeft: 2,
              background: 'var(--teal)', borderRadius: 1,
              animation: 'pulse 1s ease-in-out infinite',
              verticalAlign: 'middle',
            }} />
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessageList({ messages, isTyping, streamingText, historyCount = 0 }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, streamingText])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      {messages.map((msg, idx) => {
        if (msg.role === 'separator') {
          return <HistorySeparator key={msg.id} label={msg.label} />
        }
        const dimmed = historyCount > 0 && idx < historyCount
        return <Message key={msg.id || idx} msg={msg} dimmed={dimmed} />
      })}
      {isTyping && <TypingIndicator text={streamingText} />}
      <div ref={endRef} />
    </div>
  )
}
