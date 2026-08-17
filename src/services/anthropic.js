// Gemini-powered intent engine with pattern-based fallback
import { callGemini } from './gemini.js'
import { useWorkspaceStore } from '../store/workspaceStore'

const THIS_MONTH = new Date().toISOString().slice(0, 7)

// ─── Normalization (accent-insensitive for LATAM) ─────────────────────────────
function normalize(text) {
  return text
    .replace(/[áàäâ]/gi, 'a').replace(/[éèëê]/gi, 'e')
    .replace(/[íìïî]/gi, 'i').replace(/[óòöô]/gi, 'o')
    .replace(/[úùüû]/gi, 'u').replace(/ñ/gi, 'n')
    .toLowerCase()
}

// ─── Extractors ───────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'el','la','los','las','un','una','me','le','se','mi','tu','su','nos',
  'no','si','ya','por','con','para','que','del','al','de','en','a','y','o',
  'pero','como','mas','sin','yo','hoy','manana','ayer','nuevo','nueva',
  'lunes','martes','miercoles','jueves','viernes','sabado','domingo',
  'cerre','llame','vendi','conoci','contacte','gaste','pague','compre',
  'recuerdame','agenda','necesito','debo','termine','complete','acabe',
])

const PRODUCTS = ['proteina','proteinas','whey','vitaminas','vitamina','suplementos',
  'suplemento','nutricion','colageno','omega','pre entreno','perdida de peso',
  'pack premium','pack basico','plan negocio','multivitaminico']

function extractName(text) {
  const patterns = [
    /(?:con|a\s+|para\s+)\s*([A-ZÁÉÍÓÚÜ][a-záéíóúüñ]{2,}(?:\s+[A-ZÁÉÍÓÚÜ][a-záéíóúüñ]{2,})?)/u,
    /([A-ZÁÉÍÓÚÜ][a-záéíóúüñ]{2,}(?:\s+[A-ZÁÉÍÓÚÜ][a-záéíóúüñ]{2,})?)\s+(?:está|quiere|compró|es\s+cliente|ya|cerró|preguntó)/u,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && !STOPWORDS.has(normalize(m[1]))) return m[1]
  }
  for (const word of text.split(/[\s,;.!?¿¡]+/)) {
    if (/^[A-ZÁÉÍÓÚÜ][a-záéíóúüñ]{2,}$/.test(word) && !STOPWORDS.has(normalize(word))) return word
  }
  return null
}

function extractAmount(text) {
  const m = text.match(/\$\s*(\d[\d.,]*)|(\d[\d.,]*)\s*(?:dolares?|pesos?|usd|mxn|dlls?)/i)
  if (m) return parseFloat((m[1] || m[2]).replace(',', '.'))
  return null
}

function extractProduct(text) {
  const n = normalize(text)
  for (const p of PRODUCTS) if (n.includes(p)) return p.charAt(0).toUpperCase() + p.slice(1)
  return 'Producto MLM'
}

function extractInterest(text) {
  const n = normalize(text)
  if (/negocio|distribuidor|emprender/.test(n)) return 'Plan negocio'
  if (/bajar|adelgaz|peso/.test(n)) return 'Pérdida de peso'
  for (const p of PRODUCTS) if (n.includes(p)) return p.charAt(0).toUpperCase() + p.slice(1)
  return 'Productos MLM'
}

function extractTaskTitle(text) {
  const strip = [
    /recuerdame\s+/i, /recuerda\s+(?:me\s+)?que\s+/i,
    /agenda(?:me)?\s+(?:una?\s+)?(?:tarea|llamada|reunion|cita)?\s*/i,
    /necesito\s+(?:hacer\s+)?/i, /debo\s+/i, /tengo\s+que\s+/i,
    /no\s+(?:me\s+)?olvidar\s+/i, /pendiente\s*[:]\s*/i, /tarea\s*[:]\s*/i,
  ]
  let r = text
  for (const p of strip) r = r.replace(p, '')
  r = r.replace(/\s+(?:el|la|este|esta)\s+(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)/gi, '').trim()
  if (r.length > 60) r = r.slice(0, 57) + '...'
  return r.charAt(0).toUpperCase() + r.slice(1) || 'Nueva tarea'
}

function extractTaskRef(text) {
  const strip = [
    /(?:ya\s+)?termine\s+(?:de\s+|con\s+)?/i, /complete\s+(?:con\s+|de\s+|el\s+|la\s+)?/i,
    /ya\s+hice\s+(?:el\s+|la\s+)?/i, /acabe\s+(?:de\s+|con\s+)?/i,
    /empece\s+(?:con\s+|a\s+|de\s+)?/i,
    /estoy\s+(?:trabajando\s+en|haciendo|haciend[ao])\s+(?:el\s+|la\s+|los\s+|las\s+)?/i,
    /subi\s+(?:el\s+|la\s+)?/i, /publique\s+(?:el\s+|la\s+)?/i,
    /envie\s+(?:el\s+|la\s+)?/i, /mande\s+(?:el\s+|la\s+)?/i,
    /hice\s+(?:la\s+|el\s+)/i, /bloquee\s+(?:la\s+|el\s+)?/i,
  ]
  const leading = /^(?:de\s+|el\s+|la\s+|los\s+|las\s+|un\s+|una\s+|al\s+)/i
  let result = text
  for (const r of strip) result = result.replace(r, '')
  result = result.replace(leading, '')
  return result.trim().slice(0, 40) || ''
}

function detectPriority(text) {
  const n = normalize(text)
  if (/urgente|importante|asap|ya mismo|hoy mismo|critico|prioritario/.test(n)) return 'Alta'
  if (/cuando pueda|eventualmente|sin prisa|baja prioridad|despues/.test(n)) return 'Baja'
  return 'Media'
}

