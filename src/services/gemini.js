// In production (Cloud Run) the frontend is served by the same server,
// so /chat is a relative path. In dev, the proxy runs on a separate port.
const PROXY_URL = import.meta.env.PROD ? '/chat' : 'http://localhost:3001/chat'

const SYSTEM_PROMPT = `Eres Sherix, asistente de negocio para distribuidores MLM en LATAM. Hablas en español.

════════════════════════════════════════
FORMATO DE RESPUESTA — OBLIGATORIO
════════════════════════════════════════
Responde ÚNICAMENTE con un objeto JSON. Sin texto antes ni después. Sin markdown. Sin bloques de código.
Estructura exacta:
{"message":"respuesta motivacional en español","actions":[]}

════════════════════════════════════════
TIPOS DE ACCIÓN PERMITIDOS
════════════════════════════════════════
Usa EXACTAMENTE estos tipos (sin variantes, sin inventar nuevos):

ADD_SALE        → venta cerrada:     {"type":"ADD_SALE","data":{"customer":"Nombre","amount":500,"product":"Proteína Whey"}}
MOVE_PROSPECT   → mover en pipeline: {"type":"MOVE_PROSPECT","data":{"name":"Nombre","stage":"Cliente"}}
ADD_PROSPECT    → nuevo prospecto:   {"type":"ADD_PROSPECT","data":{"name":"Nombre","interest":"Pérdida de peso","stage":"Nuevo"}}
ADD_TASK        → nueva tarea:       {"type":"ADD_TASK","data":{"title":"Llamar a Roberto","priority":"Alta","status":"Pendiente","description":""}}
MOVE_TASK       → actualizar tarea:  {"type":"MOVE_TASK","data":{"title":"referencia","status":"Hecha"}}
ADD_EXPENSE     → gasto de negocio:  {"type":"ADD_EXPENSE","data":{"concept":"Inventario proteínas","amount":1200,"category":"Inventario"}}
ADD_PERSONAL_EXPENSE → gasto personal: {"type":"ADD_PERSONAL_EXPENSE","data":{"concept":"Renta","amount":4000,"category":"Vivienda"}}
ADD_INTERACTION → seguimiento CRM:   {"type":"ADD_INTERACTION","data":{"name":"Nombre","note":"Me pidió cotización","interactionType":"Seguimiento"}}
OPEN_CONTENT_TODAY   → abrir contenido del día (sin data)
GENERATE_CONTENT_WEEK → generar semana de contenido (sin data)

Stages válidos: Nuevo | Contactado | Interesado | Por cerrar | Cliente
InteractionType válidos: Seguimiento | Llamada | Mensaje | Reunión | Sin respuesta
Categories negocio: Inventario | Marketing | Transporte | Servicios | Otros
Categories personal: Vivienda | Alimentación | Transporte | Educación | Servicios | Otros

════════════════════════════════════════
REGLAS CRÍTICAS
════════════════════════════════════════
1. Venta cerrada → SIEMPRE ADD_SALE + MOVE_PROSPECT a "Cliente" juntas en actions[]
2. Menciona múltiples personas → genera una acción por persona
3. Tarea completada ("ya llamé", "terminé", "subí") → MOVE_TASK status "Hecha"
4. Sin acciones → "actions":[]
5. NUNCA uses tipos de acción que no estén en la lista de arriba

════════════════════════════════════════
EJEMPLOS DE MENSAJES COMPLEJOS
════════════════════════════════════════

ENTRADA: "cerré venta con Carlos de $800 en proteína, Verónica me pidió cotización y necesito llamar a Roberto porque se le acaba el producto"
SALIDA:
{"message":"¡Excelente día! Registré la venta con Carlos, anoté el seguimiento con Verónica y creé la tarea para llamar a Roberto. ¡Tres frentes activos!","actions":[{"type":"ADD_SALE","data":{"customer":"Carlos","amount":800,"product":"Proteína"}},{"type":"MOVE_PROSPECT","data":{"name":"Carlos","stage":"Cliente"}},{"type":"ADD_INTERACTION","data":{"name":"Verónica","note":"Me pidió cotización","interactionType":"Seguimiento"}},{"type":"ADD_TASK","data":{"title":"Llamar a Roberto — se le acaba el producto","priority":"Alta","status":"Pendiente","description":""}}]}

ENTRADA: "conocí a María, está interesada en bajar de peso. También gasté $300 en flyers"
SALIDA:
{"message":"Agregué a María como nueva prospecto con interés en pérdida de peso, y registré el gasto en marketing. ¡El negocio en movimiento!","actions":[{"type":"ADD_PROSPECT","data":{"name":"María","interest":"Pérdida de peso","stage":"Nuevo"}},{"type":"ADD_EXPENSE","data":{"concept":"Flyers","amount":300,"category":"Marketing"}}]}

ENTRADA: "ya terminé la llamada con Diego y publiqué el post de hoy"
SALIDA:
{"message":"¡Productivo! Registré la interacción con Diego y marqué la publicación como hecha. La constancia construye el negocio.","actions":[{"type":"ADD_INTERACTION","data":{"name":"Diego","note":"Llamada realizada","interactionType":"Llamada"}},{"type":"MOVE_TASK","data":{"title":"publicar post","status":"Hecha"}}]}`

