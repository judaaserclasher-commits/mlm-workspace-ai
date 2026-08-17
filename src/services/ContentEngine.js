// Content generation engine — MLM social media copy for LATAM distributors

const DAYS_ES    = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const DAYS_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

// ─── Copy templates ────────────────────────────────────────────────────────────
const TEMPLATES = {
  Autoridad: [
    {
      title: '3 errores que cometen quienes quieren bajar de peso sin asesoría',
      copy: `🚫 3 errores que cometen quienes quieren bajar de peso sin asesoría:\n\n1️⃣ Hacer dietas extremas que el cuerpo no puede sostener\n2️⃣ Ignorar la hidratación como parte del proceso\n3️⃣ Esperar resultados sin un protocolo personalizado\n\nLa diferencia entre los que lo logran y los que no, es tener a alguien que los guíe con base en su cuerpo y estilo de vida.\n\n¿Cuál de estos errores reconoces en ti? 👇`,
    },
    {
      title: 'Lo que nadie te dice sobre los suplementos proteicos',
      copy: `💡 Lo que nadie te dice sobre los suplementos proteicos:\n\nNo todos los suplementos son iguales. La calidad de los ingredientes, la absorción y el proceso de fabricación hacen TODA la diferencia.\n\nAntes de comprar cualquier suplemento pregunta:\n✅ ¿Tiene certificación de calidad?\n✅ ¿Cuánta proteína real hay por porción?\n✅ ¿Tiene ingredientes innecesarios?\n\nLa nutrición bien guiada no es un gasto, es una inversión. 💪`,
    },
    {
      title: '¿Por qué el 80% de las dietas fallan? Esto cambió mi perspectiva',
      copy: `❓ ¿Por qué el 80% de las dietas fallan?\n\nDespués de acompañar a cientos de personas en su proceso, encontré el patrón:\n\n❌ Se enfocan en restricción, no en nutrición\n❌ No tienen apoyo ni seguimiento\n❌ Buscan soluciones rápidas para cambios de estilo de vida\n\nCuando entiendes que el cambio real viene de hábitos sostenibles, todo cambia. Eso es lo que yo hago: acompañarte con un plan que SÍ funciona. 🌱`,
    },
    {
      title: 'La verdad sobre el metabolismo lento que nadie te explica',
      copy: `🔥 La verdad sobre el "metabolismo lento":\n\nMuchas personas me dicen esto como excusa para no ver resultados. La realidad: el metabolismo responde a lo que comes y cómo te mueves. Se puede ACTIVAR.\n\nLo que sí funciona:\n✅ Comer en horarios regulares\n✅ Incluir proteína en cada comida\n✅ Dormir las horas necesarias\n✅ Hidratarte bien\n\n¿Cuál de estos hábitos necesitas reforzar hoy? 👇`,
    },
    {
      title: '5 señales de que tu cuerpo necesita más nutrición',
      copy: `⚠️ 5 señales de que tu cuerpo necesita más nutrición:\n\n1. Te cansas fácilmente con actividades normales\n2. Tienes antojos constantes de dulce\n3. Te cuesta concentrarte durante el día\n4. Tu piel está opaca o con imperfecciones frecuentes\n5. Te enferman con más frecuencia de lo normal\n\nTu cuerpo te habla todo el tiempo. ¿Lo estás escuchando? 🌿\n\nEscríbeme y te orientamos sin costo. 💌`,
    },
    {
      title: 'Mito vs. Realidad: ¿los suplementos engordan?',
      copy: `🧬 MITO vs. REALIDAD\n\n❌ MITO: "Los suplementos engordan"\n✅ REALIDAD: Los suplementos de calidad te ayudan a alcanzar tus metas de forma eficiente\n\nUn suplemento proteico bien formulado:\n→ No tiene grasa añadida\n→ Te ayuda a mantener músculo mientras bajas grasa\n→ Controla el hambre de forma natural\n\nEl problema no es el suplemento, es la desinformación. 💡\n\n¿Tienes dudas sobre cuál es el correcto para ti? ¡Escríbeme!`,
    },
    {
      title: '¿Sabías que la falta de proteína afecta tu estado de ánimo?',
      copy: `🧠 ¿Sabías que la falta de proteína puede afectar tu estado de ánimo?\n\nLa serotonina — hormona del bienestar — se produce a partir de aminoácidos que obtienes de la proteína.\n\nSi últimamente sientes:\n😔 Energía baja sin razón\n😤 Irritabilidad frecuente\n😴 Sueño excesivo durante el día\n\n...tu alimentación puede ser la causa.\n\n¿Cómo está tu nivel de energía esta semana? Cuéntame 👇`,
    },
    {
      title: 'Lo que aprendí después de acompañar a más de 100 personas',
      copy: `💎 Lo que aprendí después de acompañar a más de 100 personas en su transformación:\n\nEl cambio físico siempre es el último en llegar.\n\nPrimero cambia:\n1. La mentalidad 🧠\n2. Los hábitos diarios 📅\n3. El nivel de energía ⚡\n4. La confianza en uno mismo 💪\n5. Y finalmente... el físico 🌟\n\nQuien entiende esto, llega lejos. ¿En qué etapa del proceso estás tú? 👇`,
    },
    {
      title: 'Por qué la hidratación es más importante que la dieta',
      copy: `💧 Por qué la hidratación es más importante que la mayoría de las dietas:\n\nEl 60% de tu cuerpo es agua. Cuando no bebes suficiente:\n→ Tu metabolismo baja hasta un 3%\n→ Confundes sed con hambre y comes de más\n→ Tu cerebro funciona al 80% de su capacidad\n→ Tus músculos se recuperan más lento\n\nUn simple cambio: beber 2 litros de agua al día puede transformar tu energía en 1 semana.\n\n¿Cuánta agua bebes hoy? 👇`,
    },
    {
      title: 'La diferencia entre perder peso y perder grasa',
      copy: `⚖️ ¿Sabes la diferencia entre perder PESO y perder GRASA?\n\nPerder peso → número en la báscula baja (puede ser agua o músculo)\nPerder grasa → tu composición corporal mejora de verdad\n\nEl segundo es lo que realmente te cambia la vida:\n✅ Ropa que queda diferente\n✅ Más energía y fuerza\n✅ Resultado sostenible\n\nEs por eso que trabajo con protocolos de composición corporal, no solo con dietas. ¿Quieres saber más? 💌`,
    },
  ],

  Crecimiento: [
    {
      title: '¿Cuántas veces has intentado bajar de peso? Responde honestamente',
      copy: `🤔 ¿Cuántas veces has intentado bajar de peso?\n\nSé honesto/a en los comentarios 👇\n\nA) 1-2 veces\nB) 3-5 veces\nC) Más de 5 veces\nD) Perdí la cuenta 😅\n\nNo hay respuesta incorrecta. El hecho de que sigas intentándolo dice mucho de ti. 💪\n\nEtiqueta a alguien que necesita ver esto. 👆`,
    },
    {
      title: 'Esto que hago cada mañana cambió mi energía completamente',
      copy: `☀️ Esto que hago cada mañana cambió mi energía completamente:\n\n⏰ 6:00 AM — Vaso de agua al despertar\n🥤 6:15 AM — Mi batido de proteína\n🚶 6:30 AM — 20 minutos de caminata\n📖 7:00 AM — 10 minutos de lectura\n\n¿Parece simple? Lo es. Pero la constancia es lo que transforma.\n\nCuéntame tu rutina mañanera 👇`,
    },
    {
      title: 'Comparte si conoces a alguien que necesita escuchar esto',
      copy: `💌 Si conoces a alguien que:\n\n→ Lleva meses queriendo bajar de peso\n→ Ha probado de todo sin resultados duraderos\n→ Necesita apoyo real y personalizado\n\nETIQUÉTALA AQUÍ 👇\n\nA veces la persona que necesita ayuda no sabe que existe la solución. Sé esa persona que la conecta. ❤️`,
    },
    {
      title: 'El día que decidí tomar el control de mi salud',
      copy: `📅 El día que decidí tomar el control de mi salud, pensé: "¿Y si no funciona?"\n\nLa respuesta que me cambió todo: "¿Y si SÍ funciona?"\n\nEsa pregunta lo transformó todo. Decidí intentarlo.\nY aquí estoy, ayudando a otros a hacer lo mismo.\n\nA veces el único obstáculo somos nosotros mismos. 🪞\n\n¿Qué te está deteniendo hoy? Escríbeme al privado, sin compromiso. 💬`,
    },
    {
      title: 'POV: Llevas 3 semanas tomando tu nutrición en serio',
      copy: `🎥 POV: Llevas 3 semanas tomando tu nutrición en serio:\n\nSemana 1: "Esto se siente raro"\nSemana 2: "Ok, empiezo a sentirme diferente"\nSemana 3: "¿Por qué no empecé antes?"\n\nAsí es el proceso. No lineal, pero completamente transformador. 🌱\n\n¿En qué semana estás tú? Cuéntame 👇`,
    },
    {
      title: 'GUARDA ESTE POST para cuando necesites motivación',
      copy: `📌 GUARDA ESTE POST para cuando necesites motivación:\n\n"No estás empezando de cero.\nEstás empezando con experiencia."\n\nCada intento anterior fue una lección.\nCada recaída fue información.\nCada nuevo inicio es una oportunidad real.\n\nTú no eres tus intentos pasados. Eres lo que decides HOY. 💪\n\nComparte con alguien que necesita leer esto. ❤️`,
    },
    {
      title: 'Pregunta rápida para mi comunidad',
      copy: `🙋 Pregunta rápida para mi comunidad:\n\n¿Cuál es tu mayor reto con la alimentación?\n\n🍕 A) Los antojos nocturnos me ganan\n🏃 B) Falta de tiempo para comer bien\n💸 C) El costo de comer saludable\n😔 D) La motivación va y viene\n\nResponde en los comentarios. Voy a crear contenido específico para el reto que más me mencionen. 👇`,
    },
    {
      title: 'Esta semana alguien me preguntó si vale la pena invertir en salud',
      copy: `💰 Esta semana alguien me preguntó:\n"¿Vale la pena invertir en salud?"\n\nMi respuesta honesta:\n\nInviertes $X en ropa que quizás no uses.\nInviertes $X en salidas que olvidas al día siguiente.\nInviertes $X en cosas que no te generan resultados.\n\n¿Cuánto llevas SIN invertir en tu bienestar?\n\nEl cuerpo es lo único que no puedes cambiar ni reemplazar. 🏃‍♀️`,
    },
    {
      title: '3 cosas que desearía haber sabido antes de empezar',
      copy: `💡 3 cosas que desearía haber sabido antes de empezar mi proceso:\n\n1. Los resultados llegan en capas, no de golpe\n2. El apoyo de alguien que ya lo vivió es invaluable\n3. El "por qué" importa más que el "cómo"\n\nSi estás considerando empezar y no sabes cómo, yo estuve exactamente donde estás. Y hoy ayudo a otros a no cometer los mismos errores.\n\n¿Hablamos? 💬`,
    },
    {
      title: 'Repost si esto te resonó',
      copy: `🔁 Repost si esto te resonó:\n\n"La salud no es un destino al que llegas.\nEs un estilo de vida que construyes todos los días."\n\nNo es sobre ser perfecto/a.\nEs sobre ser constante.\n\nUn pequeño paso hoy vale más que un gran plan para mañana. 🌿\n\n¿Cuál es tu pequeño paso de hoy? Cuéntame 👇`,
    },
  ],

  Venta: [
    {
      title: 'Hoy tengo 3 lugares disponibles para asesoría personalizada gratuita',
      copy: `📣 Hoy tengo 3 lugares disponibles para asesoría personalizada GRATUITA.\n\nSi llevas tiempo buscando resultados reales con tu salud y nutrición, esto es para ti.\n\nEn 30 minutos te digo:\n✅ Qué está bloqueando tus resultados\n✅ Qué necesita específicamente tu cuerpo\n✅ Cómo comenzar hoy mismo\n\nEscríbeme "INFO" al privado y te doy los detalles. ⏰ Solo hoy.`,
    },
    {
      title: 'Resultado de mi clienta después de 30 días',
      copy: `🌟 Con permiso de mi clienta, comparto su resultado a 30 días:\n\n→ Bajó 4.5 kg de grasa corporal\n→ Su nivel de energía subió notablemente\n→ Durmió mejor desde la segunda semana\n→ Sus antojos de azúcar casi desaparecieron\n\nElla empezó exactamente donde estás tú: dudando si funcionaría.\n\nSi quieres saber qué hizo diferente, escríbeme "QUIERO SABER" 💌`,
    },
    {
      title: 'Si llevas meses buscando algo que funcione, esto es para ti',
      copy: `🎯 Si llevas meses buscando algo que funcione, esto es para ti.\n\nHe acompañado a personas que habían probado:\n❌ Dietas extremas\n❌ Pastillas sin respaldo científico\n❌ Rutinas imposibles de mantener\n\nLo que cambió fue tener un SISTEMA. Un protocolo real, personalizado, con seguimiento.\n\n¿Quieres saber más? Escríbeme "SISTEMA" y te explico sin compromiso. 💬`,
    },
    {
      title: '24 horas para aprovechar mi precio especial de esta semana',
      copy: `⏰ ÚLTIMAS 24 HORAS:\n\nEsta semana lancé mi kit de inicio con precio especial y se han ido rápido.\n\nLo que incluye:\n✅ Protocolo personalizado de 4 semanas\n✅ Productos de calidad comprobada\n✅ Seguimiento semanal directo conmigo\n✅ Acceso a mi grupo de apoyo\n\nEscríbeme "QUIERO" al privado antes de que se agoten los lugares. 🔥`,
    },
    {
      title: 'Una clienta me preguntó cuánto tiempo se tarda en ver resultados',
      copy: `⏱ "¿Cuánto tiempo se tarda en ver resultados?"\n\nMi respuesta honesta:\n\n📅 Semana 1-2: Sientes más energía\n📅 Semana 3-4: Tu ropa empieza a verse diferente\n📅 Mes 2: Las personas te empiezan a preguntar qué estás haciendo\n📅 Mes 3: Tú misma no reconoces la foto de antes\n\nLa pregunta no es cuánto tiempo tarda. La pregunta es: ¿cuánto tiempo más vas a esperar?\n\n¿Empezamos hoy? 💌`,
    },
    {
      title: 'Preguntas frecuentes que me llegan cada semana',
      copy: `❓ Preguntas frecuentes:\n\n"¿Los productos tienen efectos secundarios?"\n→ No, son naturales y respaldados por ciencia.\n\n"¿Tengo que hacer dieta muy estricta?"\n→ No. Aprenderás a comer bien sin sufrir.\n\n"¿Funciona aunque tenga metabolismo lento?"\n→ Sí. Para eso es el protocolo personalizado.\n\n"¿Cuánto cuesta?"\n→ Tengo opciones para todos los presupuestos.\n\n¿Tienes otra pregunta? Escríbela aquí 👇`,
    },
    {
      title: 'Tengo algo especial para quien esté lista para iniciar hoy',
      copy: `🎁 Tengo algo especial para quien esté lista para iniciar hoy.\n\nSi eres de las personas que:\n✔️ Llevan tiempo queriendo mejorar su salud\n✔️ Quieren resultados reales sin sacrificar todo\n✔️ Buscan apoyo de alguien que lo ha vivido\n\nEscríbeme "HOY" al privado.\n\nTengo un bono especial para las primeras personas que me contacten hoy. 🌟`,
    },
    {
      title: 'El antes y después más importante no es el físico',
      copy: `📸 El antes y después más importante no siempre es el físico.\n\nMis clientes también comparten:\n→ "Antes: ansiedad constante. Después: duermo como nunca"\n→ "Antes: sin energía para mis hijos. Después: los alcanzo en el parque"\n→ "Antes: vergüenza de mi cuerpo. Después: seguridad que no tenía en años"\n\nEso es lo que vendemos en realidad: calidad de vida.\n\n¿Qué cambio necesitas tú? Escríbeme. 💌`,
    },
    {
      title: 'Hoy cerramos el mes y quiero celebrar contigo',
      copy: `🎉 Hoy cerramos el mes y quiero celebrar algo contigo:\n\n[Número] personas empezaron su proceso de transformación este mes con mi acompañamiento.\n\nCada una llegó dudando. Cada una hoy está viendo resultados.\n\nSi estás lista para ser parte del próximo grupo, escríbeme AHORA. Empezamos la próxima semana con cupo limitado. ⏰\n\nLo que esperas, otro mes pasa. 🌟`,
    },
    {
      title: 'Por qué mi asesoría es diferente a todo lo que has probado',
      copy: `✨ Por qué mi asesoría es diferente a todo lo que has probado:\n\n❌ No te doy una dieta genérica que le doy a todos\n❌ No te dejo solo/a con un PDF\n❌ No desaparezco cuando tienes dudas\n\n✅ Protocolo 100% personalizado para tu cuerpo\n✅ Seguimiento semanal real\n✅ Comunidad de apoyo incluida\n✅ Estrategia de largo plazo\n\nEscríbeme "DIFERENTE" y te cuento cómo funciona. 💬`,
    },
  ],

  Interacción: [
    {
      title: '¿Cuál es tu mayor reto cuando intentas cuidar tu alimentación?',
      copy: `💬 Necesito tu opinión genuina:\n\n¿Cuál es tu mayor reto cuando intentas cuidar tu alimentación?\n\nA) 🍕 Los antojos me ganan\nB) ⏰ No tengo tiempo de preparar comida sana\nC) 💸 Comer saludable es caro\nD) 😔 Me falta constancia\nE) 😕 No sé por dónde empezar\n\nComéntame tu letra ⬇️ Me ayuda a entender cómo servirte mejor.`,
    },
    {
      title: 'Cuéntame: ¿qué te motivó a empezar a cuidarte?',
      copy: `✨ Cuéntame en los comentarios:\n\n¿Qué te motivó a empezar a cuidar tu salud?\n\nA veces es un evento especial\nA veces es una foto que no te gustó\nA veces es simplemente cansarte de cansarte\nA veces es el ejemplo de alguien cercano\n\nNo importa cuál fue el motivo. Lo importante es que llegaste. 🌱\n\nYo empecé porque... [comparte en los comentarios también 👇]`,
    },
    {
      title: 'Poll: ¿Prefieres resultados rápidos o cambios graduales sostenibles?',
      copy: `📊 ENCUESTA RÁPIDA:\n\n¿Qué prefieres en tu proceso de salud?\n\n⚡ A) Resultados rápidos aunque cueste más esfuerzo\n🌱 B) Cambios graduales sostenibles aunque tome más tiempo\n\nVota en los comentarios y cuéntame por qué. 👇\n\n(No hay respuesta incorrecta, solo quiero conocerte mejor)`,
    },
    {
      title: 'Gracias por estar aquí — esta semana fue especial',
      copy: `❤️ Esta semana conecté con personas increíbles en este espacio.\n\nGracias por leer, compartir, preguntar y confiar.\n\nConstruir esta comunidad es lo que más me motiva a seguir creando contenido de valor para todos.\n\nHoy solo quiero preguntarte una cosa: ¿cómo estás? 🌟\n\nDeja un emoji en los comentarios que describa tu semana 👇`,
    },
    {
      title: 'Si pudieras cambiar una cosa de tu rutina, ¿qué sería?',
      copy: `🤔 Una pregunta para reflexionar hoy:\n\nSi pudieras cambiar UNA SOLA COSA de tu rutina de salud o alimentación, ¿qué sería?\n\n¿Más agua? ¿Menos azúcar? ¿Dormir mejor? ¿Moverte más? ¿Tener apoyo?\n\nEscríbelo en los comentarios. A veces nombrarlo es el primer paso para lograrlo. 🌿\n\nY si quieres apoyo para empezar ese cambio, aquí estoy siempre. 💌`,
    },
    {
      title: 'Hoy quiero saber algo de ti',
      copy: `👋 Hoy quiero saber algo de ti:\n\n¿Cómo empezó tu semana?\n\n☀️ Con energía y motivación\n😴 Arrancando de a poco\n🔥 En modo productividad total\n😅 Sobreviviendo, pero aquí andamos\n\nDeja tu respuesta abajo y platiquemos. Me gusta conectar con mi comunidad más allá del contenido. 💬`,
    },
  ],
}

