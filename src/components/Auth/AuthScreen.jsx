import { useState } from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../../services/firebase'

// ─── Error translation ────────────────────────────────────────────────────────
const ERRORS = {
  'auth/user-not-found':          'No existe una cuenta con ese correo.',
  'auth/wrong-password':          'Contraseña incorrecta.',
  'auth/invalid-credential':      'Correo o contraseña incorrectos.',
  'auth/email-already-in-use':    'Este correo ya está registrado.',
  'auth/weak-password':           'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email':           'El correo no tiene un formato válido.',
  'auth/popup-closed-by-user':    'Ventana de Google cerrada. Intenta de nuevo.',
  'auth/cancelled-popup-request': null,
}
function translateError(err) {
  const code = err?.code || ''
  if (ERRORS[code] !== undefined) return ERRORS[code]
  return `[${code || 'sin código'}] ${err?.message || 'Error desconocido'}`
}

// ─── Google logo SVG ──────────────────────────────────────────────────────────
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  )
}

// ─── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  'CRM de clientes y prospectos',
  'Control de ventas y gastos',
  'Contenido con IA — texto, imagen y video',
  'Asistente de campo por WhatsApp',
]

// ─── Input field with label ───────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, error, autoComplete, rightSlot }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#1A1D2E' }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: rightSlot ? '11px 42px 11px 14px' : '11px 14px',
            borderRadius: 10, fontSize: 13, color: '#1A1D2E',
            background: '#F5F6FA',
            border: `1px solid ${error ? 'var(--coral)' : '#E2E5EF'}`,
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = '#00A98F' }}
          onBlur={e  => { if (!error) e.target.style.borderColor = '#E2E5EF' }}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: 12, display: 'flex', alignItems: 'center' }}>
            {rightSlot}
          </div>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: 'var(--coral)', margin: 0 }}>{error}</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  function switchMode(m) { setMode(m); setError(null) }

  async function handleGoogle() {
    setError(null); setLoading(true)
    try { await loginWithGoogle() }
    catch (err) { const msg = translateError(err); if (msg) setError(msg) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password)
      } else {
        if (!name.trim()) { setError('Escribe tu nombre.'); setLoading(false); return }
        await registerWithEmail(email, password, name.trim())
      }
    } catch (err) { setError(translateError(err)) }
    finally { setLoading(false) }
  }

  const isLogin = mode === 'login'

  return (
    <>
      {/* Responsive: hide left column on mobile */}
      <style>{`
        @media (max-width: 767px) { .auth-left { display: none !important; } }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>

        {/* ── Left panel — brand (55%) ────────────────────────────── */}
        <div className="auth-left" style={{
          flex: '0 0 55%', background: '#00A98F', position: 'relative',
          display: 'flex', flexDirection: 'column', padding: 48, overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', right: -120, top: '50%', transform: 'translateY(-50%)',
            width: 480, height: 480, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: -60, bottom: -80,
            width: 280, height: 280, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto', position: 'relative' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: '#fff',
            }}>
              M
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
              MLM Workspace AI
            </span>
          </div>

          {/* Headline + description + features */}
          <div style={{ position: 'relative', marginTop: 'auto', paddingBottom: 8 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, margin: 0, color: '#fff' }}>
              Tu negocio<br />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>organizado</span><br />
              en un solo lugar.
            </h1>

            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6,
              marginTop: 16, marginBottom: 28, maxWidth: 380,
            }}>
              El agente de IA que gestiona tus clientes, tus finanzas y tu contenido — para que tú te enfoques en vender.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={12} color="#fff" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel — form (45%) ─────────────────────────────── */}
        <div style={{
          flex: '1 1 45%', background: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 24px',
        }}>
          <div style={{ width: '100%', maxWidth: 380 }}>

            {/* Sub-tabs */}
            <div style={{
              display: 'flex', background: '#F5F6FA',
              borderRadius: 12, padding: 4, marginBottom: 28,
            }}>
              {[['login', 'Entrar'], ['register', 'Crear cuenta']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 14,
                    fontWeight: mode === key ? 600 : 500,
                    color: mode === key ? '#1A1D2E' : '#6B7280',
                    background: mode === key ? '#fff' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Title */}
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1A1D2E', margin: '0 0 6px' }}>
              {isLogin ? '¡Bienvenida de nuevo!' : '¡Empieza gratis hoy!'}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.5 }}>
              {isLogin
                ? 'Entra a tu workspace para ver tu plan del día.'
                : 'Tu primer mes sin costo. Sin tarjeta de crédito.'}
            </p>

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                color: '#1A1D2E', background: '#fff', border: '1px solid #E2E5EF',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s',
                marginBottom: 16,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = '#C0C4D4' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E5EF' }}
            >
              <GoogleLogo />
              Continuar con Google
            </button>

            {/* Google error */}
            {error && !error.includes('@') && (
              <div style={{
                background: 'var(--coral-light)', border: '1px solid rgba(232,69,69,0.25)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: 'var(--coral)', lineHeight: 1.45,
              }}>
                {error}
              </div>
            )}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#E2E5EF' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                O con correo
              </span>
              <div style={{ flex: 1, height: 1, background: '#E2E5EF' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!isLogin && (
                <Field
                  label="Nombre completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              )}

              <Field
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tunombre@correo.com"
                autoComplete="email"
              />

              <Field
                label="Contraseña"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF', display: 'flex' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              {/* Forgot password */}
              {isLogin && (
                <div style={{ textAlign: 'right', marginTop: -6 }}>
                  <button
                    type="button"
                    style={{ fontSize: 13, color: '#00A98F', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10,
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  background: '#00A98F', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginTop: 4, transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(0,169,143,0.35)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#008F77' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#00A98F' }}
              >
                {loading
                  ? 'Cargando...'
                  : isLogin ? 'Entrar a mi workspace' : 'Crear mi workspace gratis'}
              </button>
            </form>

            {/* Legal */}
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
              Al entrar aceptas nuestros{' '}
              <button type="button" style={{ color: '#00A98F', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>
                Términos de uso
              </button>
              {' '}y{' '}
              <button type="button" style={{ color: '#00A98F', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>
                Política de privacidad
              </button>
            </p>

            {/* Switch mode */}
            <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 20 }}>
              {isLogin ? '¿Aún no tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <button
                type="button"
                onClick={() => switchMode(isLogin ? 'register' : 'login')}
                style={{ color: '#00A98F', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 600 }}
              >
                {isLogin ? 'Créala gratis' : 'Entra aquí'}
              </button>
            </p>

          </div>
        </div>
      </div>
    </>
  )
}