// ── Parser robusto ─────────────────────────────────────────────────────────────
function parseResponse(raw) {
  // 1. Direct parse
  try { return JSON.parse(raw) } catch {}

  // 2. Strip markdown code fences
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(stripped) } catch {}

  // 3. Extract first { ... } block (handles leading/trailing text)
  const match = stripped.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }

  // 4. Friendly fallback — never surface raw error to user
  console.error('[gemini] parse failed, raw:', raw.slice(0, 300))
  return {
    message: raw.replace(/[{}"\\]/g, '').slice(0, 200).trim() ||
      'Entendido. ¿Puedes repetirlo de otra forma?',
    actions: [],
  }
}

function toVertexContents(messages) {
  const contents = []
  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'model' : 'user'
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + msg.content
    } else {
      contents.push({ role, parts: [{ text: msg.content }] })
    }
  }
  return contents
}

function buildRagBlock(rag) {
  if (!rag) return ''
  const { pdfs = [], links = [], notes = [] } = rag
  if (!pdfs.length && !links.length && !notes.length) return ''
  const parts = []
  if (pdfs.length) {
    parts.push('DOCUMENTOS PDF:')
    pdfs.forEach(p => parts.push(`[${p.name}]: ${(p.text || '').slice(0, 2000)}`))
  }
  if (links.length) {
    parts.push('LINKS DE REFERENCIA:')
    links.forEach(l => {
      if (l.text) parts.push(`[${l.title || l.url}]: ${l.text.slice(0, 1000)}`)
      else parts.push(`• ${l.url}`)
    })
  }
  if (notes.length) {
    parts.push('NOTAS DEL DISTRIBUIDOR:')
    notes.forEach(n => parts.push(n.content))
  }
  return `\n════════════════════════════════════════\nBASE DE CONOCIMIENTO PERSONAL DEL DISTRIBUIDOR\n════════════════════════════════════════\n${parts.join('\n')}\nUsa esta información cuando el usuario pregunte sobre sus productos, precios, o características específicas de su marca.\n`
}

function buildMemoryBlock(memory) {
  if (!memory) return ''
  const lines = []
  if (memory.name)                   lines.push(`• Nombre del usuario: ${memory.name}`)
  if (memory.keyProspects?.length)   lines.push(`• Prospectos mencionados: ${memory.keyProspects.join(', ')}`)
  if (memory.recentWins?.length)     lines.push(`• Últimas ventas cerradas con: ${memory.recentWins.join(', ')}`)
  if (memory.pendingFollowups?.length) lines.push(`• Seguimientos pendientes: ${memory.pendingFollowups.join(', ')}`)
  if (memory.lastActive)             lines.push(`• Última sesión: ${new Date(memory.lastActive).toLocaleDateString('es-MX')}`)
  if (lines.length === 0) return ''
  return `\n════════════════════════════════════════\nMEMORIA SHERIX (sesiones anteriores)\n════════════════════════════════════════\n${lines.join('\n')}\n`
}

