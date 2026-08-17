import { useState, useEffect, useRef } from 'react'
import { Radar, Sparkles, ChevronDown, ChevronUp, Trash2, Copy, Check, Search } from 'lucide-react'
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

const CHAT_API = import.meta.env.PROD ? '/chat' : 'http://localhost:3001/chat'

const RADAR_SYSTEM = `Eres Sherix, experta en ventas MLM y prospección. El usuario te describe un entorno o actividad. Analiza y responde SOLO con JSON válido, sin texto adicional, sin markdown:
{"lugar":"nombre corto del lugar","tipo":"venta_directa","probabilidad":"alta","descripcion":"descripción de la oportunidad en 2 líneas","demografico":{"edad":"rango de edad","genero":"predominante","nivel_socioeconomico":"descripción","ocupacion":"típica"},"psicografico":{"motivaciones":["motivación 1","motivación 2","motivación 3"],"dolores":["dolor 1","dolor 2"],"valores":["valor 1","valor 2"]},"palabras_clave":["palabra1","palabra2","palabra3","palabra4","palabra5"],"senales_compra":["señal 1","señal 2","señal 3"],"script_acercamiento":"Script natural de 2-3 oraciones para acercarse a este perfil sin mencionar el negocio directamente","objeciones_comunes":["objeción 1","objeción 2"]}
tipo debe ser exactamente uno de: venta_directa | equipo | mixta
probabilidad debe ser exactamente uno de: alta | media | baja`

const TYPE_META = {
  venta_directa: { label: 'Venta directa', avatarBg: '#E6F7F4', avatarColor: 'var(--teal-dark)' },
  equipo:        { label: 'Equipo',         avatarBg: 'var(--violet-light)', avatarColor: 'var(--violet)' },
  mixta:         { label: 'Mixta',          avatarBg: 'var(--amber-light)',  avatarColor: 'var(--amber)' },
}
const PROB_META = {
  alta:  { label: 'Alta',  bg: 'var(--coral-light)',   color: 'var(--coral)',  border: 'rgba(232,69,69,0.2)' },
  media: { label: 'Media', bg: 'var(--amber-light)',   color: 'var(--amber)',  border: 'rgba(217,119,6,0.2)' },
  baja:  { label: 'Baja',  bg: '#F0F2F8',              color: 'var(--text2)',  border: '#E2E5EF' },
}

