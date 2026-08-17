const norm = (t) =>
  t.replace(/[áàäâ]/gi, 'a').replace(/[éèëê]/gi, 'e')
   .replace(/[íìïî]/gi, 'i').replace(/[óòöô]/gi, 'o')
   .replace(/[úùüû]/gi, 'u').replace(/ñ/gi, 'n').toLowerCase()

// ─── Step 1: Routine Analysis ─────────────────────────────────────────────────

const SPACE_KW = {
  gym:       ['gym', 'gimnasio', 'entreno', 'entrenamiento', 'crossfit', 'spinning', 'pilates', 'yoga', 'deporte', 'ejercicio', 'correr', 'atletismo', 'natacion', 'futbol'],
  escuela:   ['escuela', 'colegio', 'kinder', 'universidad', 'facultad', 'clase', 'maestra', 'maestro', 'hijo', 'hija', 'nino', 'jardin', 'preescolar'],
  trabajo:   ['oficina', 'trabajo', 'empresa', 'jefe', 'companero', 'reunion', 'cargo', 'empleado'],
  mercado:   ['mercado', 'tianguis', 'super', 'supermercado', 'compras', 'tienda'],
  iglesia:   ['iglesia', 'templo', 'misa', 'pastor', 'oracion', 'evangelio'],
  parque:    ['parque', 'plaza', 'jardin', 'caminar', 'caminata', 'corredor'],
  salon:     ['salon', 'peluqueria', 'estetica', 'spa', 'unas', 'cabello'],
  cafeteria: ['cafe', 'cafeteria', 'desayuno', 'desayunar', 'brunch'],
}

const GROUP_KW = {
  'mamás':          ['mama', 'mamas', 'hijos', 'ninos', 'kinder', 'jardin', 'maternidad'],
  'deportistas':    ['gym', 'ejercicio', 'entrena', 'atletismo', 'deporte', 'crossfit', 'runner'],
  'trabajadores':   ['oficina', 'companeros', 'empresa', 'trabajo', 'empleados'],
  'estudiantes':    ['universidad', 'facultad', 'campus', 'estudiante', 'carrera'],
  'emprendedores':  ['emprendedor', 'negocio', 'cliente', 'venta'],
  'amas de casa':   ['casa', 'hogar', 'limpiar', 'cocinar', 'labores'],
}

const TRAIT_KW = {
  'salud':          ['salud', 'sano', 'saludable', 'comer bien', 'nutricion', 'dieta', 'bienestar', 'proteina', 'vitamina'],
  'disciplina':     ['rutina', 'ejercicio', 'organizado', 'puntual', 'constante', 'habito', 'horario'],
  'comunidad':      ['familia', 'amigos', 'vecinos', 'grupo', 'comunidad', 'iglesia', 'juntas'],
  'productividad':  ['productivo', 'eficiente', 'metas', 'logros', 'objetivos', 'negocio'],
  'bienestar':      ['relax', 'descanso', 'meditacion', 'equilibrio', 'paz', 'yoga'],
}

const AVAIL_KW = {
  'mañana':  ['manana', 'temprano', 'amanecer', 'desayuno', 'antes del trabajo', 'al levantarme', 'en las mananas'],
  'tarde':   ['tarde', 'mediodia', 'despues de comer', 'en las tardes'],
  'noche':   ['noche', 'nocturno', 'cuando llego', 'despues del trabajo', 'en las noches', 'cena'],
}

export function analyzeRoutine(text) {
  const n = norm(text)
  const spaces = [], socialGroups = [], psychoTraits = [], availability = []

  for (const [space, kws] of Object.entries(SPACE_KW))
    if (kws.some(kw => n.includes(kw))) spaces.push(space)
  for (const [group, kws] of Object.entries(GROUP_KW))
    if (kws.some(kw => n.includes(kw))) socialGroups.push(group)
  for (const [trait, kws] of Object.entries(TRAIT_KW))
    if (kws.some(kw => n.includes(kw))) psychoTraits.push(trait)
  for (const [time, kws] of Object.entries(AVAIL_KW))
    if (kws.some(kw => n.includes(kw))) availability.push(time)

  return { spaces, socialGroups, psychoTraits, availability }
}

