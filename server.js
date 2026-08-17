import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const PORT      = process.env.PORT || 3001
const PROJECT   = process.env.GOOGLE_CLOUD_PROJECT || 'mlm-xprize'
const DIST      = join(import.meta.dirname, 'dist')
const VERTEX_URL = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`
const IMAGEN_URL = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
}

// ── Token cache (60 min lifetime, refresh at 45 min) ──────────────────────────
let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  // Cloud Run / GCE: use metadata server (fast, no CLI needed)
  try {
    const res = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(1500) }
    )
    if (res.ok) {
      const data = await res.json()
      cachedToken = data.access_token
      tokenExpiry = Date.now() + (data.expires_in - 120) * 1000
      return cachedToken
    }
  } catch { /* not on GCP — fall through to gcloud */ }

  // Local dev: use gcloud CLI
  const { stdout } = await execAsync('gcloud auth print-access-token')
  cachedToken = stdout.trim()
  tokenExpiry = Date.now() + 45 * 60 * 1000
  return cachedToken
}

// ── Static file helper ────────────────────────────────────────────────────────
async function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0]
  if (urlPath === '/') urlPath = '/index.html'

  let filePath = join(DIST, urlPath)

  // SPA fallback — any non-asset path serves index.html
  if (!existsSync(filePath) || !extname(filePath)) {
    filePath = join(DIST, 'index.html')
  }

  try {
    const data = await readFile(filePath)
    const mime = MIME[extname(filePath)] || 'application/octet-stream'
    const isAsset = urlPath.startsWith('/assets/')
    res.writeHead(200, {
      'Content-Type': mime,
      ...(isAsset ? { 'Cache-Control': 'public, max-age=31536000, immutable' } : {}),
    })
    res.end(data)
  } catch {
    res.writeHead(404); res.end('Not found')
  }
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // ── /chat — Vertex AI proxy ────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/chat') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()

    try {
      const token = await getAccessToken()
      const upstream = await fetch(VERTEX_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body,
      })
      const data = await upstream.json()
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } catch (err) {
      console.error('[proxy error]', err.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: { message: err.message } }))
    }
    return
  }

  // ── /generate-image — Vertex AI Imagen 3 proxy ────────────────────────────
  if (req.method === 'POST' && req.url === '/generate-image') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    try {
      const { prompt, aspectRatio = '1:1' } = JSON.parse(Buffer.concat(chunks).toString())
      const token = await getAccessToken()
      const upstream = await fetch(IMAGEN_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          instances:  [{ prompt }],
          parameters: {
            sampleCount:       1,
            aspectRatio,
            safetyFilterLevel: 'block_some',
            personGeneration:  'allow_adult',
          },
        }),
      })
      const data = await upstream.json()
      if (!upstream.ok || data.error) {
        const msg = data.error?.message || `HTTP ${upstream.status}`
        console.error('[imagen error]', msg)
        res.writeHead(upstream.ok ? 500 : upstream.status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: msg }))
        return
      }
      const prediction = data.predictions?.[0]
      if (!prediction?.bytesBase64Encoded) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'No image returned by Imagen 3' }))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        image:    prediction.bytesBase64Encoded,
        mimeType: prediction.mimeType || 'image/png',
      }))
    } catch (err) {
      console.error('[imagen error]', err.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // ── /fetch-url — server-side URL fetcher (bypasses CORS) ──────────────────
  if (req.method === 'POST' && req.url === '/fetch-url') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    try {
      const { url } = JSON.parse(Buffer.concat(chunks).toString())
      const upstream = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MLMWorkspace/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      const html = await upstream.text()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ html: html.slice(0, 100000) }))
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // ── Everything else — serve React build ────────────────────────────────────
  await serveStatic(req, res)
})

server.listen(PORT, () => {
  console.log(`✅ Servidor listo en http://localhost:${PORT}`)
  console.log(`   Proyecto: ${PROJECT}`)
  console.log(`   Vertex AI: us-central1 → gemini-2.5-flash`)
  console.log(`   Static: ${existsSync(DIST) ? 'dist/ encontrado' : '⚠️  dist/ no existe — ejecuta npm run build'}`)
})