// ─── Expense extractors ───────────────────────────────────────────────────────
function extractExpenseConcept(text) {
  let m = text.match(/\$\s*[\d.,]+\s+(?:en|de|para|por)\s+(.{3,45}?)(?:\s*$|[.,!?])/i)
  if (m) return cap(m[1].trim())
  m = text.match(/(?:en|de|para)\s+(.{3,35}?)\s+(?:por\s+)?\$\s*\d/i)
  if (m) return cap(m[1].trim())
  m = text.match(/(?:compre|gaste|pague)\s+(.{3,35}?)\s+\$?\s*\d/i)
  if (m && !/^\d/.test(m[1])) return cap(m[1].trim())
  m = text.match(/(?:el|la|los|las)\s+(.{2,25}?)\s+(?:me\s+)?(?:cost[oó]|sali[oó])\s/i)
  if (m) return cap(m[1].trim())
  return null
}

function detectBusinessCategory(n) {
  if (/inventario|productos?|mercancia|stock|suplemento|proteina|vitamina|empaque|material/.test(n)) return 'Inventario'
  if (/marketing|publicidad|anuncio|facebook|instagram|redes|flyer|promo/.test(n)) return 'Marketing'
  if (/gasolina|combustible|uber|taxi|viatico|envio|delivery|flete/.test(n)) return 'Transporte'
  if (/zoom|software|internet|suscripcion|plataforma|herramienta/.test(n)) return 'Servicios'
  return 'Otros'
}

function detectPersonalCategory(n) {
  if (/renta|alquiler|hipoteca|departamento|cuarto/.test(n)) return 'Vivienda'
  if (/super|supermercado|despensa|comida|restaurante|alimento|mercado|taqueria|lunch/.test(n)) return 'Alimentación'
  if (/gasolina|combustible|uber|taxi|camion|metro|bus|pasaje/.test(n)) return 'Transporte'
  if (/curso|libro|escuela|capacitacion|taller|seminario|universidad|colegio/.test(n)) return 'Educación'
  if (/luz|agua\s+potable|gas\s+(?:del|natural)|netflix|spotify|cable|streaming|telefono/.test(n)) return 'Servicios'
  return 'Otros'
}

function isPersonalExpense(n) {
  return /renta|alquiler|hipoteca|super|supermercado|despensa|comida|restaurante|mercado|taqueria|luz|agua\s+potable|gas\s+(?:del|natural)|netflix|spotify|cable|universidad|colegio/.test(n)
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s }

// ─── Cross-module helper ──────────────────────────────────────────────────────
function nameInText(name, text) {
  if (!name || !text) return false
  const parts = normalize(name).replace(/\./g, '').split(/\s+/).filter(p => p.length > 2)
  const t = normalize(text)
  return parts.some(part => t.includes(part))
}

// ─── CRM interaction helpers ──────────────────────────────────────────────────
function extractInteractionNote(text) {
  const n = normalize(text)
  if (/no\s+(?:me\s+)?respondio|no\s+contesto/.test(n)) return 'Sin respuesta al contacto'
  if (/quedo\s+en\s+(?:pensarlo?|verlo?)|va\s+a\s+(?:pensar|ver)/.test(n)) return 'Quedó en pensar la propuesta'
  if (/le\s+(?:deje|mande|envie)\s+(?:mensaje|informacion|catalogo|info)/.test(n)) return 'Se le envió información/mensaje'
  const m = text.match(/me\s+dijo\s+que\s+(.{5,80})/i)
  if (m) return cap(m[1].replace(/[.!?]+$/, ''))
  return 'Seguimiento registrado'
}

function detectInteractionType(text) {
  const n = normalize(text)
  if (/no\s+respondio|no\s+contesto|sin\s+respuesta/.test(n)) return 'Sin respuesta'
  if (/llame|llamada|telefono/.test(n)) return 'Llamada'
  if (/mensaje|escribi|whatsapp|chat/.test(n)) return 'Mensaje'
  if (/reunion|zoom|videollamada/.test(n)) return 'Reunión'
  return 'Seguimiento'
}

function getLastInteractionDate(prospect) {
  if (!prospect?.interactions?.length) return prospect?.date || null
  return [...prospect.interactions].sort((a, b) => b.date.localeCompare(a.date))[0]
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  const [y, m, d] = dateStr.split('-').map(Number)
  const then = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((today - then) / 86400000))
}

function getStaleProspects(prospects = []) {
  return prospects
    .filter(p => p.stage !== 'Cliente')
    .map(p => {
      const last = getLastInteractionDate(p)
      return { ...p, days: daysSince(last?.date || p.date), lastNote: last?.note || '—' }
    })
    .filter(p => p.days > 3)
    .sort((a, b) => b.days - a.days)
}

// ─── Finance query helpers ────────────────────────────────────────────────────
function calcBusinessFinance(sales = [], expenses = []) {
  const ms = sales.filter(s => s.date?.startsWith(THIS_MONTH))
  const me = expenses.filter(e => e.date?.startsWith(THIS_MONTH))
  const income = ms.reduce((s, x) => s + x.amount, 0)
  const spent = me.reduce((s, x) => s + x.amount, 0)
  const net = income - spent
  const margin = income > 0 ? Math.round((net / income) * 100) : 0
  return { income, spent, net, margin }
}

function calcPersonalHealth(sales = [], personalExpenses = []) {
  const income = sales.filter(s => s.date?.startsWith(THIS_MONTH)).reduce((s, x) => s + x.amount, 0)
  const personal = personalExpenses.filter(e => e.date?.startsWith(THIS_MONTH)).reduce((s, x) => s + x.amount, 0)
  const balance = income - personal
  return { income, personal, balance }
}

const fmt = (n) => `$${n.toLocaleString('es-MX')}`