export function buildHypothesis(spaces, socialGroups, psychoTraits) {
  const SPACE_LABEL = {
    gym: 'el mundo del fitness',
    escuela: 'el entorno escolar',
    trabajo: 'el ambiente laboral',
    mercado: 'espacios de compras',
    iglesia: 'la comunidad religiosa',
    parque: 'espacios al aire libre',
    salon: 'el sector de belleza',
    cafeteria: 'cafeterías y puntos de encuentro',
  }

  const parts = []
  if (spaces.length > 0) {
    const labels = spaces.slice(0, 2).map(s => SPACE_LABEL[s] || s).join(' y ')
    parts.push(`te mueves principalmente en **${labels}**`)
  }
  if (socialGroups.length > 0) {
    parts.push(`tienes contacto frecuente con **${socialGroups.slice(0, 2).join(' y ')}**`)
  }
  if (psychoTraits.length > 0) {
    parts.push(`valoras la **${psychoTraits[0]}**`)
  }

  return parts.length > 0
    ? parts.join(', ')
    : 'tienes una rutina activa con múltiples puntos de contacto social'
}

// ─── Step 2: Brand & Ticket ───────────────────────────────────────────────────

const KNOWN_BRANDS = [
  'herbalife', 'omnilife', 'amway', 'yanbal', 'belcorp', '4life', 'natura',
  'mary kay', 'usana', 'avon', 'nu skin', 'vorwerk', 'tupperware', 'enagic',
  'isagenix', 'monat', 'jeunesse', 'forever living', 'fm world', 'gano excel',
]

