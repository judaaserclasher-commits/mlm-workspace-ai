import { create } from 'zustand'
import { saveProfile, saveList, saveTransactions, saveChatHistory, saveMemory, saveRagPdfs, saveRagLinks, saveRagNotes, saveRadarOpportunities, loadAllUserData } from '../services/firestore'

export const THIS_MONTH = new Date().toISOString().slice(0, 7) // "2026-06"
const TODAY = new Date().toISOString().slice(0, 10)

// ─── Accent color helper ───────────────────────────────────────────────────────
function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

export function applyAccentColor(hex) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return
  const [r,g,b] = hexToRgb(hex)
  const dr = Math.max(0, r-30); const dg = Math.max(0, g-30); const db2 = Math.max(0, b-30)
  const hover = `#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db2.toString(16).padStart(2,'0')}`
  const glow  = `rgba(${r},${g},${b},0.10)`
  const light = `rgba(${r},${g},${b},0.10)`
  const mid   = `rgba(${r},${g},${b},0.20)`
  const root  = document.documentElement
  root.style.setProperty('--accent',        hex)
  root.style.setProperty('--accent-hover',  hover)
  root.style.setProperty('--accent-glow',   glow)
  root.style.setProperty('--border-active', hex)
  root.style.setProperty('--teal',          hex)
  root.style.setProperty('--teal-dark',     hover)
  root.style.setProperty('--teal-light',    light)
  root.style.setProperty('--teal-mid',      mid)
  localStorage.setItem('mlm-workspace-accent', hex)
}

// Apply saved accent at module load (before React renders)
const _initAccent = typeof localStorage !== 'undefined' && localStorage.getItem('mlm-workspace-accent')
if (_initAccent) applyAccentColor(_initAccent)

// ─── Initial data ─────────────────────────────────────────────────────────────
const initialProspects = [
  {
    id: '1',
    name: 'Carlos M.',
    interest: 'Proteínas',
    stage: 'Contactado',
    date: '2026-06-28',
    zone: 'CDMX Norte',
    opportunityType: 'Venta directa',
    interactions: [
      { id: 'i1-1', date: '2026-06-28', note: 'Primer contacto por Instagram. Le gustaron las fotos de transformación de clientes.', type: 'Primer contacto' },
      { id: 'i1-2', date: '2026-06-28', note: 'Le envié catálogo de proteínas con precios y testimonios.', type: 'Mensaje' },
    ],
  },
  {
    id: '2',
    name: 'Verónica R.',
    interest: 'Pérdida de peso',
    stage: 'Interesado',
    date: '2026-06-24',
    zone: 'Monterrey',
    opportunityType: 'Venta directa',
    interactions: [
      { id: 'i2-1', date: '2026-06-24', note: 'Primer contacto vía Facebook. Quiere bajar 8 kg antes de su boda.', type: 'Primer contacto' },
      { id: 'i2-2', date: '2026-06-24', note: 'Le compartí casos de éxito de clientas con objetivo similar.', type: 'Mensaje' },
    ],
  },
  {
    id: '3',
    name: 'Diego P.',
    interest: 'Plan negocio',
    stage: 'Por cerrar',
    date: '2026-06-26',
    zone: 'Guadalajara',
    opportunityType: 'Expansión de red',
    interactions: [
      { id: 'i3-1', date: '2026-06-26', note: 'Contacto en evento de networking. Emprendedor que busca ingresos adicionales.', type: 'Primer contacto' },
      { id: 'i3-2', date: '2026-06-26', note: 'Explicación del plan de compensación y potencial de la red. Muy interesado.', type: 'Seguimiento' },
    ],
  },
  {
    id: '4',
    name: 'Mariana L.',
    interest: 'Vitaminas',
    stage: 'Nuevo',
    date: '2026-06-29',
    zone: 'CDMX Sur',
    opportunityType: 'Venta directa',
    interactions: [
      { id: 'i4-1', date: '2026-06-29', note: 'Referida por una clienta en común. Le interesa el kit de vitaminas C+D.', type: 'Primer contacto' },
    ],
  },
  {
    id: '5',
    name: 'Roberto K.',
    interest: 'Proteínas',
    stage: 'Cliente',
    date: '2026-06-25',
    zone: 'CDMX Poniente',
    opportunityType: 'Venta directa',
    interactions: [
      { id: 'i5-1', date: '2026-06-25', note: 'Primer pedido de proteína Whey. Muy satisfecho desde el primer contacto.', type: 'Primer contacto' },
      { id: 'i5-2', date: '2026-06-25', note: 'Compra completada. Pago recibido. Cliente activo.', type: 'Seguimiento' },
    ],
  },
]

