import { useState, useEffect } from 'react'
import {
  Copy, Check, RefreshCw, CheckCircle2, Camera, Globe, MessageCircle, Music,
  Wand2, Feather, BookOpen, Image, Sparkles, Video, Lock, Download,
} from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { generateDayContent, generateWeekContent } from '../../services/ContentEngine'

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

// ─── Static maps ──────────────────────────────────────────────────────────────
const OBJ = {
  Venta:       { bg: 'var(--coral-light)',  color: 'var(--coral)',  border: 'rgba(232,69,69,0.3)' },
  Autoridad:   { bg: 'var(--violet-light)', color: 'var(--violet)', border: 'rgba(108,92,231,0.3)' },
  Crecimiento: { bg: 'var(--blue-light)',   color: 'var(--blue)',   border: 'rgba(37,99,235,0.3)' },
  Interacción: { bg: 'var(--amber-light)',  color: 'var(--amber)',  border: 'rgba(224,124,0,0.3)' },
}

const PLATFORM_ICON = {
  Instagram: Camera,
  TikTok:    Music,
  Facebook:  Globe,
  WhatsApp:  MessageCircle,
}

const PLATFORMS = ['Todos', 'Instagram', 'TikTok', 'Facebook', 'WhatsApp']

const TODAY_STR = new Date().toISOString().slice(0, 10)

const IMAGE_API = import.meta.env.PROD ? '/generate-image' : 'http://localhost:3001/generate-image'

// ─── Image generation constants ───────────────────────────────────────────────
const ASPECT_RATIOS = [
  { key: '1:1',  label: '1:1',  hint: 'Cuadrada' },
  { key: '9:16', label: '9:16', hint: 'Vertical' },
  { key: '16:9', label: '16:9', hint: 'Horizontal' },
]

const STYLES = ['Lifestyle real', 'Minimalista', 'Vibrante', 'Profesional']

const STYLE_PROMPTS = {
  'Lifestyle real': 'candid lifestyle photography, natural warm lighting, authentic people, real moments',
  'Minimalista':    'clean minimal aesthetic, white background, simple elegant composition, modern',
  'Vibrante':       'vibrant bold colors, energetic atmosphere, high contrast, dynamic composition',
  'Profesional':    'professional studio photography, polished corporate look, premium quality',
}

const OBJ_PROMPTS = {
  Venta:       'product showcase, sales promotion, attractive product display',
  Autoridad:   'expert authority figure, educational context, trust and credibility',
  Crecimiento: 'growth mindset, motivation, community success, positive transformation',
  Interacción: 'social engagement, people connecting, lifestyle moment',
}

function buildPrompt(proposal, style) {
  const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS['Lifestyle real']
  const objDesc   = OBJ_PROMPTS[proposal.objective] || 'health and wellness'
  return `Marketing photo for health and wellness MLM product, ${objDesc}, ${styleDesc}, professional photography, LATAM audience, no text overlays, no logos`
}