export function detectBrand(text) {
  const n = norm(text)
  for (const brand of KNOWN_BRANDS) {
    if (n.includes(norm(brand)))
      return brand.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
  return null
}

export function extractTicketAmount(text) {
  const m = text.match(/\$\s*(\d[\d.,]*)|(\d[\d.,]*)\s*(?:pesos?|dolares?|mxn|usd)/i)
  if (m) return parseFloat((m[1] || m[2]).replace(',', ''))
  const numM = text.match(/\b(\d{2,6})\b/)
  if (numM) return parseInt(numM[1])
  return null
}

// ─── Step 3: Finance Mode ─────────────────────────────────────────────────────

export function detectFinanceMode(text) {
  const n = norm(text)
  if (/solo negocio|unicamente negocio|solo el negocio/.test(n)) return 'business'
  if (/solo personal|solo gastos personales/.test(n)) return 'personal'
  return 'both'
}

// ─── Step 4: Social Platforms ─────────────────────────────────────────────────

export function detectPlatforms(text) {
  const n = norm(text)
  const platforms = []
  if (/instagram|ig\b/.test(n)) platforms.push('Instagram')
  if (/tiktok|tik tok/.test(n)) platforms.push('TikTok')
  if (/facebook|fb\b/.test(n)) platforms.push('Facebook')
  if (/whatsapp|whats/.test(n)) platforms.push('WhatsApp')
  if (/youtube|yt\b/.test(n)) platforms.push('YouTube')
  if (/twitter|x\.com/.test(n)) platforms.push('Twitter/X')
  if (/telegram/.test(n)) platforms.push('Telegram')

  const followers = {}
  const m = text.match(/(\d[\d.]*)\s*[kK]/)
  if (m && platforms.length > 0) {
    followers[platforms[0]] = parseFloat(m[1]) * 1000
  } else {
    const numM = text.match(/\b(\d{3,7})\b/)
    if (numM && platforms.length > 0) followers[platforms[0]] = parseInt(numM[1])
  }

  return { platforms, followers }
}

// ─── Name Extraction ──────────────────────────────────────────────────────────

export function extractUserName(text) {
  const patterns = [
    /(?:me\s+llamo|mi\s+nombre\s+es|soy)\s+([A-Za-záéíóúüñÁÉÍÓÚÜÑ][a-záéíóúüñ]+)/u,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  const words = text.trim().split(/\s+/)
  for (const w of words) {
    if (/^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]{2,}$/.test(w)) return w
  }
  return null
}

// ─── Action Plan Generator ────────────────────────────────────────────────────

export function generateActionPlan(profile) {
  const { spaces = [], platforms = [], psychoTraits = [], brand = 'tu producto' } = profile
  const tasks = []

  // Task 1: Prospecting space
  if (spaces.includes('gym')) {
    tasks.push({
      title: 'Prospección en el gym hoy',
      description: `Observa si alguien pregunta sobre nutrición, energía o pérdida de peso. Lleva una muestra de ${brand} o un antes/después de cliente.`,
      priority: 'Alta',
    })
  } else if (spaces.includes('escuela')) {
    tasks.push({
      title: 'Conectar con mamás en la escuela',
      description: 'Al llevar o recoger a tus hijos, observa quién puede beneficiarse del producto. Inicia una conversación natural.',
      priority: 'Alta',
    })
  } else if (spaces.includes('trabajo')) {
    tasks.push({
      title: 'Identificar prospectos en el trabajo',
      description: 'Hoy en la oficina o con compañeros, observa quién habla de salud o bienestar. No vendas — solo conecta.',
      priority: 'Alta',
    })
  } else if (spaces.includes('iglesia')) {
    tasks.push({
      title: 'Conectar en tu comunidad',
      description: 'Inicia conversaciones auténticas en tu comunidad. Pregunta cómo están, escucha sus necesidades antes de hablar del negocio.',
      priority: 'Alta',
    })
  } else {
    tasks.push({
      title: 'Identificar 3 prospectos calientes',
      description: 'Revisa tu lista de contactos y anota las 3 personas más propensas a interesarse en tu producto. Añádelas al CRM.',
      priority: 'Alta',
    })
  }

  // Task 2: Content / social media
  if (platforms.includes('Instagram')) {
    tasks.push({
      title: 'Publicar en Instagram hoy',
      description: 'Sube un tip de bienestar o una foto de tu rutina saludable. Sin mencionar el producto todavía — primero construye autoridad.',
      priority: 'Media',
    })
  } else if (platforms.includes('TikTok')) {
    tasks.push({
      title: 'Grabar video de 30 seg para TikTok',
      description: 'Muestra tu rutina de bienestar o reacciona a un tip de salud. El algoritmo premia la consistencia diaria.',
      priority: 'Media',
    })
  } else if (platforms.includes('WhatsApp')) {
    tasks.push({
      title: 'Actualizar estado de WhatsApp',
      description: 'Publica un mensaje de motivación o tip de salud en tu status. Que tus contactos te vean activo en el tema.',
      priority: 'Media',
    })
  } else if (platforms.includes('Facebook')) {
    tasks.push({
      title: 'Publicar tip de salud en Facebook',
      description: 'Comparte contenido de valor sobre bienestar. Construye tu imagen de referente antes de ofrecer el producto.',
      priority: 'Media',
    })
  } else {
    tasks.push({
      title: 'Elegir tu red social principal',
      description: `Decide en qué plataforma vas a publicar contenido de tu negocio ${brand ? `con ${brand}` : ''} y haz tu primera publicación hoy.`,
      priority: 'Media',
    })
  }

  // Task 3: First contacts
  const topic = psychoTraits.includes('salud') ? 'la salud'
    : psychoTraits.includes('bienestar') ? 'el bienestar'
    : psychoTraits.includes('disciplina') ? 'el bienestar y la disciplina'
    : 'un estilo de vida más saludable'

  tasks.push({
    title: 'Primeros 2 contactos del día',
    description: `Escríbele a 2 personas de tu red que sabes que valoran ${topic}. Solo saluda y pregunta cómo están — no ofrezcas nada todavía.`,
    priority: 'Alta',
  })

  return tasks
}