function parseRadarJSON(raw) {
  try { return JSON.parse(raw) } catch {}
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(stripped) } catch {}
  const m = stripped.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(m[0]) } catch {} }
  return null
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[80, 60, 100, 50].map((w, i) => (
        <div key={i} style={{
          height: 14, borderRadius: 7, width: `${w}%`,
          background: 'linear-gradient(90deg, #F0F2F8 25%, #E2E5EF 50%, #F0F2F8 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{ ...CARD, padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

// ─── Keyword chip ─────────────────────────────────────────────────────────────
function KeywordChip({ word }) {
  const [copied, setCopied] = useState(false)
  const handleClick = () => {
    navigator.clipboard?.writeText(word).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleClick}
      title="Escucha estas palabras en conversación — son señales de que esta persona puede ser tu cliente"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
        background: copied ? 'var(--teal-light)' : 'var(--teal)',
        color: copied ? 'var(--teal-dark)' : '#fff',
        border: copied ? '1.5px solid var(--teal-mid)' : 'none',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {copied ? <Check size={11} /> : <Search size={11} />}
      {word}
    </button>
  )
}

// ─── Expanded opportunity detail ──────────────────────────────────────────────
function OppDetail({ opp, onRemove, onOpenSimulator }) {
  const [scriptCopied, setScriptCopied] = useState(false)

  const d = opp.demografico || {}
  const p = opp.psicografico || {}

  const copyScript = () => {
    navigator.clipboard?.writeText(opp.script_acercamiento || '').catch(() => {})
    setScriptCopied(true)
    setTimeout(() => setScriptCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, borderTop: '1px solid #E2E5EF' }}>

      {/* Demográfico */}
      {(d.edad || d.genero || d.nivel_socioeconomico || d.ocupacion) && (
        <div>
          <div style={{ ...CT, marginBottom: 10 }}>Perfil demográfico</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Edad', d.edad],
              ['Género', d.genero],
              ['NSE', d.nivel_socioeconomico],
              ['Ocupación', d.ocupacion],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{
                background: '#F5F6FA', borderRadius: 8, padding: '8px 12px',
                fontSize: 12, color: 'var(--text)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{k}</div>
                {v}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Psicográfico */}
      {(p.motivaciones?.length || p.dolores?.length || p.valores?.length) && (
        <div>
          <div style={{ ...CT, marginBottom: 10 }}>Rasgos psicográficos</div>
          {p.motivaciones?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>Motivaciones</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.motivaciones.map((m, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--teal-light)', color: 'var(--teal-dark)', border: '1px solid var(--teal-mid)' }}>{m}</span>
                ))}
              </div>
            </div>
          )}
          {p.dolores?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>Dolores</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.dolores.map((d, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--coral-light)', color: 'var(--coral)', border: '1px solid rgba(232,69,69,0.2)' }}>{d}</span>
                ))}
              </div>
            </div>
          )}
          {p.valores?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>Valores</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.valores.map((v, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--amber-light)', color: 'var(--amber)', border: '1px solid rgba(217,119,6,0.2)' }}>{v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Palabras clave */}
      {opp.palabras_clave?.length > 0 && (
        <div>
          <div style={{ ...CT, marginBottom: 6 }}>
            <Search size={12} />
            Palabras clave a detectar
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.4 }}>
            Escucha estas palabras en conversación — son señales de prospecto potencial
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {opp.palabras_clave.map((w, i) => <KeywordChip key={i} word={w} />)}
          </div>
        </div>
      )}

      {/* Señales de compra */}
      {opp.senales_compra?.length > 0 && (
        <div>
          <div style={{ ...CT, marginBottom: 10 }}>Señales de compra</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {opp.senales_compra.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 5 }} />
                <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Script de acercamiento */}
      {opp.script_acercamiento && (
        <div>
          <div style={{ ...CT, marginBottom: 10 }}>Script de acercamiento</div>
          <div style={{
            background: 'var(--teal-light)', borderLeft: '3px solid var(--teal)',
            borderRadius: '0 8px 8px 0', padding: '12px 14px',
            fontStyle: 'italic', fontSize: 14, color: 'var(--text)', lineHeight: 1.65,
            marginBottom: 10,
          }}>
            "{opp.script_acercamiento}"
          </div>
          <button
            onClick={copyScript}
            style={{
              fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8,
              cursor: 'pointer', background: scriptCopied ? 'var(--teal-light)' : 'transparent',
              color: 'var(--teal-dark)', border: '1.5px solid var(--teal-mid)',
              display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}
          >
            {scriptCopied ? <Check size={12} /> : <Copy size={12} />}
            {scriptCopied ? 'Copiado' : 'Copiar script'}
          </button>
        </div>
      )}

      {/* Objeciones comunes */}
      {opp.objeciones_comunes?.length > 0 && (
        <div>
          <div style={{ ...CT, marginBottom: 10 }}>Objeciones comunes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {opp.objeciones_comunes.map((ob, i) => (
              <button
                key={i}
                onClick={() => onOpenSimulator(ob)}
                title="Click para practicar esta objeción en el Simulador"
                style={{
                  fontSize: 12, padding: '5px 12px', borderRadius: 20,
                  background: 'var(--coral-light)', color: 'var(--coral)',
                  border: '1px solid rgba(232,69,69,0.2)', cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                {ob}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            Toca una objeción para practicarla en el Simulador
          </p>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={onRemove}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8,
          cursor: 'pointer', background: 'transparent',
          color: 'var(--coral)', border: '1.5px solid rgba(232,69,69,0.3)',
          transition: 'all 0.15s', alignSelf: 'flex-start',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--coral-light)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Trash2 size={12} />
        Eliminar oportunidad
      </button>
    </div>
  )
}

// ─── Opportunity card ─────────────────────────────────────────────────────────
function OppCard({ opp, onRemove, onOpenSimulator }) {
  const [expanded, setExpanded] = useState(false)
  const type = TYPE_META[opp.tipo] || TYPE_META.venta_directa
  const prob = PROB_META[opp.probabilidad] || PROB_META.baja
  const initial = (opp.lugar || '?').charAt(0).toUpperCase()

  return (
    <div style={{ ...CARD, transition: 'box-shadow 0.15s' }}>
      {/* Collapsed header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: type.avatarBg, color: type.avatarColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700,
        }}>
          {initial}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{opp.lugar}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: prob.bg, color: prob.color, border: `1px solid ${prob.border}`,
            }}>
              {prob.label}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: '#F0F2F8', color: 'var(--text2)', border: '1px solid #E2E5EF',
            }}>
              {type.label}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, margin: 0 }}>
            {opp.descripcion}
          </p>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', padding: 4, display: 'flex', alignItems: 'center',
          }}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expand/collapse button */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            marginTop: 12, fontSize: 12, fontWeight: 600, padding: '7px 14px',
            borderRadius: 8, cursor: 'pointer', background: 'transparent',
            color: 'var(--teal-dark)', border: '1.5px solid var(--teal-mid)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-light)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          Ver análisis completo
        </button>
      )}

      {/* Expanded content */}
      {expanded && (
        <OppDetail opp={opp} onRemove={onRemove} onOpenSimulator={onOpenSimulator} />
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OportunidadesModule() {
  const radarOpportunities  = useWorkspaceStore(s => s.radarOpportunities)
  const radarPrefilledText  = useWorkspaceStore(s => s.radarPrefilledText)
  const addRadarOpportunity = useWorkspaceStore(s => s.addRadarOpportunity)
  const removeRadarOpportunity = useWorkspaceStore(s => s.removeRadarOpportunity)
  const setRadarPrefilledText  = useWorkspaceStore(s => s.setRadarPrefilledText)
  const setActiveModule        = useWorkspaceStore(s => s.setActiveModule)
  const addToast               = useWorkspaceStore(s => s.addToast)

  const [inputText, setInputText] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const textareaRef = useRef(null)

  // Auto-fill from chat radar suggestion
  useEffect(() => {
    if (radarPrefilledText) {
      setInputText(radarPrefilledText)
      setRadarPrefilledText(null)
      textareaRef.current?.focus()
    }
  }, [radarPrefilledText])

  const stats = {
    total:   radarOpportunities.length,
    alta:    radarOpportunities.filter(o => o.probabilidad === 'alta').length,
    scripts: radarOpportunities.filter(o => o.script_acercamiento).length,
  }

  const handleAnalyze = async () => {
    if (!inputText.trim() || loading) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: RADAR_SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: inputText.trim() }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 2048 },
        }),
      })
      const data = await res.json()
      if (data?.error) throw new Error(data.error.message || 'Error de Vertex AI')
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!raw) throw new Error('Sin respuesta de Sherix')

      const parsed = parseRadarJSON(raw)
      if (!parsed || !parsed.lugar) throw new Error('No se pudo analizar el entorno')

      const opp = {
        id: `radar-${Date.now()}`,
        ...parsed,
        createdAt: new Date().toISOString(),
        sourceText: inputText.trim(),
      }
      addRadarOpportunity(opp)
      addToast('🎯 Oportunidad analizada y guardada en el Radar', 'success')
      setInputText('')
    } catch (err) {
      setError(err.message || 'Error al analizar')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSimulator = (objecion) => {
    setActiveModule('simulator')
  }

  // Add shimmer keyframe once
  useEffect(() => {
    if (document.getElementById('radar-shimmer-style')) return
    const s = document.createElement('style')
    s.id = 'radar-shimmer-style'
    s.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`
    document.head.appendChild(s)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Radar de oportunidades
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          Describe tus entornos y Sherix detecta los mejores perfiles de prospecto
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
        <StatCard label="Entornos activos"   value={stats.total}   color="var(--teal-dark)" />
        <StatCard label="Alta probabilidad"  value={stats.alta}    color="var(--coral)" />
        <StatCard label="Scripts listos"     value={stats.scripts} color="var(--text)" />
      </div>

      {/* ── Add entorno form ──────────────────────────────────────── */}
      <div style={CARD}>
        <div style={CT}>
          <Radar size={14} />
          Agregar entorno o actividad
        </div>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Describe un lugar o actividad donde te mueves... ej: 'Voy al gym cada mañana a las 7am, hay muchas mamás de 30-40 años'"
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px 14px', borderRadius: 10, fontSize: 13,
            color: 'var(--text)', background: '#F5F6FA',
            border: '1px solid #E2E5EF', resize: 'vertical',
            lineHeight: 1.55, outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s', marginBottom: 12,
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.background = '#fff' }}
          onBlur={e  => { e.target.style.borderColor = '#E2E5EF'; e.target.style.background = '#F5F6FA' }}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAnalyze() }}
        />

        {error && (
          <div style={{
            background: 'var(--coral-light)', border: '1px solid rgba(232,69,69,0.25)',
            borderRadius: 8, padding: '9px 13px', marginBottom: 12,
            fontSize: 13, color: 'var(--coral)',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!inputText.trim() || loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 8,
            cursor: !inputText.trim() || loading ? 'not-allowed' : 'pointer',
            background: !inputText.trim() || loading ? '#F0F2F8' : 'var(--teal)',
            color: !inputText.trim() || loading ? 'var(--text3)' : '#fff',
            border: 'none', transition: 'all 0.15s',
          }}
        >
          <Sparkles size={14} />
          {loading ? 'Analizando con Sherix...' : 'Analizar con Sherix'}
        </button>
      </div>

      {/* ── Skeleton while loading ───────────────────────────────── */}
      {loading && <Skeleton />}

      {/* ── Opportunity list ─────────────────────────────────────── */}
      {radarOpportunities.length === 0 && !loading ? (
        <div style={{
          ...CARD, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', textAlign: 'center', gap: 10,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--teal-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Radar size={22} style={{ color: 'var(--teal-dark)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
            Tu radar está vacío
          </p>
          <p style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 280 }}>
            Describe un lugar o actividad donde te mueves y Sherix detectará los mejores perfiles de prospecto.
          </p>
        </div>
      ) : (
        radarOpportunities.map(opp => (
          <OppCard
            key={opp.id}
            opp={opp}
            onRemove={() => {
              removeRadarOpportunity(opp.id)
              addToast('Oportunidad eliminada del Radar', 'info')
            }}
            onOpenSimulator={handleOpenSimulator}
          />
        ))
      )}
    </div>
  )
}
