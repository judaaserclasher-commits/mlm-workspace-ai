import { useState, useEffect } from 'react'
import { Briefcase, Wallet } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import BusinessFinance from '../Finance/BusinessFinance'
import PersonalFinance from '../Finance/PersonalFinance'

const TABS = [
  { key: 'business', label: 'Negocio',  icon: Briefcase },
  { key: 'personal', label: 'Personal', icon: Wallet },
]

export default function FinanzasModule() {
  const activeModule = useWorkspaceStore(s => s.activeModule)
  const [subTab, setSubTab] = useState(
    activeModule === 'personal' ? 'personal' : 'business'
  )

  useEffect(() => {
    if (activeModule === 'personal') setSubTab('personal')
    else if (activeModule === 'business') setSubTab('business')
  }, [activeModule])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Tu dinero
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          Negocio y finanzas personales en un solo lugar
        </p>
      </div>

      {/* ── Sub-tabs pill (same style as TopBar nav) ─────────────── */}
      <div style={{ flexShrink: 0, marginBottom: 18 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          gap: 2, background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 3,
        }}>
          {TABS.map(t => {
            const isActive = subTab === t.key
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setSubTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 16px', borderRadius: 20, fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--teal-dark)' : 'var(--text2)',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow)' : 'none',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <Icon size={13} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {subTab === 'business' ? <BusinessFinance /> : <PersonalFinance />}
      </div>
    </div>
  )
}
