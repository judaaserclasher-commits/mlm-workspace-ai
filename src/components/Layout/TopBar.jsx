import { Sun, Moon, LogOut, Shield, Bell } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { logout } from '../../services/firebase'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export default function TopBar({ firebaseUser }) {
  const setActiveModule = useWorkspaceStore(s => s.setActiveModule)
  const isSimulating    = useWorkspaceStore(s => s.isSimulating)
  const clearStore      = useWorkspaceStore(s => s.clearStore)
  const theme           = useWorkspaceStore(s => s.theme)
  const setTheme        = useWorkspaceStore(s => s.setTheme)
  const brandLogoUrl    = useWorkspaceStore(s => s.brandLogoUrl)

  const displayName = firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || null
  const initials    = getInitials(displayName)

  async function handleLogout() { clearStore(); await logout() }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 58, padding: '0 20px', flexShrink: 0,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', zIndex: 10,
      }}
    >
      {/* ── Left: brand ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {brandLogoUrl ? (
          <img
            src={brandLogoUrl} alt="Logo"
            style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => setActiveModule('inicio')}
          />
        ) : (
          <div
            onClick={() => setActiveModule('inicio')}
            style={{
              width: 32, height: 32, borderRadius: 10, background: 'var(--teal)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 700, color: '#fff', cursor: 'pointer', userSelect: 'none',
            }}
          >
            M
          </div>
        )}
        <span
          onClick={() => setActiveModule('inicio')}
          style={{
            fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px',
            color: 'var(--text)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
          }}
        >
          MLM Workspace
        </span>
        {isSimulating && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            border: '1px solid rgba(232,69,69,0.4)',
            background: 'rgba(232,69,69,0.08)', color: 'var(--coral)',
          }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 6, height: 6 }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'var(--coral)', opacity: 0.75,
                animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
              }} />
              <span style={{ position: 'relative', width: 6, height: 6, borderRadius: '50%', background: 'var(--coral)' }} />
            </span>
            <Shield size={9} />
          </div>
        )}
      </div>

      {/* ── Right: controls ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Notification */}
        <button
          title="Notificaciones"
          style={{
            position: 'relative', width: 36, height: 36, borderRadius: 10,
            background: 'var(--amber-light)', border: '1px solid #FFD8A0',
            color: 'var(--amber)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Bell size={16} />
          <div style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--coral)', border: '1.5px solid var(--surface)',
          }} />
        </button>

        {/* Plan badge */}
        <div style={{
          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: '#E6F7F4', color: 'var(--teal-dark)',
          border: '1px solid var(--teal-mid)', whiteSpace: 'nowrap',
        }}>
          Plan Starter
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* User avatar */}
        {displayName && (
          <div
            onClick={() => setActiveModule('perfil')}
            title={displayName}
            style={{
              width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              letterSpacing: '-0.3px', userSelect: 'none', flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: 'transparent', color: 'var(--text3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.6' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <LogOut size={13} />
        </button>
      </div>
    </div>
  )
}