const initialSales = [
  { id: '1', customer: 'Patricia L.', amount: 180, product: 'Vitaminas', date: '2026-06-05' },
  { id: '2', customer: 'Jorge M.', amount: 350, product: 'Proteína Whey', date: '2026-06-12' },
  { id: '3', customer: 'Manuel R.', amount: 520, product: 'Pack Negocio', date: '2026-06-18' },
  { id: '4', customer: 'Roberto K.', amount: 280, product: 'Proteína Whey', date: '2026-06-25' },
  { id: '5', customer: 'Laura S.', amount: 150, product: 'Vitaminas C+D', date: '2026-06-27' },
  { id: '6', customer: 'Fernanda T.', amount: 420, product: 'Pack Premium', date: '2026-06-29' },
]

const initialExpenses = [
  { id: '1', concept: 'Inventario proteínas', amount: 800, category: 'Inventario', date: '2026-06-03' },
  { id: '2', concept: 'Zoom Premium', amount: 50, category: 'Servicios', date: '2026-06-01' },
  { id: '3', concept: 'Anuncios Facebook', amount: 250, category: 'Marketing', date: '2026-06-10' },
  { id: '4', concept: 'Gasolina entregas', amount: 180, category: 'Transporte', date: '2026-06-17' },
  { id: '5', concept: 'Empaques y etiquetas', amount: 120, category: 'Inventario', date: '2026-06-22' },
]

const initialPersonalExpenses = [
  { id: '1', concept: 'Renta junio', amount: 3500, category: 'Vivienda', date: '2026-06-01' },
  { id: '2', concept: 'Netflix + Spotify', amount: 350, category: 'Servicios', date: '2026-06-05' },
  { id: '3', concept: 'Supermercado', amount: 1400, category: 'Alimentación', date: '2026-06-08' },
  { id: '4', concept: 'Gasolina personal', amount: 580, category: 'Transporte', date: '2026-06-14' },
  { id: '5', concept: 'Curso de ventas online', amount: 200, category: 'Educación', date: '2026-06-20' },
]

const initialPersonalBudgets = {
  Vivienda: 3500,
  Alimentación: 2000,
  Transporte: 800,
  Educación: 500,
  Servicios: 400,
  Otros: 600,
}