// ─── Response templates ───────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const R = {
  closeSale: (name, amount, product) => pick([
    `🎉 ¡Increíble! Registré la venta de **${fmt(amount)}** de **${product}** con **${name}**. ¡Ese es el espíritu!`,
    `💪 ¡Boom! Venta cerrada con **${name}** — **${fmt(amount)}** en **${product}**. Lo añadí a finanzas y moví a Clientes en el CRM.`,
    `✅ ¡Cierre registrado! **${name}** — **${fmt(amount)}** de **${product}**. Tu mes va creciendo.`,
  ]),
  newProspect: (name, interest) => pick([
    `📋 Agregué a **${name}** como nuevo prospecto con interés en **${interest}**. ¿Cuándo harás el primer seguimiento?`,
    `👋 **${name}** ya está en tu pipeline. Interés: ${interest}. ¿Tienes su WhatsApp?`,
    `✨ **${name}** añadido al CRM con interés en **${interest}**. Los primeros 48 horas son clave.`,
  ]),
  addInteraction: (name, note, autoCompletedTasks = []) => {
    const base = pick([
      `📝 Registré la interacción con **${name}**: "${note}". Historial actualizado en el CRM.`,
      `✏️ Anotado en el perfil de **${name}**: ${note}. El seguimiento constante hace la diferencia.`,
      `📋 Historial de **${name}** actualizado: "${note}". ¡El seguimiento constante hace la diferencia!`,
    ])
    if (autoCompletedTasks.length > 0) {
      return base + ` Además, marqué como **Hecha** la tarea **"${autoCompletedTasks[0].title}"**.`
    }
    return base
  },
  queryLastInteraction: (prospect) => {
    if (!prospect) return `No encontré ese prospecto en tu CRM. ¿Lo agregamos?`
    const interactions = prospect.interactions || []
    if (interactions.length === 0) return `No hay interacciones registradas para **${prospect.name}**. ¿Cuándo fue el primer contacto?`
    const last = [...interactions].sort((a, b) => b.date.localeCompare(a.date))[0]
    return `📅 Última interacción con **${prospect.name}**:\n• Fecha: **${last.date}**\n• Tipo: ${last.type}\n• "${last.note}"\n\n${daysSince(last.date) > 3 ? `⚠️ Han pasado **${daysSince(last.date)} días** — considera hacer contacto hoy.` : '¡Buen seguimiento!'}`
  },
  queryFollowup: (staleProspects) => {
    if (staleProspects.length === 0) return `✅ ¡Excelente! Todos tus prospectos tienen seguimiento reciente. Ninguno lleva más de 3 días sin contacto.`
    const list = staleProspects.map(p => `• **${p.name}** — ${p.days} días sin contacto (${p.interest})`).join('\n')
    return `🔔 Tienes **${staleProspects.length}** prospecto(s) que necesitan seguimiento:\n\n${list}\n\n¿A cuál contactas primero?`
  },
  contacted: (name, autoCompletedTasks = []) => {
    const base = pick([`📞 Moví a **${name}** a **Contactado**. ¿Cómo fue la conversación?`, `✓ **${name}** pasa a **Contactado**. ¿Quedaron en hablar de nuevo?`])
    return autoCompletedTasks.length > 0
      ? base + ` Marqué como **Hecha** la tarea **"${autoCompletedTasks[0].title}"**.`
      : base
  },
  interested:   (name) => pick([`🔥 ¡Señal positiva! **${name}** está en **Interesado**. Mándale el catálogo hoy.`, `⚡ **${name}** en **Interesado**. ¿Le mandaste la info? Este es el momento clave.`]),
  toClose:      (name) => pick([`💼 **${name}** en **Por cerrar** — ¡casi! ¿Qué necesita para decidir?`, `🏁 ¡Un paso más! **${name}** casi listo para cerrar.`]),
  addTask:      (title) => pick([`📌 Tarea creada: **"${title}"**. La encontrarás en **Pendiente**.`, `✅ Anotado: **"${title}"**. En tu kanban para que no se te escape.`]),
  taskDone:     (ref)   => pick([`✅ ¡Bien hecho! Moví **"${ref}"** a **Hecha**. ¡La constancia hace la diferencia!`, `🎉 Tarea completada. ¡Un paso más hacia tus metas!`]),
  taskInProg:   (ref)   => pick([`⚡ Moví **"${ref}"** a **En proceso**. ¡Dale con todo!`, `🔄 Tarea actualizada a **En proceso**. ¡Avanzando!`]),
  taskBlocked:  (ref)   => pick([`⚠️ Marqué **"${ref}"** como **Bloqueada**. ¿Qué necesitas para desatascarla?`]),

  businessExpense: (concept, amount, category) => pick([
    `💼 Gasto de negocio registrado: **${fmt(amount)}** en **${concept}** (${category}). Actualicé tu estado de resultados.`,
    `📊 Anotado: **${fmt(amount)}** de ${category} — **${concept}**. Lo verás reflejado en Finanzas Negocio.`,
    `✍️ **${fmt(amount)}** en **${category}** registrado. Mantener control de gastos es clave para la rentabilidad.`,
  ]),
  personalExpense: (concept, amount, category) => pick([
    `🏠 Gasto personal registrado: **${fmt(amount)}** en **${concept}** (${category}). Lo añadí a tu presupuesto personal.`,
    `📝 Anotado en **${category}**: **${fmt(amount)}** — ${concept}. Revisa tu módulo de Finanzas Personales.`,
    `💳 **${fmt(amount)}** de ${category} registrado. Tu salud financiera se actualiza automáticamente.`,
  ]),
  queryBusiness: ({ income, spent, net, margin }) => {
    const sign = net >= 0 ? '✅' : '⚠️'
    return `${sign} **Este mes:**\n• Ingresos: **${fmt(income)}**\n• Gastos: **${fmt(spent)}**\n• Ganancia neta: **${fmt(net)}** (${margin}% margen)\n\n${net >= 0 ? '¡Vas bien! Sigue cerrando.' : 'Considera reducir gastos o acelerar ventas.'}`
  },
  queryPersonal: ({ income, personal, balance }) => {
    if (balance >= 0) {
      return `💚 ¡Estás al día! Ingresos del negocio: **${fmt(income)}** | Gastos personales: **${fmt(personal)}** | Sobrante: **${fmt(balance)}**. ¡Sigue vendiendo!`
    }
    return `⚠️ Déficit del mes: **${fmt(Math.abs(balance))}**. Ingresos: ${fmt(income)} | Gastos personales: ${fmt(personal)}.\n\n**Necesitas vender ${fmt(Math.abs(balance))} más** para cubrir tus gastos personales.`
  },
  queryTasks: (status, tasks) => {
    const filtered = status ? tasks.filter(t => t.status === status) : tasks
    if (filtered.length === 0) return `No tienes tareas en **${status || 'el kanban'}** ahora. ¿Quieres agregar una?`
    return `Tienes **${filtered.length}** tarea(s) en **${status}**:\n${filtered.map(t => `• ${t.title}`).join('\n')}`
  },
  queryProspectTasks: (tasks, prospects) => {
    const active = tasks.filter(t => {
      if (t.status === 'Hecha') return false
      if (t.prospectId) return true
      return prospects.some(p => nameInText(p.name, t.title))
    })
    if (active.length === 0) {
      return '✅ No tienes tareas pendientes vinculadas a prospectos ahora. ¡Al día con el seguimiento!'
    }
    const lines = active.map(t => {
      const p = t.prospectName
        ? prospects.find(pr => pr.id === t.prospectId)
        : prospects.find(pr => nameInText(pr.name, t.title))
      const stage = p?.stage ? ` — ${p.stage}` : ''
      return `• **${t.title}**${stage}`
    }).join('\n')
    return `📋 Tienes **${active.length}** tarea(s) vinculadas a prospectos:\n\n${lines}\n\n¿Cuál atiendes primero?`
  },
  queryProspectPipeline: (prospect, tasks) => {
    if (!prospect) return 'No encontré ese prospecto en tu CRM. ¿Lo quieres agregar?'
    const interactions = prospect.interactions || []
    const last = interactions.length > 0
      ? [...interactions].sort((a, b) => b.date.localeCompare(a.date))[0]
      : null
    const pending = tasks.filter(t =>
      t.status !== 'Hecha' && (t.prospectId === prospect.id || nameInText(prospect.name, t.title))
    )
    let msg = `📊 **${prospect.name}** — Etapa: **${prospect.stage}**\n• Interés: ${prospect.interest}\n`
    if (last) {
      msg += `• Último contacto (${last.date}): "${last.note}"\n`
      const dias = daysSince(last.date)
      if (dias > 3) msg += `⚠️ Han pasado **${dias} días** sin contacto.\n`
    } else {
      msg += '• Sin interacciones registradas aún.\n'
    }
    if (pending.length > 0) {
      msg += `\n**Tareas pendientes:**\n${pending.map(t => `• ${t.title}`).join('\n')}`
    } else {
      msg += '\n✅ Sin tareas pendientes con este prospecto.'
    }
    return msg
  },
  contentToday: () => pick([
    '📱 Pasé al tab de **Contenido** para que veas tu propuesta del día — incluye copy listo para publicar y hashtags.',
    '✍️ Tu contenido de hoy está listo. Ábrelo en **Contenido** para copiar el texto y los hashtags.',
    '🎯 Encontrarás la propuesta en el tab **Contenido** con copy completo y estrategia del día.',
  ]),
  contentWeek: () => pick([
    '📅 ¡Generé el calendario de contenido para toda la semana! Revísalo en el tab **Contenido**.',
    '🗓️ Semana completa lista. Abre **Contenido** para ver los 7 posts con copy y objetivos.',
    '🚀 7 días de contenido generados. Cada uno con plataforma, formato y copy listo para publicar.',
  ]),
  contentPublished: () => pick([
    '✅ ¡Post publicado registrado! La consistencia de publicación construye audiencia. ¡Sigue así!',
    '🚀 Marcado como publicado. ¡Excelente disciplina! Cada post te acerca más a tu audiencia ideal.',
    '🌟 ¡Post del día publicado! La constancia en redes sociales marca la diferencia a largo plazo.',
  ]),
  contentProspect: () => `💬 **Mensajes para prospectar por WhatsApp:**\n\n**Opción 1 — Indirecto (muy efectivo):**\n_"Hola [nombre] 👋 Vi tu perfil y creo que lo que hago podría interesarte. ¿Tienes 5 min esta semana para que te cuente? Sin compromiso 😊"_\n\n**Opción 2 — Directo con resultado:**\n_"Hola [nombre], llevo meses ayudando a personas a [resultado real]. Creo que podrías encajar perfecto. ¿Hablamos? 💙"_\n\n**Opción 3 — Referido:**\n_"Hola [nombre], me pasaron tu contacto porque buscas [resultado]. Yo trabajo exactamente eso. ¿Hablamos rápido esta semana?"_\n\nPersonaliza con el nombre real y el resultado específico que le interese. 🎯`,
  confirmPending: (type, name) => {
    if (type === 'ADD_PROSPECT') return pick([
      `✅ ¡Listo! Registré a **${name}** en el CRM como nuevo prospecto. ¿Cuándo harás el primer seguimiento?`,
      `📋 **${name}** ya está en tu pipeline. Los primeros 48 horas son clave — ¿tienes su WhatsApp?`,
      `👋 ¡Agregado! **${name}** aparece ahora en tu CRM. ¿Qué interés tiene?`,
    ])
    if (type === 'OPEN_RADAR_WITH_CONTEXT') return `🎯 Perfecto, abriendo el Radar de Oportunidades para analizar **${name}**. ¡Encontraremos los mejores prospectos allí!`
    return '✅ Acción ejecutada.'
  },
  queryCommission: (income, profile) => {
    if (!profile?.commissionModel) {
      return `💡 Aún no tienes una estructura de comisiones configurada. Ve a **Perfil → Estructura de Comisiones** para configurarla y te calcularé tu comisión exacta.`
    }
    if (income === 0) {
      return `📊 Este mes no tienes ventas registradas todavía. Registra tus ventas y te calcularé tu comisión al instante.`
    }
    const res = calcCommissionLocal(income, profile)
    if (res === null) return `No pude calcular la comisión. Revisa tu configuración en **Perfil**.`
    const amount = typeof res === 'number' ? res : res.amount
    const MODEL = { fixed: `porcentaje fijo del ${profile.fixedPercent}%`, tiered: `nivel del ${typeof res === 'object' && res.percent ? res.percent : '?'}%`, points: `puntos PV` }
    let msg = `💰 **Tu comisión estimada este mes es ${fmt(amount)}** con ${MODEL[profile.commissionModel]}.\n\n• Ingresos base: **${fmt(income)}**\n• Comisión: **${fmt(amount)}**`
    if (profile.commissionModel === 'points' && typeof res === 'object') {
      msg += `\n• PV generados: **${res.pv?.toFixed(1)}** ${res.qualified ? '✓' : `(mínimo: ${profile.minPoints} PV — ⚠ no califica)`}`
    }
    msg += `\n\nPuedes ver el detalle completo en **Finanzas → Tu Comisión Real**.`
    return msg
  },
  setCommission: (percent) => pick([
    `✅ Entendido. Ve a **Perfil → Estructura de Comisiones** y configura **${percent}% fijo** — Sherix calculará automáticamente tu ganancia real cada mes.`,
    `💡 Para registrar tu ${percent}% de comisión, abre **Perfil → Estructura de Comisiones** y selecciona "% Fijo". Ahí puedes guardarla y la veré reflejada en Finanzas.`,
  ]),
  general: [
    `¡Hola! Puedo ayudarte a registrar ventas, gastos, agregar prospectos al CRM y gestionar tareas. ¿Qué pasó hoy?`,
    `¿Cómo va el día? Dime si cerraste una venta, conociste a alguien nuevo, o tienes algo que registrar.`,
    `Estoy aquí para crecer tu negocio MLM. ¿Ventas, prospectos, gastos o tareas?`,
    `Recuerda: el seguimiento constante es lo que separa a los mejores distribuidores. ¿A quién llamas hoy?`,
    `¡Cada "no" te acerca más al "sí"! ¿Qué necesitas organizar hoy?`,
  ],
  tips: {
    prospecting: [`**Tip:** Habla con al menos 5 personas nuevas cada día. La pipeline llena es la base del negocio.`, `**Prospección efectiva:** Primero escucha, luego ofrece.`],
    closing: [`**Tip de cierre:** Si dicen "lo voy a pensar", pregunta: "¿Qué información adicional necesitas?" Siempre avanza.`],
    followup: [`**Seguimiento:** El 80% de ventas requieren 5+ contactos. ¿A quién le debes una llamada hoy?`],
  },
}

