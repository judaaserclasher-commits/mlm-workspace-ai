import { useState, useRef } from 'react'
import { Sun, Moon, Check, Upload, User, Palette, Image, BookOpen, LogOut, FileText, Link, FileEdit, CreditCard, Zap, DollarSign } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { uploadBrandLogo, auth, logout } from '../../services/firebase'
import KnowledgeModule from '../Knowledge/KnowledgeModule'

const ACCENT_COLORS = [
  { hex: '#2563EB', label: 'Azul' },
  { hex: '#7C3AED', label: 'Morado' },
  { hex: '#059669', label: 'Verde' },
  { hex: '#EA580C', label: 'Naranja' },
  { hex: '#DC2626', label: 'Rojo' },
]

const CARD = {
  background: '#fff',
  border: '1px solid #E2E5EF',
  borderRadius: 14,
  padding: 18,
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
}

const CARD_TITLE = {
  fontSize: 12,
  fontWeight: 700,
  color: '#4A4F6A',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 14,
}

const HR = { border: 'none', borderTop: '1px solid #E2E5EF', margin: '0' }

export default function ProfileModule() {
  const {
    userProfile, theme, setTheme,
    accentColor, setAccentColor,
    brandLogoUrl, setBrandLogoUrl,
    uid, clearStore, rag, setUserProfile, addToast,
  } = useWorkspaceStore()

  const currentUser = auth.currentUser
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'
  const email       = currentUser?.email || ''
  const initials    = displayName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview,   setLogoPreview]   = useState(brandLogoUrl || null)
  const [logoError,     setLogoError]     = useState('')
  const fileInputRef = useRef(null)

  // Commission state
  const [commissionModel, setCommissionModel] = useState(userProfile?.commissionModel || 'fixed')
  const [fixedPercent,    setFixedPercent]    = useState(userProfile?.fixedPercent ?? 30)
  const [tiers, setTiers] = useState(userProfile?.tiers || [
    { from: 0,      to: 5000,    percent: 25 },
    { from: 5000,   to: 15000,   percent: 30 },
    { from: 15000,  to: Infinity, percent: 35 },
  ])
  const [pointValue,  setPointValue]  = useState(userProfile?.pointValue ?? 1.5)
  const [minPoints,   setMinPoints]   = useState(userProfile?.minPoints ?? 100)
  const [buyPrice,    setBuyPrice]    = useState(userProfile?.buyPrice ?? 0)
  const [sellPrice,   setSellPrice]   = useState(userProfile?.sellPrice ?? 0)
  const [commSaved,   setCommSaved]   = useState(false)

  function saveCommission() {
    setUserProfile({
      ...userProfile,
      commissionModel,
      fixedPercent: Number(fixedPercent),
      tiers: tiers.map(t => ({ ...t, from: Number(t.from), to: t.to === Infinity ? Infinity : Number(t.to), percent: Number(t.percent) })),
      pointValue: Number(pointValue),
      minPoints: Number(minPoints),
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
    })
    setCommSaved(true)
    setTimeout(() => setCommSaved(false), 2500)
  }

  function addTier() {
    const secondLast = tiers[tiers.length - 2]
    const lastFrom = secondLast ? secondLast.to : 5000
    const newFrom = typeof lastFrom === 'number' && isFinite(lastFrom) ? lastFrom : 5000
    setTiers(prev => {
      const withoutLast = prev.slice(0, -1)
      const newTier = { from: newFrom, to: newFrom + 5000, percent: 30 }
      const last = { ...prev[prev.length - 1], from: newFrom + 5000, to: Infinity }
      return [...withoutLast, newTier, last]
    })
  }

  function removeTier(i) {
    setTiers(prev => {
      const next = prev.filter((_, j) => j !== i)
      if (next.length > 0) next[next.length - 1] = { ...next[next.length - 1], to: Infinity }
      return next
    })
  }

  function updateTier(i, field, val) {
    setTiers(prev => prev.map((t, j) => j === i ? { ...t, [field]: val } : t))
  }

  const { pdfs = [], links = [], notes = [] } = rag || {}

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setLogoError('Solo se permiten imágenes (PNG, JPG).'); return }
    if (file.size > 2 * 1024 * 1024)    { setLogoError('El archivo debe ser menor a 2 MB.'); return }
    if (!uid) { setLogoError('Sesión no iniciada. Recarga la página.'); return }
    setLogoError('')
    setLogoPreview(URL.createObjectURL(file))
    setLogoUploading(true)
    try {
      const url = await uploadBrandLogo(uid, file)
      setBrandLogoUrl(url)
      addToast('✅ Logo actualizado correctamente', 'success')
    } catch (err) {
      const msg = err.message || 'Error desconocido al subir el logo'
      setLogoError(msg)
      setLogoPreview(brandLogoUrl || null)
      addToast(`⚠️ No se pudo subir el logo: ${msg}`, 'error')
      // Reset file input so user can retry
      if (e.target) e.target.value = ''
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleLogout() {
    clearStore()
    await logout()
  }

  return (
    <div className="overflow-y-auto h-full" style={{ background: 'var(--bg)', padding: 20 }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* ── Page header ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
            Tu perfil de distribuidora
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            El agente ya te conoce — así va tu configuración
          </p>
        </div>

        {/* ── Step bar ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {['done', 'curr', 'pend', 'pend'].map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 5, borderRadius: 5,
                background: s === 'done' ? 'var(--teal)' : s === 'curr' ? 'var(--teal-mid)' : '#C8CCDC',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── User info card ────────────────────────────────────────── */}
          <div style={CARD}>
            <div style={CARD_TITLE}>
              <User size={13} style={{ color: 'var(--teal)' }} />
              Información del Perfil
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px',
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{email}</div>
                {userProfile?.brand && (
                  <div
                    style={{
                      display: 'inline-flex', marginTop: 8, padding: '3px 10px',
                      background: '#E6F7F4', color: 'var(--teal-dark)', borderRadius: 20,
                      fontSize: 12, fontWeight: 600, border: '1px solid var(--teal-mid)',
                    }}
                  >
                    {userProfile.brand}
                  </div>
                )}
              </div>
            </div>

            <hr style={HR} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 3 }}>MARCA</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{userProfile?.brand || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 3 }}>PLAN</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal-dark)' }}>Starter</div>
              </div>
            </div>
          </div>

          {/* ── Brand logo card ───────────────────────────────────────── */}
          <div style={CARD}>
            <div style={CARD_TITLE}>
              <Image size={13} style={{ color: 'var(--teal)' }} />
              Logo de tu Marca
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {logoPreview ? (
                <img
                  src={logoPreview} alt="Logo"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                    border: '2px dashed var(--teal-mid)', background: '#E6F7F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Image size={26} style={{ color: 'var(--teal)' }} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div
                  onClick={() => !logoUploading && fileInputRef.current?.click()}
                  style={{
                    border: '1.5px dashed var(--teal-mid)', borderRadius: 10, padding: '14px 16px',
                    background: '#E6F7F4', cursor: logoUploading ? 'default' : 'pointer',
                    textAlign: 'center', marginBottom: 8,
                  }}
                >
                  <Upload size={16} style={{ color: 'var(--teal)', margin: '0 auto 5px', display: 'block' }} />
                  <div style={{ fontSize: 12, color: 'var(--teal-dark)', fontWeight: 600 }}>
                    {logoUploading ? 'Subiendo...' : logoPreview ? 'Cambiar logo' : 'Subir logo'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>PNG o JPG · máx. 2 MB</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                {logoError && (
                  <div style={{ fontSize: 11, color: 'var(--coral)' }}>{logoError}</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Personalization card ──────────────────────────────────── */}
          <div style={CARD}>
            <div style={CARD_TITLE}>
              <Palette size={13} style={{ color: 'var(--teal)' }} />
              Color de la Marca
            </div>

            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
              El color elegido se aplica en toda la interfaz y se guarda en tu cuenta.
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              {ACCENT_COLORS.map(c => {
                const isActive = accentColor === c.hex
                return (
                  <button
                    key={c.hex}
                    onClick={() => setAccentColor(c.hex)}
                    title={c.label}
                    style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: c.hex, cursor: 'pointer', border: 'none', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isActive ? `0 0 0 3px #fff, 0 0 0 5px ${c.hex}` : 'none',
                      transition: 'box-shadow 0.15s',
                    }}
                  >
                    {isActive && <Check size={16} color="#fff" strokeWidth={2.5} />}
                  </button>
                )
              })}
            </div>

            <hr style={HR} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Tema de la interfaz</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {theme === 'dark' ? 'Modo oscuro activo' : 'Modo claro activo'}
                </div>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: 'var(--bg)', border: '1.5px solid var(--border)',
                  color: 'var(--text2)', cursor: 'pointer',
                }}
              >
                {theme === 'dark'
                  ? <><Sun size={14} /> Modo claro</>
                  : <><Moon size={14} /> Modo oscuro</>
                }
              </button>
            </div>
          </div>

          {/* ── Knowledge card ────────────────────────────────────────── */}
          <div style={CARD}>
            <div style={CARD_TITLE}>
              <BookOpen size={13} style={{ color: 'var(--teal)' }} />
              Base de Conocimiento de Sherix
            </div>

            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
              Sherix usa estos recursos para responderte con información precisa de tu negocio.
            </p>

            {/* Summary rows */}
            {[
              { Icon: FileText, label: 'Archivos PDF',          sub: 'Catálogos, precios, presentaciones', count: pdfs.length,  max: 5  },
              { Icon: Link,     label: 'Links web',             sub: 'Sitio de marca, blogs, productos',   count: links.length, max: 10 },
              { Icon: FileEdit, label: 'Notas de conocimiento', sub: 'Precios, argumentos de venta',       count: notes.length, max: 10 },
            ].map(({ Icon, label, sub, count, max }, i, arr) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E6F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{sub}</div>
                  </div>
                  <div
                    style={{
                      fontSize: 12, fontWeight: 700,
                      color: count > 0 ? 'var(--teal-dark)' : 'var(--text3)',
                      background: count > 0 ? '#E6F7F4' : 'var(--bg)',
                      border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px',
                    }}
                  >
                    {count}/{max}
                  </div>
                </div>
                {i < arr.length - 1 && <hr style={HR} />}
              </div>
            ))}

            <hr style={{ ...HR, margin: '0 0 16px 0' }} />

            <KnowledgeModule />
          </div>

          {/* ── Commission structure card ─────────────────────────────── */}
          <div style={CARD}>
            <div style={CARD_TITLE}>
              <DollarSign size={13} style={{ color: 'var(--teal)' }} />
              Estructura de Comisiones
            </div>

            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
              Sherix usará esta configuración para calcular tu comisión real en Finanzas.
            </p>

            {/* Model selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[
                { value: 'fixed',  label: '% Fijo' },
                { value: 'tiered', label: 'Niveles' },
                { value: 'points', label: 'Puntos PV' },
              ].map(m => (
                <button key={m.value} onClick={() => setCommissionModel(m.value)} style={{
                  flex: 1, padding: '9px 6px', borderRadius: 10, cursor: 'pointer', border: 'none',
                  background: commissionModel === m.value ? 'var(--teal)' : '#F0F2F8',
                  color: commissionModel === m.value ? '#fff' : 'var(--text2)',
                  fontSize: 12, fontWeight: 700, transition: 'background 0.15s, color 0.15s',
                }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Fixed percent */}
            {commissionModel === 'fixed' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                  Porcentaje de comisión sobre ventas
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <input
                    type="number" min="1" max="100" value={fixedPercent}
                    onChange={e => setFixedPercent(Number(e.target.value))}
                    style={{ width: 80, padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 18, fontWeight: 700, color: 'var(--teal-dark)', textAlign: 'center', background: 'var(--bg)' }}
                  />
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal-dark)' }}>%</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>de tus ingresos</span>
                </div>
                <div style={{ padding: '8px 12px', background: '#F0FBF9', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
                  Con $10,000 en ventas → comisión: <strong style={{ color: 'var(--teal-dark)' }}>${(10000 * fixedPercent / 100).toLocaleString('es-MX')}</strong>
                </div>
              </div>
            )}

            {/* Tiered */}
            {commissionModel === 'tiered' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Niveles por volumen de ventas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tiers.map((tier, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: '#F8F9FC', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', width: 18, textAlign: 'center' }}>{i + 1}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>De</span>
                      <input
                        type="number" min="0" value={tier.from}
                        onChange={e => updateTier(i, 'from', Number(e.target.value))}
                        style={{ width: 68, padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', textAlign: 'right' }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>a</span>
                      <input
                        type={tier.to === Infinity ? 'text' : 'number'}
                        value={tier.to === Infinity ? '∞' : tier.to}
                        readOnly={tier.to === Infinity}
                        onChange={e => updateTier(i, 'to', Number(e.target.value))}
                        style={{ width: 68, padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: tier.to === Infinity ? '#F0F2F8' : '#fff', textAlign: 'right' }}
                      />
                      <input
                        type="number" min="1" max="100" value={tier.percent}
                        onChange={e => updateTier(i, 'percent', Number(e.target.value))}
                        style={{ width: 52, padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', textAlign: 'right' }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal-dark)' }}>%</span>
                      {tiers.length > 1 && tier.to !== Infinity && (
                        <button onClick={() => removeTier(i)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#E84545', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addTier} style={{
                  marginTop: 8, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: '1.5px dashed var(--teal-mid)', background: '#E6F7F4', color: 'var(--teal-dark)',
                  cursor: 'pointer', width: '100%',
                }}>
                  + Agregar nivel
                </button>
              </div>
            )}

            {/* Points PV */}
            {commissionModel === 'points' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>VALOR POR PUNTO PV ($)</label>
                    <input
                      type="number" min="0" step="0.01" value={pointValue}
                      onChange={e => setPointValue(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 15, fontWeight: 700, color: 'var(--teal-dark)', background: 'var(--bg)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>MÍNIMO DE PUNTOS PV</label>
                    <input
                      type="number" min="0" value={minPoints}
                      onChange={e => setMinPoints(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 15, fontWeight: 700, color: 'var(--teal-dark)', background: 'var(--bg)' }}
                    />
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: '#F0FBF9', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
                  Con 150 PV vendidos → comisión: <strong style={{ color: 'var(--teal-dark)' }}>${(150 * pointValue).toLocaleString('es-MX')}</strong>
                  {150 < minPoints && <span style={{ color: 'var(--coral)', marginLeft: 8 }}>⚠ No alcanza el mínimo de {minPoints} PV</span>}
                </div>
              </div>
            )}

            {/* Buy / sell price */}
            <hr style={{ ...HR, marginBottom: 14 }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Precios de referencia por unidad</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
              {[
                { label: 'PRECIO DISTRIBUIDOR (compra)', val: buyPrice, set: setBuyPrice },
                { label: 'PRECIO CLIENTE (venta)',       val: sellPrice, set: setSellPrice },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text3)', pointerEvents: 'none' }}>$</span>
                    <input
                      type="number" min="0" value={val}
                      onChange={e => set(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px 9px 22px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600, background: 'var(--bg)', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {buyPrice > 0 && sellPrice > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#E6F7F4', borderRadius: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Margen por unidad:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal-dark)' }}>
                  ${(sellPrice - buyPrice).toLocaleString('es-MX')} ({Math.round((sellPrice - buyPrice) / sellPrice * 100)}%)
                </span>
              </div>
            )}

            <button onClick={saveCommission} style={{
              width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
              background: commSaved ? '#059669' : 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'background 0.3s',
            }}>
              {commSaved ? '✓ Guardado' : 'Guardar estructura de comisiones'}
            </button>
          </div>

          {/* ── Account card ──────────────────────────────────────────── */}
          <div style={{ ...CARD, marginBottom: 8 }}>
            <div style={CARD_TITLE}>
              <CreditCard size={13} style={{ color: 'var(--teal)' }} />
              Cuenta y Plan
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Tu plan actual</div>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '6px 18px', borderRadius: 20,
                  background: '#E6F7F4', color: 'var(--teal-dark)',
                  fontSize: 15, fontWeight: 700,
                  border: '1.5px solid var(--teal-mid)',
                }}
              >
                Plan Starter
              </div>
            </div>

            <hr style={{ ...HR, marginBottom: 14 }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: '1.5px solid var(--border)', background: 'transparent',
                  color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
              <button
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Zap size={14} />
                Mejorar plan
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