// ─── Spinner keyframes ────────────────────────────────────────────────────────
if (!document.getElementById('content-spin-style')) {
  const s = document.createElement('style')
  s.id = 'content-spin-style'
  s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
  document.head.appendChild(s)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ObjPill({ objective, small }) {
  const o = OBJ[objective] || OBJ.Autoridad
  return (
    <span style={{
      fontSize: small ? 10 : 11, fontWeight: 600,
      padding: small ? '2px 7px' : '3px 10px', borderRadius: 20,
      background: o.bg, color: o.color, border: `1px solid ${o.border}`,
      whiteSpace: 'nowrap',
    }}>
      {objective}
    </span>
  )
}

// ─── Day Proposal header card (full-width, gradient) ─────────────────────────
function DayProposalCard({ proposal, copiedId, onCopy, onRegenerate, onPublish, onGenerate }) {
  const todayLabel = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  if (!proposal) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #E6F7F4 0%, #EDF9F7 100%)',
        border: '1.5px solid var(--teal-mid)', borderRadius: 14, padding: 28,
        textAlign: 'center',
      }}>
        <Feather size={36} style={{ color: 'var(--teal-mid)', margin: '0 auto 14px', display: 'block' }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Sherix preparará tu contenido de hoy
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 22 }}>
          Un post con estrategia, copy completo y hashtags — en segundos
        </div>
        <button
          onClick={onGenerate}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 22px', borderRadius: 10,
            background: 'var(--teal)', color: '#fff',
            fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
          }}
        >
          <Wand2 size={14} /> Generar con IA
        </button>
      </div>
    )
  }

  const o        = OBJ[proposal.objective] || OBJ.Autoridad
  const PlatIcon = PLATFORM_ICON[proposal.platform] || Camera
  const copied   = copiedId === proposal.id

  return (
    <div style={{
      background: 'linear-gradient(135deg, #E6F7F4 0%, #EDF9F7 100%)',
      border: '1.5px solid var(--teal-mid)', borderRadius: 14, padding: 18,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal-dark)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            HOY
          </span>
          <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'capitalize' }}>{todayLabel}</span>
        </div>
        <ObjPill objective={proposal.objective} />
      </div>

      {/* Platform + format pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
          background: 'rgba(255,255,255,0.7)', color: 'var(--text2)', border: '1px solid var(--border)',
        }}>
          <PlatIcon size={12} style={{ color: o.color }} />
          {proposal.platform}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
          background: 'rgba(255,255,255,0.7)', color: 'var(--text2)', border: '1px solid var(--border)',
        }}>
          {proposal.format}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, lineHeight: 1.3 }}>
        {proposal.title}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onCopy(proposal.copy, proposal.id)}
          style={{
            flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: copied ? 'var(--green-light)' : 'var(--teal)',
            color: copied ? 'var(--green)' : '#fff',
            border: copied ? '1.5px solid #BBF7D0' : 'none', cursor: 'pointer',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '¡Copiado!' : 'Copiar copy'}
        </button>
        <button
          onClick={onRegenerate}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: 'rgba(255,255,255,0.8)', color: 'var(--text2)',
            border: '1.5px solid var(--border)', cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Regenerar
        </button>
        <button
          onClick={onPublish}
          disabled={proposal.published}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: proposal.published ? 'var(--green-light)' : 'rgba(255,255,255,0.8)',
            color: proposal.published ? 'var(--green)' : 'var(--text2)',
            border: `1.5px solid ${proposal.published ? '#BBF7D0' : 'var(--border)'}`,
            cursor: proposal.published ? 'default' : 'pointer',
          }}
        >
          <CheckCircle2 size={13} /> {proposal.published ? 'Publicado ✓' : 'Publicado'}
        </button>
      </div>
    </div>
  )
}

// ─── Copy card (left column of grid) ─────────────────────────────────────────
function CopyCard({ proposal, copiedId, onCopy }) {
  if (!proposal) return null
  const copied = copiedId === `copy-${proposal.id}`

  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
      <div style={CT}>
        <Copy size={13} style={{ color: 'var(--teal)' }} />
        Copy del Post
      </div>

      <div style={{
        flex: 1, background: '#F8F9FC', border: '1px solid #E2E5EF',
        borderRadius: 10, padding: 14, marginBottom: 14, overflowY: 'auto',
        maxHeight: 200,
      }}>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0 }}>
          {proposal.copy}
        </p>
      </div>

      {proposal.hashtags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {proposal.hashtags.map(tag => {
            const hCopied = copiedId === `ht-${tag}`
            return (
              <button
                key={tag}
                onClick={() => onCopy(tag, `ht-${tag}`)}
                title="Click para copiar"
                style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 20, cursor: 'pointer',
                  background: hCopied ? 'var(--green-light)' : '#E6F7F4',
                  color: hCopied ? 'var(--green)' : 'var(--teal-dark)',
                  border: `1px solid ${hCopied ? '#BBF7D0' : 'var(--teal-mid)'}`,
                  fontWeight: 500,
                }}
              >
                {hCopied ? `✓ ${tag}` : tag}
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={() => onCopy(proposal.copy, `copy-${proposal.id}`)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: copied ? 'var(--green-light)' : '#F0F2F8',
          color: copied ? 'var(--green)' : 'var(--text2)',
          border: copied ? '1.5px solid #BBF7D0' : '1.5px solid var(--border)',
          cursor: 'pointer',
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? '¡Copiado!' : 'Copiar texto completo'}
      </button>
    </div>
  )
}

// ─── Image card (right column of grid) ───────────────────────────────────────
function ImageCard({ proposal }) {
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [style,       setStyle]       = useState('Lifestyle real')
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState(null)
  const [error,       setError]       = useState(null)

  async function handleGenerate() {
    if (!proposal) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const prompt = buildPrompt(proposal, style)
      const res = await fetch(IMAGE_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!result) return
    const a = document.createElement('a')
    a.href = `data:${result.mimeType};base64,${result.image}`
    a.download = `sherix-post-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const AR_BOX = {
    '1:1':  { aspectRatio: '1 / 1',  maxWidth: '100%' },
    '9:16': { aspectRatio: '9 / 16', maxWidth: '58%' },
    '16:9': { aspectRatio: '16 / 9', maxWidth: '100%' },
  }

  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
      <div style={CT}>
        <Image size={13} style={{ color: 'var(--teal)' }} />
        Imagen del Post
      </div>

      {/* Format selector */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8890AB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
          Formato
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {ASPECT_RATIOS.map(ar => (
            <button
              key={ar.key}
              onClick={() => setAspectRatio(ar.key)}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: aspectRatio === ar.key ? '#E6F7F4' : '#F0F2F8',
                color: aspectRatio === ar.key ? 'var(--teal-dark)' : 'var(--text2)',
                border: `1.5px solid ${aspectRatio === ar.key ? 'var(--teal-mid)' : 'transparent'}`,
                cursor: 'pointer', textAlign: 'center', lineHeight: 1.3,
              }}
            >
              <div>{ar.label}</div>
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.75, marginTop: 1 }}>{ar.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Style selector */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8890AB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
          Estilo
        </div>
        <select
          value={style}
          onChange={e => setStyle(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 13,
            border: '1.5px solid var(--border)', background: '#F8F9FC',
            color: 'var(--text)', outline: 'none', cursor: 'pointer',
          }}
        >
          {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!proposal || loading}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: loading ? '#F0F2F8' : 'var(--teal)',
          color: loading ? 'var(--text2)' : '#fff',
          border: 'none', cursor: proposal && !loading ? 'pointer' : 'default',
          marginBottom: 14, opacity: !proposal ? 0.5 : 1,
        }}
      >
        {loading ? (
          <>
            <span style={{
              width: 14, height: 14, border: '2px solid #C8CCDC',
              borderTopColor: 'var(--teal)', borderRadius: '50%',
              display: 'inline-block', animation: 'spin 0.8s linear infinite',
            }} />
            Imagen 3 está creando tu imagen...
          </>
        ) : (
          <>
            <Sparkles size={14} /> Generar imagen
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 12,
          background: 'var(--coral-light)', color: 'var(--coral)',
          fontSize: 12, border: '1px solid rgba(232,69,69,0.2)',
        }}>
          {error}
        </div>
      )}

      {/* Image result */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={`data:${result.mimeType};base64,${result.image}`}
              alt="Post generado por Imagen 3"
              style={{
                ...AR_BOX[aspectRatio],
                borderRadius: 10,
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                objectFit: 'cover',
                display: 'block',
                width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDownload}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: 'var(--teal)', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              <Download size={13} /> Descargar
            </button>
            <button
              onClick={handleGenerate}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: '#F0F2F8', color: 'var(--text2)',
                border: '1.5px solid var(--border)', cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} /> Regenerar
            </button>
          </div>
        </div>
      )}

      {/* Placeholder when no result */}
      {!result && !loading && !error && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#F8F9FC', borderRadius: 10, padding: 28,
          border: '1.5px dashed var(--border)', minHeight: 120,
        }}>
          <Image size={28} style={{ color: '#C8CCDC', marginBottom: 8 }} />
          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', margin: 0 }}>
            Selecciona un formato y genera<br />tu imagen con IA
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Video placeholder card (full-width) ─────────────────────────────────────
function VideoCard() {
  return (
    <div style={CARD}>
      <div style={{ ...CT, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Video size={13} style={{ color: 'var(--teal)' }} />
          Video Reel
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
          background: 'var(--violet-light)', color: 'var(--violet)',
          border: '1px solid rgba(108,92,231,0.3)', letterSpacing: '0.04em',
        }}>
          PRO
        </span>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', borderRadius: 10, padding: '32px 20px',
        border: '1.5px dashed var(--border)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
        }}>
          <Video size={22} style={{ color: 'var(--text3)' }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Generación de video
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18, textAlign: 'center' }}>
          Disponible próximamente en Plan Pro
        </div>
        <button
          disabled
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: '#F0F2F8', color: '#C8CCDC',
            border: '1.5px solid var(--border)', cursor: 'not-allowed',
          }}
        >
          <Lock size={13} /> Crear Reel con IA
        </button>
      </div>
    </div>
  )
}