// ─── Hashtag banks ─────────────────────────────────────────────────────────────
const HASHTAGS = {
  Autoridad: [
    '#NutriciónReal','#SaludConBase','#TipsDeNutrición','#EducaciónNutricional',
    '#SaludableEnEspañol','#HábitosSaludables','#NutriciónPersonalizada',
    '#SaludYBienestar','#VidaSana','#CienciaDeNutrición',
  ],
  Crecimiento: [
    '#TransformaciónReal','#MotivacionDiaria','#CambioDeHábitos','#ComunidadSaludable',
    '#JuntosSomosMás','#VidaSana','#InspiraciónDiaria','#TúPuedes',
    '#CrecimientoPersonal','#HábitosSaludables',
  ],
  Venta: [
    '#NutriciónDeCalidad','#ResultadosReales','#TransformaciónReal','#AsesoríaNutricional',
    '#SaludYBienestar','#PérdidaDePeso','#MejoraMiVida','#CambiaConNutrición',
    '#SaludConResultados','#IniciaTuCambio',
  ],
  Interacción: [
    '#ComunidadSaludable','#PreguntaDelDía','#TuOpiniónImporta','#JuntosSomosMás',
    '#ReflexiónDelDía','#SaludYBienestar','#ConectandoContigo','#VidaSana',
    '#ComunidadLatam','#BienestarReal',
  ],
}

