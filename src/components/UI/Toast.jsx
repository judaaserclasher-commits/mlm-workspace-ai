import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'

const STYLES = {
  success: {
    wrap:    { background: '#fff', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    strip:   '#10B981',
    icon:    CheckCircle2,
    iconClr: '#10B981',
  },
  info: {
    wrap:    { background: '#fff', border: '1px solid rgba(37,99,235,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    strip:   '#2563EB',
    icon:    Info,
    iconClr: '#2563EB',
  },
  warning: {
    wrap:    { background: '#fff', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    strip:   '#F59E0B',
    icon:    AlertTriangle,
    iconClr: '#F59E0B',
  },
}

export default function ToastContainer() {
  const toasts     = useWorkspaceStore(s => s.toasts)
  const removeToast = useWorkspaceStore(s => s.removeToast)

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => {
        const s = STYLES[t.type] || STYLES.info
        const Icon = s.icon
        return (
          <div
            key={t.id}
            className="toast-enter flex items-stretch rounded-xl overflow-hidden pointer-events-auto min-w-[280px] max-w-[380px]"
            style={s.wrap}
          >
            {/* Color accent strip */}
            <div className="w-1 shrink-0" style={{ background: s.strip }} />
            {/* Content */}
            <div className="flex items-center gap-3 px-4 py-3 flex-1">
              <Icon size={15} style={{ color: s.iconClr }} className="shrink-0" />
              <span className="text-sm font-medium leading-snug flex-1" style={{ color: '#0F172A' }}>
                {t.message}
              </span>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 ml-1 transition-colors"
                style={{ color: '#94A3B8' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#475569' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8' }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