// ─── Day card (7-col grid) ────────────────────────────────────────────────────
function DayCard({ item, isToday, isSelected, onSelect }) {
  const o        = OBJ[item.objective] || OBJ.Autoridad
  const PlatIcon = PLATFORM_ICON[item.platform] || Camera

  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: 10, padding: 12,
        background: isToday ? '#E6F7F4' : '#F0F2F8',
        border: isSelected || isToday ? '2px solid var(--teal)' : '1px solid #E2E5EF',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.05em', color: isToday ? 'var(--teal-dark)' : '#4A4F6A',
        }}>
          {item.dayShort}
        </span>
        {item.published && (
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)' }}>✓</span>
        )}
      </div>
      <ObjPill objective={item.objective} small />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7, marginBottom: 6 }}>
        <PlatIcon size={11} style={{ color: o.color }} />
        <span style={{ fontSize: 11, color: '#4A4F6A' }}>{item.platform}</span>
      </div>
      <div style={{
        fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {item.title}
      </div>
    </div>
  )
}

// ─── Expanded day panel ───────────────────────────────────────────────────────
function ExpandedDay({ item, copiedId, onCopy, onClose }) {
  const o        = OBJ[item.objective] || OBJ.Autoridad
  const PlatIcon = PLATFORM_ICON[item.platform] || Camera
  const copied   = copiedId === item.id

  return (
    <div style={{
      marginTop: 12, padding: 16, borderRadius: 12,
      background: '#fff', border: '1.5px solid var(--teal-mid)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ObjPill objective={item.objective} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text2)' }}>
            <PlatIcon size={12} style={{ color: o.color }} />{item.platform} · {item.format}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ fontSize: 18, lineHeight: 1, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10, lineHeight: 1.3 }}>
        {item.title}
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: 12 }}>
        {item.copy}
      </p>
      {item.hashtags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {item.hashtags.map(tag => (
            <span key={tag} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: '#E6F7F4', color: 'var(--teal-dark)',
              border: '1px solid var(--teal-mid)', fontWeight: 500,
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={() => onCopy(item.copy, item.id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: copied ? 'var(--green-light)' : 'var(--teal)',
          color: copied ? 'var(--green)' : '#fff',
          border: copied ? '1.5px solid #BBF7D0' : 'none', cursor: 'pointer',
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? '¡Copiado!' : 'Copiar copy'}
      </button>
    </div>
  )
}

// ─── Weekly calendar card ─────────────────────────────────────────────────────
function WeekCalendar({ weeklyContent, selectedDay, setSelectedDay, copiedId, onCopy, onGenerateWeek }) {
  return (
    <div style={CARD}>
      <div style={{ ...CT, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Feather size={13} style={{ color: 'var(--teal)' }} />
          Semana de Contenido
        </div>
        <button
          onClick={onGenerateWeek}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: 'var(--teal)', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          <Wand2 size={12} />
          {weeklyContent.length > 0 ? 'Regenerar semana' : 'Generar semana'}
        </button>
      </div>

      {weeklyContent.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ fontSize: 30, marginBottom: 12 }}>📅</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
            7 días de contenido estratégico con copy completo
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>
            Haz clic en "Generar semana" para empezar
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {weeklyContent.map(item => (
              <DayCard
                key={item.id}
                item={item}
                isToday={item.date === TODAY_STR}
                isSelected={selectedDay === item.id}
                onSelect={() => setSelectedDay(selectedDay === item.id ? null : item.id)}
              />
            ))}
          </div>
          {selectedDay && (() => {
            const item = weeklyContent.find(i => i.id === selectedDay)
            return item ? (
              <ExpandedDay
                item={item}
                copiedId={copiedId}
                onCopy={onCopy}
                onClose={() => setSelectedDay(null)}
              />
            ) : null
          })()}
        </>
      )}
    </div>
  )
}

// ─── Content bank card ────────────────────────────────────────────────────────
function ContentBank({ posts, allPosts, platformFilter, setPlatformFilter }) {
  if (allPosts.length === 0) return null

  return (
    <div style={CARD}>
      <div style={{ ...CT, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={13} style={{ color: 'var(--teal)' }} />
          Publicados
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 20,
            background: '#E6F7F4', color: 'var(--teal-dark)',
          }}>
            {allPosts.length}
          </span>
        </div>
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center',
        gap: 2, background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 3, marginBottom: 14,
      }}>
        {PLATFORMS.map(p => {
          const isActive = p === 'Todos' ? platformFilter === 'all' : platformFilter === p
          return (
            <button
              key={p}
              onClick={() => setPlatformFilter(p === 'Todos' ? 'all' : p)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--teal-dark)' : 'var(--text2)',
                background: isActive ? 'var(--surface)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow)' : 'none',
                border: 'none', cursor: 'pointer',
              }}
            >
              {p}
            </button>
          )
        })}
      </div>

      {posts.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>
          Sin posts con este filtro
        </p>
      ) : (
        posts.map((post, i) => {
          const o        = OBJ[post.objective] || OBJ.Autoridad
          const PlatIcon = PLATFORM_ICON[post.platform] || Camera
          return (
            <div key={post.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
              borderBottom: i < posts.length - 1 ? '1px solid #F0F2F8' : 'none',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, width: 60 }}>
                {post.publishedAt || post.date}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: 'rgba(255,255,255,0.7)', color: '#4A4F6A',
                border: '1px solid var(--border)', flexShrink: 0,
              }}>
                <PlatIcon size={10} style={{ color: o.color }} />
                {post.platform}
              </span>
              <ObjPill objective={post.objective} small />
              <span style={{
                flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {post.title}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ContentModule() {
  const weeklyContent          = useWorkspaceStore(s => s.weeklyContent)
  const publishedContent       = useWorkspaceStore(s => s.publishedContent)
  const contentDayProposal     = useWorkspaceStore(s => s.contentDayProposal)
  const contentGenerateTrigger = useWorkspaceStore(s => s.contentGenerateTrigger)
  const setWeeklyContent       = useWorkspaceStore(s => s.setWeeklyContent)
  const setContentDayProposal  = useWorkspaceStore(s => s.setContentDayProposal)
  const publishPost            = useWorkspaceStore(s => s.publishPost)
  const userProfile            = useWorkspaceStore(s => s.userProfile)

  const [selectedDay,    setSelectedDay]    = useState(null)
  const [copiedId,       setCopiedId]       = useState(null)
  const [platformFilter, setPlatformFilter] = useState('all')

  useEffect(() => {
    if (!contentDayProposal) {
      setContentDayProposal(generateDayContent(TODAY_STR, userProfile))
    }
  }, [])

  useEffect(() => {
    if (contentGenerateTrigger > 0) handleGenerateWeek()
  }, [contentGenerateTrigger])

  function handleGenerateWeek() {
    const items = generateWeekContent(userProfile)
    setWeeklyContent(items)
    const todayItem = items.find(i => i.date === TODAY_STR)
    if (todayItem) setContentDayProposal(todayItem)
  }

  function handleRegenerate() {
    setContentDayProposal(generateDayContent(TODAY_STR, userProfile, contentDayProposal?.objective))
  }

  function handleGenerate() {
    setContentDayProposal(generateDayContent(TODAY_STR, userProfile))
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredPublished = publishedContent.filter(p =>
    platformFilter === 'all' || p.platform === platformFilter
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Tu contenido
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          Publica con estrategia, crece con consistencia
        </p>
      </div>

      {/* ── Scrollable content ────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>

        {/* Propuesta del día (full-width gradient card) */}
        <DayProposalCard
          proposal={contentDayProposal}
          copiedId={copiedId}
          onCopy={handleCopy}
          onRegenerate={handleRegenerate}
          onPublish={() => contentDayProposal && publishPost(contentDayProposal.id)}
          onGenerate={handleGenerate}
        />

        {/* 2-col grid: Copy | Imagen (only when proposal exists) */}
        {contentDayProposal && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            <CopyCard
              proposal={contentDayProposal}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
            <ImageCard proposal={contentDayProposal} />
          </div>
        )}

        {/* Video Reel placeholder */}
        <VideoCard />

        {/* Calendario semanal */}
        <WeekCalendar
          weeklyContent={weeklyContent}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          copiedId={copiedId}
          onCopy={handleCopy}
          onGenerateWeek={handleGenerateWeek}
        />

        {/* Banco de contenido (solo si hay publicados) */}
        <ContentBank
          posts={filteredPublished}
          allPosts={publishedContent}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
        />

      </div>
    </div>
  )
}