// ─── Formats per platform ──────────────────────────────────────────────────────
const PLATFORM_FORMATS = {
  Instagram: ['Reel','Carrusel','Post','Historia'],
  TikTok:    ['Reel','Video'],
  Facebook:  ['Post','Video','Historia'],
  WhatsApp:  ['Mensaje','Historia'],
}

// ─── Weekly schedules by follower tier ────────────────────────────────────────
// Index 0 = Monday, 6 = Sunday
const WEEKLY_SCHEDULES = {
  low:    ['Crecimiento','Autoridad','Crecimiento','Venta','Crecimiento','Venta','Interacción'],
  medium: ['Autoridad','Crecimiento','Venta','Autoridad','Venta','Crecimiento','Interacción'],
  high:   ['Autoridad','Venta','Autoridad','Venta','Autoridad','Crecimiento','Interacción'],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

function getFollowerTier(profile) {
  const f = typeof profile?.followers === 'number' ? profile.followers : 500
  if (f < 1000) return 'low'
  if (f <= 5000) return 'medium'
  return 'high'
}

function getPlatforms(profile) {
  if (Array.isArray(profile?.platforms) && profile.platforms.length > 0) return profile.platforms
  return ['Instagram', 'Facebook']
}

function getWeekDates(reference = new Date()) {
  const day = reference.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(reference)
  monday.setDate(reference.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function generateDayContent(dateStr, profile, avoidObjective = null) {
  const date     = new Date(dateStr + 'T12:00:00')
  const jsDay    = date.getDay()                           // 0=Sun … 6=Sat
  const weekIdx  = jsDay === 0 ? 6 : jsDay - 1            // Mon=0 … Sun=6
  const tier     = getFollowerTier(profile)
  const schedule = WEEKLY_SCHEDULES[tier]
  let objective  = schedule[weekIdx]

  if (avoidObjective && objective === avoidObjective) {
    const others = ['Autoridad','Crecimiento','Venta','Interacción'].filter(o => o !== avoidObjective)
    objective = pick(others)
  }

  const platforms = getPlatforms(profile)
  const platform  = platforms[weekIdx % platforms.length]
  const format    = pick(PLATFORM_FORMATS[platform] || ['Post'])
  const template  = pick(TEMPLATES[objective])
  const hashtags  = shuffle(HASHTAGS[objective]).slice(0, 7)

  return {
    id:          `content-${dateStr}-${Date.now()}`,
    date:        dateStr,
    dayOfWeek:   DAYS_ES[jsDay],
    dayShort:    DAYS_SHORT[jsDay],
    platform,
    format,
    objective,
    title:       template.title,
    copy:        template.copy,
    hashtags,
    published:   false,
    publishedAt: null,
  }
}

export function generateWeekContent(profile) {
  const weekDates = getWeekDates()
  return weekDates.map((dateStr, weekIdx) => {
    const date     = new Date(dateStr + 'T12:00:00')
    const jsDay    = date.getDay()
    const tier     = getFollowerTier(profile)
    const objective = WEEKLY_SCHEDULES[tier][weekIdx]
    const platforms = getPlatforms(profile)
    const platform  = platforms[weekIdx % platforms.length]
    const format    = pick(PLATFORM_FORMATS[platform] || ['Post'])
    const template  = pick(TEMPLATES[objective])
    const hashtags  = shuffle(HASHTAGS[objective]).slice(0, 7)

    return {
      id:          `content-${dateStr}-${weekIdx}`,
      date:        dateStr,
      dayOfWeek:   DAYS_ES[jsDay],
      dayShort:    DAYS_SHORT[jsDay],
      platform,
      format,
      objective,
      title:       template.title,
      copy:        template.copy,
      hashtags,
      published:   false,
      publishedAt: null,
    }
  })
}

export function generateProspectMessage() {
  return pick([
    `Hola [nombre] 👋 ¡Vi tu perfil y creo que lo que hago podría interesarte! ¿Tienes 5 minutos esta semana para que te cuente? Sin compromiso 😊`,
    `Hola [nombre], te escribo porque llevo meses ayudando a personas a lograr [resultado]. Vi que podrías encajar perfecto. ¿Te cuento cómo? 💙`,
    `Hola [nombre]! Me pasaron tu contacto porque buscas [resultado]. Yo trabajo exactamente eso. ¿Hablamos rápido esta semana? 🌟`,
  ])
}