function buildContextBlock(ctx = {}) {
  const thisMonth = new Date().toISOString().slice(0, 7)
  const sales     = ctx.sales || []
  const expenses  = ctx.expenses || []
  const personal  = ctx.personalExpenses || []
  const prospects = ctx.prospects || []
  const tasks     = ctx.tasks || []

  const mSales   = sales.filter(s => s.date?.startsWith(thisMonth))
  const mExp     = expenses.filter(e => e.date?.startsWith(thisMonth))
  const mPers    = personal.filter(e => e.date?.startsWith(thisMonth))

  const income     = mSales.reduce((s, x) => s + x.amount, 0)
  const bizExp     = mExp.reduce((s, x) => s + x.amount, 0)
  const netProfit  = income - bizExp
  const persExp    = mPers.reduce((s, x) => s + x.amount, 0)
  const needed     = Math.max(0, persExp - income)

  const fmt = n => `$${n.toLocaleString('es-MX')}`
  const byStage = { Nuevo: 0, Contactado: 0, Interesado: 0, 'Por cerrar': 0, Cliente: 0 }
  prospects.forEach(p => { if (byStage[p.stage] !== undefined) byStage[p.stage]++ })

  const today = new Date(); today.setHours(0,0,0,0)
  const stale = prospects.filter(p => {
    if (p.stage === 'Cliente') return false
    const last = p.interactions?.length
      ? [...p.interactions].sort((a,b) => b.date.localeCompare(a.date))[0].date
      : p.date
    const then = new Date(last); then.setHours(0,0,0,0)
    return Math.floor((today - then) / 86400000) > 3
  })

  const pending    = tasks.filter(t => t.status === 'Pendiente')
  const inProgress = tasks.filter(t => t.status === 'En proceso')
  const blocked    = tasks.filter(t => t.status === 'Bloqueada')
  const highPri    = tasks.filter(t => t.priority === 'Alta' && t.status !== 'Hecha')

  return `
════════════════════════════════════════
ESTADO ACTUAL DEL WORKSPACE (${new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })})
════════════════════════════════════════
FINANZAS NEGOCIO:
• Ingresos del mes:    ${fmt(income)} (${mSales.length} ventas)
• Gastos del negocio:  ${fmt(bizExp)}
• Ganancia neta:       ${fmt(netProfit)}${netProfit < 0 ? ' ⚠️ déficit' : ''}

FINANZAS PERSONALES:
• Gastos personales:   ${fmt(persExp)}
• Para cubrir gastos:  ${needed > 0 ? `necesitas vender ${fmt(needed)} más` : `cubierto — sobran ${fmt(income - persExp)}`}

CRM — ${prospects.length} prospectos:
• Nuevo: ${byStage.Nuevo} | Contactado: ${byStage.Contactado} | Interesado: ${byStage.Interesado} | Por cerrar: ${byStage['Por cerrar']} | Cliente: ${byStage.Cliente}
${stale.length > 0 ? `• Sin seguimiento +3 días: ${stale.map(p => p.name).join(', ')}` : '• Todos con seguimiento al día'}

TAREAS:
• Pendiente: ${pending.length} | En proceso: ${inProgress.length} | Bloqueada: ${blocked.length}
${highPri.length > 0 ? `• Alta prioridad: ${highPri.map(t => `"${t.title}"`).join(', ')}` : ''}
════════════════════════════════════════`
}

export async function callGemini(messages, context = {}) {
  const ragBlock      = buildRagBlock(context.rag)
  const memoryBlock   = buildMemoryBlock(context.memory)
  const contextBlock  = buildContextBlock(context)
  const systemWithContext = SYSTEM_PROMPT + ragBlock + memoryBlock + contextBlock

  // Prepend up to 10 messages from previous sessions for cross-session memory
  const historyMessages = (context.chatHistory || []).slice(-10)
  const fullMessages = [...historyMessages, ...messages]

  const res = await fetch(PROXY_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemWithContext }] },
      contents: toVertexContents(fullMessages),
      generationConfig: {
        responseMimeType: 'application/json',
        temperature:      0.4,
        maxOutputTokens:  2048,
      },
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData?.error?.message || `Error HTTP ${res.status} del proxy`)
  }

  const data = await res.json()
  if (data?.error) throw new Error(data.error.message || 'Error de Vertex AI')

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) {
    const reason = data?.candidates?.[0]?.finishReason
    throw new Error(`Respuesta vacía de Vertex AI (${reason || 'desconocido'})`)
  }

  const parsed = parseResponse(raw)
  return {
    message: typeof parsed.message === 'string' ? parsed.message : 'Sin respuesta',
    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
  }
}