// Demo tasks pre-linked to prospects by id/name for immediate badge display
const initialTasks = [
  { id: '1', title: 'Llamar a Verónica R.', description: 'Seguimiento propuesta proteínas', status: 'Pendiente', priority: 'Alta', date: '2026-06-29', prospectId: '2', prospectName: 'Verónica R.' },
  { id: '2', title: 'Enviar catálogo a Diego', description: 'Pack negocio completo', status: 'En proceso', priority: 'Media', date: '2026-06-28', prospectId: '3', prospectName: 'Diego P.' },
  { id: '3', title: 'Reunión equipo semanal', description: 'Zoom lunes 10am', status: 'Pendiente', priority: 'Media', date: '2026-06-30', prospectId: null, prospectName: null },
  { id: '4', title: 'Actualizar Instagram', description: 'Post testimonios clientes', status: 'Bloqueada', priority: 'Baja', date: '2026-06-27', prospectId: null, prospectName: null },
  { id: '5', title: 'Cierre con Laura S.', description: '¡Pedido completado!', status: 'Hecha', priority: 'Alta', date: '2026-06-25', prospectId: null, prospectName: null },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function taskMatches(taskTitle, ref) {
  if (!ref || ref.length < 3) return false
  const t = taskTitle.toLowerCase()
  const r = ref.toLowerCase()
  if (t.includes(r)) return true
  const skip = new Set(['para', 'este', 'esta', 'tarea', 'llamada', 'hacer', 'enviar', 'reunion'])
  const keywords = r.split(/\s+/).filter(w => w.length > 3 && !skip.has(w))
  return keywords.length > 0 && keywords.some(w => t.includes(w))
}

function stageChangeNote(newStage) {
  const notes = {
    'Contactado': 'Primer contacto realizado con el prospecto.',
    'Interesado': 'Mostró interés en el producto. Avanzó en el pipeline.',
    'Por cerrar': 'Listo para tomar una decisión de compra.',
    'Cliente': '¡Conversión exitosa! Se convirtió en cliente activo.',
  }
  return notes[newStage] || `Movido a etapa: ${newStage}`
}

function makeInteraction(note, type = 'Seguimiento') {
  return { id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, date: TODAY, note, type }
}

// Accent-insensitive name matching: "Verónica R." matches "Llamar a Veronica"
const stripA = (s) =>
  s.replace(/[áàäâ]/gi, 'a').replace(/[éèëê]/gi, 'e')
   .replace(/[íìïî]/gi, 'i').replace(/[óòöô]/gi, 'o')
   .replace(/[úùüû]/gi, 'u').replace(/ñ/gi, 'n')
   .toLowerCase()

export function nameInText(prospectName, text) {
  if (!prospectName || !text) return false
  const parts = stripA(prospectName).replace(/\./g, '').split(/\s+/).filter(p => p.length > 2)
  const t = stripA(text)
  return parts.some(part => t.includes(part))
}

// Collect IDs of non-Hecha tasks linked to a prospect (by id or by name in title)
function linkedTaskIds(tasks, prospectId, prospectName) {
  return tasks
    .filter(t => t.status !== 'Hecha' && (t.prospectId === prospectId || nameInText(prospectName, t.title)))
    .map(t => t.id)
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useWorkspaceStore = create((set, get) => {
  // Fire-and-forget Firestore sync after mutations
  function _sync(collections) {
    const s = get()
    if (!s.uid) return
    const { uid } = s
    if (collections.includes('prospects'))       saveList(uid, 'prospects', s.prospects)
    if (collections.includes('tasks'))           saveList(uid, 'tasks', s.tasks)
    if (collections.includes('transactions'))    saveTransactions(uid, s.sales, s.expenses)
    if (collections.includes('personalExpenses'))saveList(uid, 'personalExpenses', s.personalExpenses)
  }

  return ({
  uid: null,
  prospects: [],
  sales: [],
  expenses: [],
  personalExpenses: initialPersonalExpenses,
  personalBudgets: initialPersonalBudgets,
  salesGoal: 5000,
  tasks: [],
  messages: [],
  chatHistory: [],
  memory: null,
  rag: { pdfs: [], links: [], notes: [] },
  isTyping: false,
  activeModule: 'inicio',
  lastAction: null,
  isSimulating: false,
  userProfile: null,
  theme: (typeof localStorage !== 'undefined' ? localStorage.getItem('mlm-workspace-theme') : null) || 'light',
  accentColor: (typeof localStorage !== 'undefined' ? localStorage.getItem('mlm-workspace-accent') : null) || '#00A98F',
  brandLogoUrl: null,
  crmFocusProspectId: null,
  taskHighlightProspectId: null,
  weeklyContent: [],
  publishedContent: [],
  contentDayProposal: null,
  contentGenerateTrigger: 0,
  radarOpportunities: [],
  radarPrefilledText: null,
  toasts: [],

  // ── Auth / Firestore lifecycle ─────────────────────────────────────────────

  loadUserData: async (uid) => {
    set({ uid })
    const { profile, prospects, tasks, transactions, personalExpenses, chatHistory, memory, rag, radarOpportunities } = await loadAllUserData(uid)
    console.log('[loadUserData] uid:', uid, '| onboardingComplete:', profile?.onboardingComplete)
    // Apply saved theme immediately
    const savedTheme = profile?.theme || localStorage.getItem('mlm-workspace-theme') || 'light'
    localStorage.setItem('mlm-workspace-theme', savedTheme)
    document.documentElement.dataset.theme = savedTheme

    const savedAccent = profile?.accentColor || localStorage.getItem('mlm-workspace-accent') || '#00A98F'
    applyAccentColor(savedAccent)

    set({
      userProfile:      profile,
      theme:            savedTheme,
      accentColor:      savedAccent,
      brandLogoUrl:     profile?.brandLogoUrl || null,
      prospects:        prospects        ?? [],
      tasks:            tasks            ?? [],
      sales:            transactions?.sales    ?? [],
      expenses:         transactions?.expenses ?? [],
      personalExpenses: personalExpenses ?? [],
      chatHistory:      chatHistory      ?? [],
      memory,
      rag:              rag ?? { pdfs: [], links: [], notes: [] },
      radarOpportunities: radarOpportunities ?? [],
    })
  },

  clearStore: () => {
    localStorage.removeItem('mlm-workspace-profile')
    set({
      uid: null,
      userProfile: null,
      prospects: [],
      tasks: [],
      sales: [],
      expenses: [],
      personalExpenses: [],
      messages: [],
      chatHistory: [],
      memory: null,
      rag: { pdfs: [], links: [], notes: [] },
      radarOpportunities: [],
      radarPrefilledText: null,
      isSimulating: false,
      brandLogoUrl: null,
      activeModule: 'inicio',
    })
  },

  setTheme: (newTheme) => {
    localStorage.setItem('mlm-workspace-theme', newTheme)
    document.documentElement.classList.add('theme-transition')
    document.documentElement.dataset.theme = newTheme
    setTimeout(() => document.documentElement.classList.remove('theme-transition'), 250)
    set({ theme: newTheme })
    const { uid, userProfile } = get()
    if (uid && userProfile) {
      const updated = { ...userProfile, theme: newTheme }
      set({ userProfile: updated })
      saveProfile(uid, updated).catch(() => {})
    }
  },

  setAccentColor: (color) => {
    applyAccentColor(color)
    set({ accentColor: color })
    const { uid, userProfile } = get()
    if (uid && userProfile) {
      const updated = { ...userProfile, accentColor: color }
      set({ userProfile: updated })
      saveProfile(uid, updated).catch(() => {})
    }
  },

  setBrandLogoUrl: (url) => {
    set({ brandLogoUrl: url })
    const { uid, userProfile } = get()
    if (uid && userProfile) {
      const updated = { ...userProfile, brandLogoUrl: url }
      set({ userProfile: updated })
      saveProfile(uid, updated).catch(() => {})
    }
  },

  // Save current session turn to Firestore (fire-and-forget)
  saveChatTurn: () => {
    const { uid, chatHistory, messages } = get()
    if (!uid) return
    const combined = [...chatHistory, ...messages].slice(-100)
    saveChatHistory(uid, combined)
  },

  // Update Sherix memory from actions and persist
  updateMemory: (actions) => {
    const { uid, memory, userProfile } = get()
    if (!uid) return
    const prev = memory || { name: userProfile?.name || '', keyProspects: [], recentWins: [], pendingFollowups: [] }
    const updated = { ...prev }
    for (const a of (actions || [])) {
      if (a.type === 'ADD_SALE') {
        updated.recentWins = [a.data.customer, ...(updated.recentWins || []).filter(n => n !== a.data.customer)].slice(0, 5)
      }
      if (a.type === 'ADD_PROSPECT') {
        updated.keyProspects = [a.data.name, ...(updated.keyProspects || []).filter(n => n !== a.data.name)].slice(0, 10)
      }
      if (a.type === 'ADD_INTERACTION') {
        updated.pendingFollowups = [a.data.name, ...(updated.pendingFollowups || []).filter(n => n !== a.data.name)].slice(0, 5)
      }
      if (a.type === 'MOVE_PROSPECT' && a.data.stage === 'Cliente') {
        updated.recentWins = [a.data.name, ...(updated.recentWins || [])].slice(0, 5)
        updated.pendingFollowups = (updated.pendingFollowups || []).filter(n => n !== a.data.name)
      }
    }
    updated.lastActive = new Date()
    if (!updated.name && userProfile?.name) updated.name = userProfile.name
    set({ memory: updated })
    saveMemory(uid, updated)
  },

  // RAG knowledge base mutations — each saves to Firestore fire-and-forget
  setRagPdfs: (pdfs) => {
    set(s => ({ rag: { ...s.rag, pdfs } }))
    const { uid } = get()
    if (uid) saveRagPdfs(uid, pdfs)
  },
  setRagLinks: (links) => {
    set(s => ({ rag: { ...s.rag, links } }))
    const { uid } = get()
    if (uid) saveRagLinks(uid, links)
  },
  setRagNotes: (notes) => {
    set(s => ({ rag: { ...s.rag, notes } }))
    const { uid } = get()
    if (uid) saveRagNotes(uid, notes)
  },

  setActiveModule: (module) => set({ activeModule: module }),
  setTyping: (val) => set({ isTyping: val }),
  setSimulating: (val) => set({ isSimulating: val }),
  setCrmFocus: (id) => set({ crmFocusProspectId: id }),
  setTaskHighlight: (id) => set({ taskHighlightProspectId: id }),
  addToast: (message, type = 'info') => {
    const id = Date.now().toString()
    set(state => ({ toasts: [...state.toasts.slice(-2), { id, message, type }] }))
    setTimeout(() => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })), 3200)
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  setWeeklyContent: (items) => set({ weeklyContent: items }),
  setContentDayProposal: (item) => set({ contentDayProposal: item }),
  publishPost: (id) => set((state) => {
    const source = state.contentDayProposal?.id === id
      ? state.contentDayProposal
      : state.weeklyContent.find(p => p.id === id)
    if (!source) return {}
    const updated = { ...source, published: true, publishedAt: TODAY }
    return {
      contentDayProposal: state.contentDayProposal?.id === id ? updated : state.contentDayProposal,
      weeklyContent: state.weeklyContent.map(p => p.id === id ? updated : p),
      publishedContent: [...state.publishedContent.filter(p => p.id !== id), updated],
    }
  }),

  setUserProfile: (profile) => {
    console.log('[setUserProfile] onboardingComplete:', profile?.onboardingComplete, '| uid:', get().uid)
    localStorage.setItem('mlm-workspace-profile', JSON.stringify(profile))
    set({ userProfile: profile })
    const { uid } = get()
    if (uid) {
      saveProfile(uid, profile)
        .then(() => console.log('[setUserProfile] Firestore save OK'))
        .catch(err => console.error('[setUserProfile] Firestore FAILED:', err?.code, err?.message))
    } else {
      console.warn('[setUserProfile] uid is null — profile NOT saved to Firestore')
    }
  },

  addRadarOpportunity: (opp) => {
    set((state) => ({ radarOpportunities: [opp, ...state.radarOpportunities] }))
    const { uid, radarOpportunities } = get()
    if (uid) saveRadarOpportunities(uid, [opp, ...radarOpportunities]).catch(() => {})
  },

  removeRadarOpportunity: (id) => {
    set((state) => ({ radarOpportunities: state.radarOpportunities.filter(o => o.id !== id) }))
    const { uid, radarOpportunities } = get()
    if (uid) saveRadarOpportunities(uid, radarOpportunities.filter(o => o.id !== id)).catch(() => {})
  },

  setRadarPrefilledText: (text) => set({ radarPrefilledText: text }),

  addTasks: (newTasks) => {
    set((state) => ({
      tasks: [
        ...newTasks.map((t, i) => ({
          id: `onb-${Date.now()}-${i}`,
          title: t.title,
          description: t.description || '',
          status: 'Pendiente',
          priority: t.priority || 'Alta',
          date: TODAY,
          prospectId: null,
          prospectName: null,
        })),
        ...state.tasks,
      ],
      lastAction: { type: 'ADD_TASK', module: 'tasks' },
    }))
    _sync(['tasks'])
  },

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, id: Date.now().toString(), timestamp: new Date() }],
  })),

  // Called from ProspectDetail UI — auto-completes related pending tasks
  addInteraction: (prospectId, note, interactionType) => {
    set((state) => {
      const prospect = state.prospects.find(p => p.id === prospectId)
      const autoIds = prospect ? linkedTaskIds(state.tasks, prospectId, prospect.name) : []
      return {
        prospects: state.prospects.map(p =>
          p.id !== prospectId ? p : {
            ...p,
            interactions: [...(p.interactions || []), makeInteraction(note, interactionType)],
          }
        ),
        tasks: state.tasks.map(t => autoIds.includes(t.id) ? { ...t, status: 'Hecha' } : t),
        lastAction: { type: 'ADD_INTERACTION', module: 'crm' },
      }
    })
    _sync(['prospects', 'tasks'])
  },

  // Called from kanban DnD and task status changes
  // When completing a prospect-linked task → adds interaction to that prospect
  moveTaskById: (taskId, newStatus) => {
    set((state) => {
      const task = state.tasks.find(t => t.id === taskId)
      let updatedProspects = state.prospects
      if (newStatus === 'Hecha' && task?.prospectId) {
        updatedProspects = state.prospects.map(p =>
          p.id !== task.prospectId ? p : {
            ...p,
            interactions: [...(p.interactions || []), makeInteraction(`Tarea completada: ${task.title}`, 'Seguimiento')],
          }
        )
      }
      return {
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
        prospects: updatedProspects,
        activeModule: 'tasks',
        lastAction: { type: 'MOVE_TASK', module: 'tasks' },
      }
    })
    _sync(['tasks', 'prospects'])
  },

  applyActions: (actions) => {
    if (!actions || !Array.isArray(actions)) return
    actions.forEach((action) => get()._applyAction(action))
  },

  _applyAction: (action) => {
    switch (action.type) {
      case 'ADD_PROSPECT':
        set((state) => ({
          prospects: [{
            id: Date.now().toString(),
            name: action.data.name,
            interest: action.data.interest || 'Sin especificar',
            stage: action.data.stage || 'Nuevo',
            date: TODAY,
            zone: action.data.zone || '',
            opportunityType: action.data.opportunityType || 'Venta directa',
            interactions: [makeInteraction(
              action.data.note || `Primer contacto con ${action.data.name}.`,
              'Primer contacto'
            )],
          }, ...state.prospects],
          lastAction: { type: 'ADD_PROSPECT', module: 'crm' },
          activeModule: 'crm',
        }))
        _sync(['prospects'])
        get().addToast(`👤 ${action.data.name} agregado al CRM`, 'info')
        break

      case 'MOVE_PROSPECT':
        set((state) => {
          const moved = state.prospects.find(p =>
            stripA(p.name).includes(stripA(action.data.name))
          )
          if (!moved) {
            // Prospect not in CRM — still auto-complete tasks mentioning this name
            const nameAutoIds = state.tasks
              .filter(t => t.status !== 'Hecha' && nameInText(action.data.name, t.title))
              .map(t => t.id)
            if (nameAutoIds.length === 0) return {}
            return {
              tasks: state.tasks.map(t => nameAutoIds.includes(t.id) ? { ...t, status: 'Hecha' } : t),
              lastAction: { type: 'MOVE_PROSPECT', module: 'crm' },
            }
          }
          const pid = moved.id
          const pname = moved.name
          const newStage = action.data.stage

          // Auto-complete pending tasks linked to this prospect
          const autoIds = linkedTaskIds(state.tasks, pid, pname)

          // Auto-create tasks based on stage transition
          const stageTasks = []
          if (newStage === 'Por cerrar') {
            const alreadyExists = state.tasks.some(t =>
              t.prospectId === pid && t.title.startsWith('Cerrar venta') && t.status !== 'Hecha'
            )
            if (!alreadyExists) {
              stageTasks.push({
                id: `stg-${Date.now()}`,
                title: `Cerrar venta con ${pname}`,
                description: 'Está listo para decidir — haz el cierre hoy.',
                status: 'Pendiente', priority: 'Alta', date: TODAY,
                prospectId: pid, prospectName: pname,
              })
            }
          } else if (newStage === 'Cliente') {
            const alreadyWon = state.tasks.some(t =>
              t.prospectId === pid && t.title.startsWith('✓ Venta cerrada')
            )
            if (!alreadyWon) {
              stageTasks.push({
                id: `stg-${Date.now()}`,
                title: `✓ Venta cerrada con ${pname}`,
                description: '¡Cliente ganado!',
                status: 'Hecha', priority: 'Alta', date: TODAY,
                prospectId: pid, prospectName: pname,
              })
            }
          }

          return {
            prospects: state.prospects.map(p =>
              p.id !== pid ? p : {
                ...p,
                stage: newStage,
                interactions: [...(p.interactions || []), makeInteraction(stageChangeNote(newStage), 'Cambio de etapa')],
              }
            ),
            tasks: [
              ...stageTasks,
              ...state.tasks.map(t => autoIds.includes(t.id) ? { ...t, status: 'Hecha' } : t),
            ],
            lastAction: { type: 'MOVE_PROSPECT', module: 'crm' },
            activeModule: 'crm',
          }
        })
        _sync(['prospects', 'tasks'])
        break

      // Called from chat engine — auto-completes related pending tasks
      case 'ADD_INTERACTION':
        set((state) => {
          const matched = state.prospects.find(p =>
            stripA(p.name).includes(stripA(action.data.name))
          )
          const autoIds = matched
            ? linkedTaskIds(state.tasks, matched.id, matched.name)
            : state.tasks
                .filter(t => t.status !== 'Hecha' && nameInText(action.data.name, t.title))
                .map(t => t.id)
          return {
            prospects: state.prospects.map(p => {
              if (!stripA(p.name).includes(stripA(action.data.name))) return p
              return {
                ...p,
                interactions: [...(p.interactions || []), makeInteraction(action.data.note, action.data.interactionType || 'Seguimiento')],
              }
            }),
            tasks: state.tasks.map(t => autoIds.includes(t.id) ? { ...t, status: 'Hecha' } : t),
            lastAction: { type: 'ADD_INTERACTION', module: 'crm' },
            activeModule: 'crm',
          }
        })
        _sync(['prospects', 'tasks'])
        break

      case 'ADD_SALE':
        set((state) => ({
          sales: [{ id: Date.now().toString(), customer: action.data.customer, amount: Number(action.data.amount), product: action.data.product || 'Producto', date: TODAY }, ...state.sales],
          lastAction: { type: 'ADD_SALE', module: 'business' },
          activeModule: 'business',
        }))
        _sync(['transactions'])
        get().addToast(`🎉 ¡Venta cerrada! +$${Number(action.data.amount).toLocaleString('es-MX')} con ${action.data.customer}`, 'success')
        break

      case 'ADD_EXPENSE':
        set((state) => ({
          expenses: [{ id: Date.now().toString(), concept: action.data.concept, amount: Number(action.data.amount), category: action.data.category || 'Otros', date: TODAY }, ...state.expenses],
          lastAction: { type: 'ADD_EXPENSE', module: 'business' },
          activeModule: 'business',
        }))
        _sync(['transactions'])
        break

      case 'ADD_PERSONAL_EXPENSE':
        set((state) => ({
          personalExpenses: [{ id: Date.now().toString(), concept: action.data.concept, amount: Number(action.data.amount), category: action.data.category || 'Otros', date: TODAY }, ...state.personalExpenses],
          lastAction: { type: 'ADD_PERSONAL_EXPENSE', module: 'personal' },
          activeModule: 'personal',
        }))
        _sync(['personalExpenses'])
        break

      case 'ADD_TASK':
        set((state) => {
          const title = action.data.title || ''
          // Auto-link to a prospect if the title mentions their name
          const linkedProspect = action.data.prospectId
            ? state.prospects.find(p => p.id === action.data.prospectId)
            : state.prospects.find(p => nameInText(p.name, title)) || null
          return {
            tasks: [{
              id: Date.now().toString(),
              title,
              description: action.data.description || '',
              status: action.data.status || 'Pendiente',
              priority: action.data.priority || 'Media',
              date: TODAY,
              prospectId: linkedProspect?.id || null,
              prospectName: linkedProspect?.name || null,
            }, ...state.tasks],
            lastAction: { type: 'ADD_TASK', module: 'tasks' },
            activeModule: 'tasks',
          }
        })
        _sync(['tasks'])
        break

      case 'MOVE_TASK':
        set((state) => {
          const matched = state.tasks.filter(t => taskMatches(t.title, action.data.title))
          // When completing a linked task via chat, add interaction to the prospect
          let updatedProspects = state.prospects
          if (action.data.status === 'Hecha') {
            const linked = matched.filter(t => t.prospectId && t.status !== 'Hecha')
            if (linked.length > 0) {
              updatedProspects = state.prospects.map(p => {
                const task = linked.find(t => t.prospectId === p.id)
                if (!task) return p
                return {
                  ...p,
                  interactions: [...(p.interactions || []), makeInteraction(`Tarea completada: ${task.title}`, 'Seguimiento')],
                }
              })
            }
          }
          return {
            tasks: state.tasks.map(t => taskMatches(t.title, action.data.title) ? { ...t, status: action.data.status } : t),
            prospects: updatedProspects,
            lastAction: { type: 'MOVE_TASK', module: 'tasks' },
            activeModule: 'tasks',
          }
        })
        _sync(['tasks', 'prospects'])
        break

      case 'OPEN_CONTENT_TODAY':
        set({ activeModule: 'content' })
        break

      case 'GENERATE_CONTENT_WEEK':
        set((state) => ({ activeModule: 'content', contentGenerateTrigger: state.contentGenerateTrigger + 1 }))
        break

      case 'PUBLISH_TODAY_POST':
        set((state) => {
          if (!state.contentDayProposal) return {}
          const updated = { ...state.contentDayProposal, published: true, publishedAt: TODAY }
          return {
            contentDayProposal: updated,
            weeklyContent: state.weeklyContent.map(p => p.id === updated.id ? updated : p),
            publishedContent: [...state.publishedContent.filter(p => p.id !== updated.id), updated],
          }
        })
        break

      case 'OPEN_RADAR_WITH_CONTEXT':
        set({ activeModule: 'oportunidades', radarPrefilledText: action.data?.texto || null })
        break

      default:
        break
    }
  },
})})