// ─── Intent patterns (accent-free — matched against normalized text) ──────────
const INTENTS = {
  CLOSE_SALE:      /(?:cerre(?:\s+(?:trato|venta|negocio))?|vendi|cobre|hice\s+(?:una\s+)?venta|logre\s+venta|facture)/,
  NEW_PROSPECT:    /(?:conoci\s+a|nueva?\s+(?:persona|prospecto|lead|contacto)|me\s+contacto|se\s+intereso\s+un|acaba\s+de\s+escribir)/,
  ADD_INTERACTION:        /(?:no\s+(?:me\s+)?respondio|no\s+contesto|sin\s+respuesta|me\s+dijo\s+que|quedo\s+en\s+(?:pensarlo?|verlo?)|intente\s+contactar|le\s+deje\s+(?:mensaje|nota)|le\s+(?:mande|envie)\s+(?:mensaje|info|catalogo)|tuve\s+(?:una\s+)?(?:llamada|reunion)\s+con)/,
  QUERY_LAST_INTERACTION: /(?:cuando\s+(?:fue|hable|contacte|escribi|llame)(?:\s+(?:la\s+)?ultima)?(?:\s+vez)?\s*(?:con\s+)?|ultima\s+(?:vez|interaccion|contacto)\s+(?:con|que\s+vi|que\s+hable))/,
  QUERY_FOLLOWUP:         /(?:quien\s+necesito\s+(?:contactar|llamar|escribir|dar\s+seguimiento)|a\s+quien\s+(?:le\s+)?(?:debo|doy)\s+(?:seguimiento|llamar|contactar)|quien\s+(?:necesita|falta)\s+(?:seguimiento|contacto)|prospectos?\s+sin\s+(?:contacto|seguimiento)|seguimiento\s+pendiente|tengo\s+(?:atrasado|pendiente)\s+(?:a\s+alguien|seguimiento))/,
  CONTACTED:       /(?:llame\s+a|contacte\s+a|escribi\s+a|mensajee\s+a|hable\s+con)/,
  INTERESTED:      /(?:esta\s+(?:muy\s+)?interesad[ao]|quiere\s+saber\s+mas|le\s+interesa|pregunto\s+por\s+(?:el\s+)?(?:producto|precio|catalogo))/,
  TO_CLOSE:        /(?:(?:esta|quiere)\s+list[ao]\s+para\s+(?:comprar|cerrar)|ya\s+decidio|por\s+cerrar\s+con)/,
  ADD_TASK:        /(?:recuerdame|recuerda\s+(?:me\s+)?que|agenda(?:me)?\s*(?:una?\s+)?(?:tarea|llamada|reunion|cita)?|necesito\s+(?:hacer|llamar|enviar|revisar)|debo\s+|tengo\s+que\s+|no\s+(?:me\s+)?olvidar|pendiente\s*:)/,
  EXPENSE_PERSONAL:/(?:(?:gaste|pague|compramos?)\s+.{0,40}\$\s*\d|(?:el\s+)?(?:super|supermercado|renta|luz|agua|gas|netflix|spotify|restaurante)\s+(?:me\s+)?(?:cost[oo]|sali[oo])|\$\s*\d.+(?:renta|alquiler|super|supermercado|comida|luz|agua))/,
  EXPENSE_BUSINESS:/(?:(?:gaste|pague|compre|invertir?|compramos?)\s+.{0,40}\$\s*\d|(?:gaste|compre|pague)\s+\$\s*\d)/,
  TASK_DONE:       /(?:(?:ya\s+)?termine|complete|ya\s+(?:hice|lo\s+hice)|acabe|subi|publique|envie|mande|hice\s+la)/,
  TASK_BLOCKED:    /(?:bloqueada?|no\s+puedo\s+avanzar|estancad[ao]|atascad[ao])/,
  TASK_PROGRESS:   /(?:estoy\s+(?:trabajando\s+en|haciend[ao]|en\s+proceso\s+de)|empece\s+(?:con\s+|a\s+)?|en\s+proceso)/,
  QUERY_TASKS:     /(?:que\s+tengo|cuales?\s+son|muestrame|listame|(?:ver|mostrar)\s+(?:mis\s+)?tareas|que\s+hay)\s+(?:en\s+)?(?:proceso|pendiente|bloqueada?|hecha?|completada?)/,
  QUERY_BUSINESS:  /(?:cuanto\s+(?:gane|llevo|vendi|facture)|mis\s+(?:ganancias|ingresos|ventas)|estado\s+de\s+resultados|como\s+voy\s+(?:este\s+mes|en\s+(?:ventas|ingresos|ganancias)))/,
  QUERY_PERSONAL:  /(?:me\s+alcanza|puedo\s+cubrir|mis\s+gastos\s+personales|cuanto\s+me\s+falta|cuanto\s+necesito\s+vender|alcanza\s+para)/,
  TIPS_PROSPECT:        /(?:como\s+prospectar|tips?\s+de\s+prospeccion|como\s+consig[uo]|buscar\s+(?:clientes?|prospectos?))/,
  TIPS_CLOSE:           /(?:como\s+cerrar|tips?\s+de\s+cierre|no\s+quiere\s+comprar|como\s+convencer|objecion)/,
  TIPS_FOLLOW:          /(?:como\s+dar\s+seguimiento|tips?\s+de\s+seguimiento|no\s+me\s+responde)/,
  QUERY_PROSPECT_TASKS: /(?:(?:que|cuales?)\s+tareas?\s+(?:tengo|hay)?\s*(?:con|de|para|del?)\s+prospectos?|tareas?\s+(?:del?|de\s+mis?|con)\s+(?:prospectos?|crm|pipeline)|tareas?\s+vinculadas?|que\s+seguimiento\s+(?:tengo|hay))/,
  QUERY_PROSPECT_PIPE:  /(?:como\s+(?:va|esta)\s+|en\s+que\s+etapa\s+(?:esta|quedo)\s+|donde\s+esta\s+|que\s+hay\s+con\s+|como\s+sigue\s+|el\s+estado\s+de\s+|pipeline\s+de\s+)/,
  CONFIRM: /^(s[ií]|dale|ok|claro|confirma|hazlo|va\b|adelante|perfecto|registra|agrega|anota|listo|correcto|exacto|anda|por\s+favor|please|yeah|yep)/,
  CANCEL:  /^(no\b|cancel|olvida|deja|no\s+gracias|nop|nel|mejor\s+no|no\s+lo\s+reg)/,
  CONTENT_TODAY:    /(?:que\s+(?:publico|posteo|subo)\s+hoy|propuesta\s+de\s+contenido|contenido\s+(?:de\s+hoy|para\s+hoy)|post\s+de\s+hoy|que\s+(?:contenido|post)\s+(?:hago|publico|subo))/,
  CONTENT_WEEK:     /(?:contenido\s+de\s+(?:la\s+)?(?:semana|semana\s+completa)|gen(?:era)?\s+(?:la\s+)?semana|plan\s+semanal\s+(?:de\s+contenido)?|toda\s+la\s+semana\s+(?:de\s+)?contenido|semana\s+de\s+posts?)/,
  CONTENT_GENERATE: /(?:haz(?:me)?\s+un\s+(?:post|reel|historia|carrusel|copy|texto)|gen(?:era)?\s+(?:un\s+)?(?:post|contenido|copy)|escrib(?:e|eme)\s+(?:un\s+)?(?:post|copy|texto)|dame\s+(?:un\s+)?(?:post|copy|texto))/,
  CONTENT_PUBLISHED:/(?:ya\s+publi(?:que|qué|cé)|lo\s+publi(?:que|qué|cé)|publi(?:que|qué|cé)\s+(?:el\s+)?post|ya\s+lo\s+sub[ií])/,
  CONTENT_PROSPECT: /(?:mensaje\s+para\s+prospectar|copy\s+(?:para\s+)?(?:prospectar|prospecci[oó]n)|mensaje\s+de\s+prospecci[oó]n|texto\s+para\s+contactar|como\s+(?:abordar|contactar)\s+(?:prospectos?|clientes?))/,
  RADAR_OPPORTUNITY: /(?:fui\s+(?:al?|a\s+la)\s+\w+|estuve\s+en\s+(?:el|la|mi|un|una)\s+\w+|hoy\s+en\s+(?:el|la|mi)\s+\w+|en\s+mi\s+trabajo\s+vi|en\s+la\s+iglesia|en\s+el\s+gym|en\s+el\s+mercado|en\s+la\s+escuela\s+de\s+mis?\s+hijos?|con\s+mis?\s+vecinos?|en\s+el\s+gimnasio|hoy\s+en\s+la\s+escuela|hoy\s+en\s+el\s+gym|hoy\s+en\s+el\s+trabajo)/,
  QUERY_COMMISSION:  /(?:cuanto\s+(?:gane|gano)\s+(?:realmente|de\s+comision)|(?:mi|mis)\s+comision(?:es)?\s+(?:del?\s+mes|real(?:es)?)?|cuanto\s+es\s+mi\s+comision|comision\s+(?:real|del?\s+mes|de\s+mis?\s+ventas)|gane\s+(?:realmente|de\s+comision))/,
  SET_COMMISSION:    /(?:mi\s+comision\s+es\s+(?:del?\s+)?\d|(?:tengo|gano)\s+(?:el\s+)?\d+\s*%\s+(?:de\s+)?comision|mi\s+(?:porcentaje|comision)\s+(?:es|son?)\s+(?:del?\s+)?\d)/,
}

