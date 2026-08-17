import { useState, useRef, useCallback } from 'react'
import { FileText, Link, FileEdit, Trash2, Plus, Upload, X, BookOpen, Loader } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'

// ── PDF text extraction ───────────────────────────────────────────────────────
async function extractPdfText(file) {
  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  const maxPages = Math.min(pdf.numPages, 30)
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(item => item.str).join(' ') + '\n'
    if (text.length > 12000) break
  }
  return text.trim().slice(0, 12000)
}

// ── URL fetcher (via server proxy) ────────────────────────────────────────────
async function fetchUrlContent(url) {
  try {
    const proxyUrl = import.meta.env.PROD ? '/fetch-url' : 'http://localhost:3001/fetch-url'
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) return null
    const { html } = await res.json()
    if (!html) return null
    const doc = new DOMParser().parseFromString(html, 'text/html')
    doc.querySelectorAll('script,style,nav,footer,header,aside').forEach(el => el.remove())
    const text = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim()
    const title = doc.querySelector('title')?.textContent?.trim() || url
    return { text: text.slice(0, 10000), title }
  } catch {
    return null
  }
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, count, max }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} style={{ color: 'var(--accent)' }} />
      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
        {count}/{max}
      </span>
    </div>
  )
}

// ── PDF Section ───────────────────────────────────────────────────────────────
function PdfSection({ pdfs, onSave, addToast }) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(null) // filename being processed
  const fileInputRef = useRef(null)
  const MAX = 5

  async function processFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      addToast('Solo se aceptan archivos PDF', 'warning'); return
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('El archivo supera el límite de 10MB', 'warning'); return
    }
    if (pdfs.length >= MAX) {
      addToast(`Máximo ${MAX} PDFs permitidos`, 'warning'); return
    }
    if (pdfs.some(p => p.name === file.name)) {
      addToast('Ya existe un PDF con ese nombre', 'warning'); return
    }

    setUploading(file.name)
    try {
      const text = await extractPdfText(file)
      const newPdf = {
        id: `pdf-${Date.now()}`,
        name: file.name,
        size: file.size,
        text,
        uploadedAt: new Date().toISOString(),
      }
      onSave([...pdfs, newPdf])
      addToast(`📄 ${file.name} agregado al conocimiento`, 'success')
    } catch (err) {
      addToast(`Error al procesar PDF: ${err.message}`, 'warning')
    } finally {
      setUploading(null)
    }
  }

  const handleDrop = useCallback(async (e) => {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    for (const f of files) await processFile(f)
  }, [pdfs])

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    for (const f of files) await processFile(f)
    e.target.value = ''
  }

  function remove(id) {
    onSave(pdfs.filter(p => p.id !== id))
    addToast('PDF eliminado', 'info')
  }

  const fmt = (bytes) => bytes > 1024*1024 ? `${(bytes/1024/1024).toFixed(1)} MB` : `${(bytes/1024).toFixed(0)} KB`

  return (
    <div className="mb-6">
      <SectionHeader icon={FileText} title="Archivos PDF" count={pdfs.length} max={MAX} />

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all mb-3"
        style={{
          borderColor: dragging ? 'var(--accent)' : 'var(--border)',
          background: dragging ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
        }}
      >
        {uploading ? (
          <>
            <Loader size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Extrayendo texto de <strong>{uploading}</strong>...</p>
          </>
        ) : (
          <>
            <Upload size={20} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Arrastra PDFs aquí o <span style={{ color: 'var(--accent)', fontWeight: 600 }}>haz clic para seleccionar</span>
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Máx. 10MB · Hasta {MAX} archivos</p>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFileChange} />

      {/* PDF list */}
      {pdfs.length === 0 ? (
        <p className="text-[11px] text-center py-2" style={{ color: 'var(--text-muted)' }}>
          No hay PDFs. Sube tu catálogo, lista de precios o presentación.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {pdfs.map(pdf => (
            <div
              key={pdf.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent)', borderLeftWidth: 3 }}
            >
              <FileText size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{pdf.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {fmt(pdf.size)} · {new Date(pdf.uploadedAt).toLocaleDateString('es-MX')}
                  {pdf.text ? ` · ${pdf.text.length.toLocaleString()} chars extraídos` : ''}
                </p>
              </div>
              <button onClick={() => remove(pdf.id)} className="p-1 rounded hover:opacity-70 transition-opacity shrink-0" style={{ color: 'var(--text-muted)' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Links Section ─────────────────────────────────────────────────────────────
function LinksSection({ links, onSave, addToast }) {
  const [url, setUrl]         = useState('')
  const [loading, setLoading] = useState(false)
  const MAX = 10

  async function addLink() {
    const trimmed = url.trim()
    if (!trimmed) return
    if (links.length >= MAX) { addToast(`Máximo ${MAX} links`, 'warning'); return }
    if (links.some(l => l.url === trimmed)) { addToast('Este link ya está agregado', 'warning'); return }

    let fullUrl = trimmed
    if (!/^https?:\/\//i.test(fullUrl)) fullUrl = 'https://' + fullUrl

    setLoading(true)
    try {
      const result = await fetchUrlContent(fullUrl)
      const newLink = {
        id: `link-${Date.now()}`,
        url: fullUrl,
        title: result?.title || fullUrl,
        text: result?.text || null,
        addedAt: new Date().toISOString(),
      }
      onSave([...links, newLink])
      setUrl('')
      addToast(result ? `🔗 Link agregado con contenido extraído` : `🔗 Link guardado (sin texto — CORS)`, 'success')
    } finally {
      setLoading(false)
    }
  }

  function remove(id) {
    onSave(links.filter(l => l.id !== id))
    addToast('Link eliminado', 'info')
  }

  return (
    <div className="mb-6">
      <SectionHeader icon={Link} title="Links web" count={links.length} max={MAX} />

      <div className="flex gap-2 mb-3">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && addLink()}
          placeholder="https://tu-sitio.com/catalogo"
          className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <button
          onClick={addLink}
          disabled={!url.trim() || loading || links.length >= MAX}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40 shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
          {loading ? 'Cargando...' : 'Agregar'}
        </button>
      </div>

      {links.length === 0 ? (
        <p className="text-[11px] text-center py-2" style={{ color: 'var(--text-muted)' }}>
          Pega la URL de tu catálogo, página de producto o blog de marca.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {links.map(link => (
            <div
              key={link.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent)', borderLeftWidth: 3 }}
            >
              <Link size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {link.title && link.title !== link.url ? link.title : link.url}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {link.url} · {new Date(link.addedAt).toLocaleDateString('es-MX')}
                  {link.text ? '' : ' · solo URL'}
                </p>
              </div>
              <button onClick={() => remove(link.id)} className="p-1 rounded hover:opacity-70 transition-opacity shrink-0" style={{ color: 'var(--text-muted)' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Notes Section ─────────────────────────────────────────────────────────────
function NotesSection({ notes, onSave, addToast }) {
  const [content, setContent] = useState('')
  const MAX = 10

  function addNote() {
    const trimmed = content.trim()
    if (!trimmed) return
    if (notes.length >= MAX) { addToast(`Máximo ${MAX} notas`, 'warning'); return }
    const newNote = { id: `note-${Date.now()}`, content: trimmed, createdAt: new Date().toISOString() }
    onSave([...notes, newNote])
    setContent('')
    addToast('📝 Nota guardada en el conocimiento', 'success')
  }

  function remove(id) {
    onSave(notes.filter(n => n.id !== id))
    addToast('Nota eliminada', 'info')
  }

  return (
    <div className="mb-6">
      <SectionHeader icon={FileEdit} title="Notas de conocimiento" count={notes.length} max={MAX} />

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        placeholder="Escribe aquí información sobre tus productos, precios, testimonios de clientes, argumentos de venta..."
        className="w-full px-3 py-2.5 rounded-lg border text-xs resize-none outline-none mb-2"
        style={{
          background: 'var(--bg-tertiary)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
        }}
      />
      <button
        onClick={addNote}
        disabled={!content.trim() || notes.length >= MAX}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40 mb-3"
        style={{ background: 'var(--accent)' }}
      >
        <Plus size={12} />
        Guardar nota
      </button>

      {notes.length === 0 ? (
        <p className="text-[11px] text-center py-2" style={{ color: 'var(--text-muted)' }}>
          Escribe precios, argumentos de venta o cualquier dato clave de tu negocio.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {notes.map(note => (
            <div
              key={note.id}
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg border"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent)', borderLeftWidth: 3 }}
            >
              <FileEdit size={12} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {note.content.slice(0, 100)}{note.content.length > 100 ? '...' : ''}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {new Date(note.createdAt).toLocaleDateString('es-MX')}
                </p>
              </div>
              <button onClick={() => remove(note.id)} className="p-1 rounded hover:opacity-70 transition-opacity shrink-0" style={{ color: 'var(--text-muted)' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main module ───────────────────────────────────────────────────────────────
export default function KnowledgeModule() {
  const { rag, setRagPdfs, setRagLinks, setRagNotes, addToast } = useWorkspaceStore()
  const [confirmClear, setConfirmClear] = useState(false)

  const { pdfs = [], links = [], notes = [] } = rag || {}
  const totalDocs = pdfs.length + links.length + notes.length

  function clearAll() {
    setRagPdfs([])
    setRagLinks([])
    setRagNotes([])
    setConfirmClear(false)
    addToast('Base de conocimiento limpiada', 'info')
  }

  return (
    <div className="flex flex-col gap-0" style={{ color: 'var(--text-primary)' }}>

      {/* Summary card */}
      <div
        className="rounded-xl border p-4 mb-5"
        style={{ background: 'var(--bg-tertiary)', borderColor: totalDocs > 0 ? 'var(--accent)' : 'var(--border)' }}
      >
        {totalDocs === 0 ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <BookOpen size={28} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>
              Sherix aún no conoce tus productos en detalle
            </p>
            <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
              Agrégale tu catálogo, precios y argumentos de venta — verás la diferencia.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Conocimiento activo
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {pdfs.length > 0 && `📄 ${pdfs.length} PDF${pdfs.length > 1 ? 's' : ''}`}
                {pdfs.length > 0 && (links.length > 0 || notes.length > 0) && ' · '}
                {links.length > 0 && `🔗 ${links.length} link${links.length > 1 ? 's' : ''}`}
                {links.length > 0 && notes.length > 0 && ' · '}
                {notes.length > 0 && `📝 ${notes.length} nota${notes.length > 1 ? 's' : ''}`}
                {' — Sherix usa todo esto para responderte'}
              </p>
            </div>
            {confirmClear ? (
              <div className="flex gap-2 shrink-0">
                <button onClick={clearAll} className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  Sí, limpiar
                </button>
                <button onClick={() => setConfirmClear(false)} className="text-[10px] px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border shrink-0 hover:opacity-70 transition-opacity"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <X size={10} />
                Limpiar todo
              </button>
            )}
          </div>
        )}
      </div>

      <PdfSection   pdfs={pdfs}   onSave={setRagPdfs}   addToast={addToast} />
      <LinksSection links={links} onSave={setRagLinks}  addToast={addToast} />
      <NotesSection notes={notes} onSave={setRagNotes}  addToast={addToast} />
    </div>
  )
}
