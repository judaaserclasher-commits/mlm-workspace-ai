import { useState } from 'react'
import { Key, Eye, EyeOff, X } from 'lucide-react'

export default function ApiKeyModal({ onSave, onClose }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)

  const handleSave = () => {
    if (value.trim().startsWith('sk-ant-')) onSave(value.trim())
  }

  const isValid = value.trim().startsWith('sk-ant-')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-md mx-4 rounded-2xl shadow-2xl shadow-black/60"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-glow)', border: '1px solid rgba(37,99,235,0.3)' }}
            >
              <Key size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>API Key de Anthropic</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Necesaria para activar Sherix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Tu API Key
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none transition-colors font-mono"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-active)' }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)' }}
              />
              <button
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {value && !isValid && (
              <p className="text-[10px] text-red-400 mt-1">Debe comenzar con "sk-ant-"</p>
            )}
          </div>

          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>¿Cómo obtener tu API key?</p>
            <ol className="text-[11px] space-y-1 list-decimal list-inside" style={{ color: 'var(--text-muted)' }}>
              <li>Ve a console.anthropic.com</li>
              <li>Inicia sesión o crea una cuenta</li>
              <li>Ve a "API Keys" y crea una nueva</li>
              <li>Cópiala y pégala aquí</li>
            </ol>
            <p className="text-[10px] text-amber-400/70 mt-2">
              ⚠ La key se guarda solo en tu sesión local, no en ningún servidor.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-active)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            Activar Sherix
          </button>
        </div>
      </div>
    </div>
  )
}