function extractLugar(text) {
  const n = normalize(text)
  if (/gym|gimnasio/.test(n)) return 'el gym'
  if (/iglesia|templo/.test(n)) return 'la iglesia'
  if (/mercado|tianguis/.test(n)) return 'el mercado'
  if (/trabajo|oficina/.test(n)) return 'el trabajo'
  if (/escuela|colegio/.test(n)) return 'la escuela'
  if (/vecinos?/.test(n)) return 'mi colonia'
  const m = text.match(/(?:fui\s+al?|estuve\s+en|hoy\s+en)\s+(\w+(?:\s+\w+)?)/i)
  return m ? m[1] : 'ese lugar'
}

// ─── Commission helpers ───────────────────────────────────────────────────────
function calcCommissionLocal(income, profile) {
  if (!profile?.commissionModel || !income) return null
  const { commissionModel, fixedPercent, tiers, pointValue, minPoints, sellPrice } = profile
  if (commissionModel === 'fixed') return income * ((fixedPercent || 30) / 100)
  if (commissionModel === 'tiered' && tiers?.length) {
    const tier = tiers.find(t => income >= t.from && (t.to === Infinity || income <= t.to))
    return tier ? { amount: income * (tier.percent / 100), percent: tier.percent } : null
  }
  if (commissionModel === 'points') {
    const pv = income / (sellPrice || 1)
    if (pv < (minPoints || 0)) return { amount: 0, pv, qualified: false }
    return { amount: pv * (pointValue || 0), pv, qualified: true }
  }
  return null
}

// ─── Intent analysis ──────────────────────────────────────────────────────────
function analyzeMessage(text, context = {}) {
  const n = normalize(text)
  const actions = []

  // ── Pending-action confirmation ─────────────────────────────────────────────
  if (context.pendingAction) {
    if (INTENTS.CONFIRM.test(n)) {
      const pa = context.pendingAction
      actions.push(pa)
      return { message: R.confirmPending(pa.type, pa.data?.name || ''), actions, pendingAction: null }
    }
    if (INTENTS.CANCEL.test(n)) {
      return { message: pick(['Entendido, lo ignoro. 👍', 'Ok, no lo registro.', 'Perfecto, descartado.']), actions, pendingAction: null }
    }
  }

  if (INTENTS.CLOSE_SALE.test(n)) {
    const name = extractName(text) || 'el cliente'
    const amount = extractAmount(text)
    const product = extractProduct(text)
    if (amount) {
      actions.push({ type: 'ADD_SALE', data: { customer: name, amount, product } })
      actions.push({ type: 'MOVE_PROSPECT', data: { name, stage: 'Cliente' } })
      return { message: R.closeSale(name, amount, product), actions }
    }
  }

  if (INTENTS.NEW_PROSPECT.test(n)) {
    const name = extractName(text) || 'Nuevo contacto'
    const interest = extractInterest(text)
    return {
      message: `¿Quieres que registre a **${name}** en tu CRM con interés en **${interest}**?`,
      actions: [],
      pendingAction: { type: 'ADD_PROSPECT', data: { name, interest, stage: 'Nuevo' } },
    }
  }

  // ADD_INTERACTION must come before CONTACTED to catch "wrote but no response" cases
  if (INTENTS.ADD_INTERACTION.test(n)) {
    const name = extractName(text)
    if (name) {
      const note = extractInteractionNote(text)
      const interactionType = detectInteractionType(text)
      actions.push({ type: 'ADD_INTERACTION', data: { name, note, interactionType } })
      const autoTasks = (context.tasks || []).filter(t =>
        t.status !== 'Hecha' && nameInText(name, t.title)
      )
      return { message: R.addInteraction(name, note, autoTasks), actions }
    }
  }

  if (INTENTS.CONTACTED.test(n)) {
    const name = extractName(text)
    if (name) {
      const autoTasks = (context.tasks || []).filter(t =>
        t.status !== 'Hecha' && nameInText(name, t.title)
      )
      actions.push({ type: 'MOVE_PROSPECT', data: { name, stage: 'Contactado' } })
      return { message: R.contacted(name, autoTasks), actions }
    }
  }

  if (INTENTS.INTERESTED.test(n)) {
    const name = extractName(text)
    if (name) { actions.push({ type: 'MOVE_PROSPECT', data: { name, stage: 'Interesado' } }); return { message: R.interested(name), actions } }
  }

  if (INTENTS.TO_CLOSE.test(n)) {
    const name = extractName(text)
    if (name) { actions.push({ type: 'MOVE_PROSPECT', data: { name, stage: 'Por cerrar' } }); return { message: R.toClose(name), actions } }
  }

  if (INTENTS.ADD_TASK.test(n)) {
    const title = extractTaskTitle(text)
    const priority = detectPriority(text)
    const name = extractName(text)
    actions.push({ type: 'ADD_TASK', data: { title, description: name ? `Seguimiento con ${name}` : '', priority, status: 'Pendiente' } })
    return { message: R.addTask(title), actions }
  }

  // Personal expense — checked before business to catch renta/super clearly
  if (INTENTS.EXPENSE_PERSONAL.test(n) && isPersonalExpense(n)) {
    const amount = extractAmount(text)
    if (amount) {
      const category = detectPersonalCategory(n)
      const concept = extractExpenseConcept(text) || category
      actions.push({ type: 'ADD_PERSONAL_EXPENSE', data: { concept, amount, category } })
      return { message: R.personalExpense(concept, amount, category), actions }
    }
  }

  // Business expense
  if (INTENTS.EXPENSE_BUSINESS.test(n)) {
    const amount = extractAmount(text)
    if (amount) {
      const category = detectBusinessCategory(n)
      const concept = extractExpenseConcept(text) || category
      actions.push({ type: 'ADD_EXPENSE', data: { concept, amount, category } })
      return { message: R.businessExpense(concept, amount, category), actions }
    }
  }

  if (INTENTS.TASK_DONE.test(n)) {
    const ref = extractTaskRef(text)
    if (ref) actions.push({ type: 'MOVE_TASK', data: { title: ref, status: 'Hecha' } })
    return { message: R.taskDone(ref || 'la tarea'), actions }
  }

  if (INTENTS.TASK_BLOCKED.test(n)) {
    const ref = extractTaskRef(text)
    if (ref) actions.push({ type: 'MOVE_TASK', data: { title: ref, status: 'Bloqueada' } })
    return { message: R.taskBlocked(ref || 'la tarea'), actions }
  }

  if (INTENTS.TASK_PROGRESS.test(n)) {
    const ref = extractTaskRef(text)
    if (ref) actions.push({ type: 'MOVE_TASK', data: { title: ref, status: 'En proceso' } })
    return { message: R.taskInProg(ref || 'la tarea'), actions }
  }

  if (INTENTS.QUERY_FOLLOWUP.test(n)) {
    const stale = getStaleProspects(context.prospects)
    return { message: R.queryFollowup(stale), actions }
  }

  if (INTENTS.QUERY_LAST_INTERACTION.test(n)) {
    const name = extractName(text)
    const prospects = context.prospects || []
    const prospect = name ? prospects.find(p => p.name.toLowerCase().includes(name.toLowerCase())) : null
    return { message: R.queryLastInteraction(prospect), actions }
  }

  if (INTENTS.QUERY_TASKS.test(n)) {
    const tasks = context.tasks || []
    let status = null
    if (/proceso|procesando/.test(n)) status = 'En proceso'
    else if (/pendiente|por hacer/.test(n)) status = 'Pendiente'
    else if (/bloqueada?/.test(n)) status = 'Bloqueada'
    else if (/hecha?|completada?/.test(n)) status = 'Hecha'
    return { message: R.queryTasks(status, tasks), actions }
  }

  if (INTENTS.QUERY_BUSINESS.test(n)) {
    const data = calcBusinessFinance(context.sales, context.expenses)
    return { message: R.queryBusiness(data), actions }
  }

  if (INTENTS.QUERY_PERSONAL.test(n)) {
    const data = calcPersonalHealth(context.sales, context.personalExpenses)
    return { message: R.queryPersonal(data), actions }
  }

  if (INTENTS.QUERY_PROSPECT_TASKS.test(n)) {
    return { message: R.queryProspectTasks(context.tasks || [], context.prospects || []), actions }
  }

  if (INTENTS.QUERY_PROSPECT_PIPE.test(n)) {
    const name = extractName(text)
    const prospects = context.prospects || []
    const prospect = name ? prospects.find(p => normalize(p.name).includes(normalize(name))) : null
    return { message: R.queryProspectPipeline(prospect, context.tasks || []), actions }
  }

  if (INTENTS.CONTENT_TODAY.test(n)) {
    actions.push({ type: 'OPEN_CONTENT_TODAY' })
    return { message: R.contentToday(), actions }
  }

  if (INTENTS.CONTENT_WEEK.test(n)) {
    actions.push({ type: 'GENERATE_CONTENT_WEEK' })
    return { message: R.contentWeek(), actions }
  }

  if (INTENTS.CONTENT_PUBLISHED.test(n)) {
    actions.push({ type: 'PUBLISH_TODAY_POST' })
    return { message: R.contentPublished(), actions }
  }

  if (INTENTS.CONTENT_PROSPECT.test(n)) {
    return { message: R.contentProspect(), actions }
  }

  if (INTENTS.CONTENT_GENERATE.test(n)) {
    actions.push({ type: 'OPEN_CONTENT_TODAY' })
    return { message: R.contentToday(), actions }
  }

  if (INTENTS.TIPS_PROSPECT.test(n)) return { message: pick(R.tips.prospecting), actions }
  if (INTENTS.TIPS_CLOSE.test(n))    return { message: pick(R.tips.closing), actions }
  if (INTENTS.TIPS_FOLLOW.test(n))   return { message: pick(R.tips.followup), actions }

  if (INTENTS.SET_COMMISSION.test(n)) {
    const m = text.match(/(\d+(?:[.,]\d+)?)\s*%/)
    const percent = m ? parseFloat(m[1]) : null
    return { message: R.setCommission(percent ? `${percent}` : 'tu'), actions }
  }

  if (INTENTS.QUERY_COMMISSION.test(n)) {
    const { income } = calcBusinessFinance(context.sales, context.expenses)
    return { message: R.queryCommission(income, context.userProfile), actions }
  }

  if (INTENTS.RADAR_OPPORTUNITY.test(n)) {
    const lugar = extractLugar(text)
    return {
      message: `🎯 Detecté una posible oportunidad en **${lugar}**. ¿Quieres que la analice para tu Radar de Oportunidades?`,
      actions: [],
      pendingAction: { type: 'OPEN_RADAR_WITH_CONTEXT', data: { texto: text, lugar } },
    }
  }

  return { message: pick(R.general), actions }
}

// ─── Streaming simulation ─────────────────────────────────────────────────────
async function simulateStream(text, onChunk) {
  const words = text.split(' ')
  let accumulated = ''
  for (const word of words) {
    accumulated += (accumulated ? ' ' : '') + word
    onChunk?.(accumulated)
    await new Promise(r => setTimeout(r, 22 + Math.random() * 38))
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function sendMessage(messages, onChunk, context = {}) {
  // ── Try Gemini proxy ──────────────────────────────────────────────────────
  // In production: always use the proxy (/chat → Vertex AI via ADC)
  // In dev: use the proxy only when the local server is running (localhost:3001)
  // Gate: PROD always tries Gemini; dev tries only if VITE_GEMINI_API_KEY is set
  const useGemini = import.meta.env.PROD ||
    (import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'REEMPLAZAR_CON_KEY')

  if (useGemini) {
    try {
      const result = await callGemini(messages, context)
      const words = result.message.split(' ')
      let accumulated = ''
      for (const word of words) {
        accumulated += (accumulated ? ' ' : '') + word
        onChunk?.(accumulated)
        await new Promise(r => setTimeout(r, 18 + Math.random() * 28))
      }
      return { message: result.message, actions: result.actions, pendingAction: null }
    } catch (err) {
      console.error('[Gemini error]', err.message)
      try { useWorkspaceStore.getState().addToast(`⚠️ Gemini: ${err.message}`, 'warning') } catch {}
      // In production don't fall back silently — re-throw so the UI shows the error
      if (import.meta.env.PROD) throw err
    }
  }

  // ── Pattern engine fallback (dev only) ────────────────────────────────────
  await new Promise(r => setTimeout(r, 280 + Math.random() * 180))
  const lastMsg = messages[messages.length - 1]
  const { message, actions, pendingAction = null } = analyzeMessage(lastMsg?.content || '', context)
  await simulateStream(message, onChunk)
  return { message, actions, pendingAction }
}
