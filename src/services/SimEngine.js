function normalize(text) {
  return text
    .replace(/[áàäâ]/gi, 'a').replace(/[éèëê]/gi, 'e')
    .replace(/[íìïî]/gi, 'i').replace(/[óòöô]/gi, 'o')
    .replace(/[úùüû]/gi, 'u').replace(/ñ/gi, 'n')
    .toLowerCase()
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const BRANDS = [
  { id: 'herbalife', name: 'Herbalife', colorClass: 'text-amber-400', bgClass: 'bg-amber-900/30 border-amber-700/40' },
  { id: 'omnilife',  name: 'Omnilife',  colorClass: 'text-violet-400', bgClass: 'bg-violet-900/30 border-violet-700/40' },
  { id: 'usana',     name: 'USANA',     colorClass: 'text-blue-400',   bgClass: 'bg-blue-900/30 border-blue-700/40' },
  { id: 'amway',     name: 'Amway',     colorClass: 'text-emerald-400', bgClass: 'bg-emerald-900/30 border-emerald-700/40' },
]

export const PROFILES = [
  {
    id: 'price',
    emoji: '💰',
    name: 'Escéptico de precio',
    subtitle: '"Es muy caro, lo consigo más barato"',
    difficulty: 'Media',
    difficultyColor: 'text-amber-400 bg-amber-900/20 border-amber-700/30',
    clientNames: ['Roberto', 'Carlos', 'Andrés', 'Miguel', 'Gustavo'],
    keywords: [
      'calidad', 'inversion', 'garantia', 'resultado', 'testimonio', 'ingrediente',
      'ahorra', 'valor', 'diferencia', 'devolucion', 'prueba', 'clinico', 'certificado',
      'premium', 'largo plazo', 'vale la pena',
    ],
    openings: [
      'Hola, me comentaron que vendes suplementos. ¿Cuánto cuestan? Porque en línea hay proteínas bastante más baratas.',
      'Suena interesante lo que vendes, pero seguro es caro. ¿Cuánto sale exactamente? Porque en el súper hay opciones más económicas.',
    ],
    turns: [
      {
        stageName: 'Comparación con alternativas más baratas',
        good: [
          'Nunca lo había pensado así... lo del valor versus el precio tiene algo de lógica. Pero ¿cómo sé que funciona mejor que lo de la farmacia?',
          'Okay, lo del costo a largo plazo tiene sentido. Pero ¿qué diferencia real hay con una proteína genérica?',
        ],
        weak: [
          'Sí, todos dicen eso. Pero en Amazon hay marcas con buenas reseñas que cuestan la mitad.',
          'Eso es lo que dice todo el que vende algo. El precio sigue siendo muy alto para mí.',
        ],
      },
      {
        stageName: 'Duda sobre efectividad y garantía',
        good: [
          'Okay, si hay garantía de devolución eso me tranquiliza. ¿Y cuánto tiempo tarda en verse el resultado?',
          'Lo de los ingredientes certificados sí importa. ¿Tienes testimonios de personas con resultados concretos?',
        ],
        weak: [
          'No sé si creer en esos testimonios, se pueden inventar fácilmente.',
          '¿Y si soy de las personas a las que simplemente no les funciona? ¿Tiro mi dinero?',
        ],
      },
      {
        stageName: 'Resistencia final antes del cierre',
        good: [
          'Mira, me convenciste. ¿Cómo hago el pedido? ¿Aceptas transferencia?',
          'Okay, ¿tienes algún kit de inicio para probar sin tanto compromiso económico?',
        ],
        weak: [
          'Déjame pensarlo... te digo en unos días cuando tenga más presupuesto.',
          'Ahorita no tengo el dinero. Quizás el próximo mes.',
        ],
      },
    ],
    closingMessage: '¿Sabes qué? Me convenciste. ¿Cómo hago el pedido y cuándo me llegaría?',
    recommendations: [
      '💡 Practica el comparativo de valor: "¿Cuánto gastas en café o comida chatarra al mes? Más que este suplemento." Los números concretos hacen que el precio parezca razonable.',
      '🛡️ Menciona la garantía de devolución desde el primer momento. Elimina el riesgo percibido y facilita enormemente la decisión de compra.',
      '📣 Usa testimonios específicos: "Mi clienta Rosa bajó 6 kg en 6 semanas" es mucho más convincente que hablar de calidad de forma genérica.',
    ],
  },

  {
    id: 'tried',
    emoji: '😒',
    name: 'Ya probó otra marca',
    subtitle: '"Intenté algo similar y no me funcionó"',
    difficulty: 'Alta',
    difficultyColor: 'text-red-400 bg-red-900/20 border-red-700/30',
    clientNames: ['Sandra', 'Patricia', 'Lucía', 'Fernanda', 'María'],
    keywords: [
      'diferente', 'diferencia', 'superior', 'ingrediente', 'certificado', 'clinico',
      'garantia', 'devolucion', 'resultado', 'testimonio', 'marca', 'formula',
      'calidad', 'comprobado', 'cientifico', 'estudio',
    ],
    openings: [
      'Mira, ya probé algo parecido hace unos meses y honestamente no vi nada de diferencia. ¿Por qué el tuyo sería distinto?',
      'Una amiga me vendió suplementos de otra marca antes y tiré el dinero. ¿Por qué debería intentarlo de nuevo?',
    ],
    turns: [
      {
        stageName: 'Desconfianza por experiencia negativa previa',
        good: [
          '¿En qué es diferente exactamente? ¿Los ingredientes, la dosis? Porque eso es lo que me dicen todos los vendedores.',
          'Okay, si dices que la fórmula es distinta... ¿tienes algo que lo respalde? ¿Algún estudio o certificación?',
        ],
        weak: [
          'Eso suena exactamente igual a lo que me dijeron la otra vez antes de comprar.',
          'Todos dicen que su producto es "el mejor" y "diferente". No sé si creerte honestamente.',
        ],
      },
      {
        stageName: 'Demanda de pruebas concretas',
        good: [
          '¿Tienes algún testimonio de alguien con mi mismo objetivo? ¿Y si no funciona hay garantía de devolución?',
          'Okay, los estudios clínicos importan. ¿Hay alguna garantía si en 30 días no veo diferencia?',
        ],
        weak: [
          'No sé... ya gasté dinero antes y no quiero repetir eso. Los testimonios se pueden inventar.',
          'Mi amiga también tenía fotos y testimonios. Al final no funcionó. No confío mucho en eso.',
        ],
      },
      {
        stageName: 'Apertura condicionada a garantía real',
        good: [
          'Okay, si hay garantía de devolución y tienes casos reales verificables, estoy dispuesta a darle una oportunidad.',
          'Me convences un poco. ¿Podría contactar directamente a alguno de tus clientes para hablar con ellos?',
        ],
        weak: [
          'No sé... prefiero esperar más reseñas antes de decidirme. No quiero arriesgarme otra vez.',
          'Déjame pensarlo. La verdad es que me da miedo volver a tirar dinero.',
        ],
      },
    ],
    closingMessage: 'Mira, si de verdad hay garantía de devolución y tienes casos reales... me arriesgo. ¿Cómo empezamos?',
    recommendations: [
      '🔬 Pregunta siempre qué marca usó antes. Conocer al competidor te permite explicar diferencias específicas con fundamento real, no solo con opinión.',
      '🛡️ La garantía de devolución es tu mejor herramienta con este perfil. Úsala desde el inicio: "Si en 30 días no ves diferencia, te devuelvo tu dinero sin preguntas."',
      '👥 Ofrece conectarlos directamente con un cliente que haya tenido resultados similares. La prueba social directa supera cualquier argumento de venta.',
    ],
  },

  {
    id: 'notime',
    emoji: '⏰',
    name: 'Sin tiempo',
    subtitle: '"Estoy muy ocupado, no tengo tiempo"',
    difficulty: 'Baja',
    difficultyColor: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30',
    clientNames: ['Elena', 'Camila', 'Valeria', 'Sofía', 'Rebeca'],
    keywords: [
      'facil', 'rapido', 'segundo', 'minuto', 'conveniente', 'rutina', 'simple',
      'comodo', 'practica', 'automatico', 'habito', 'mezcla', 'batido',
      'sencillo', 'integra', 'mañana', 'cafe', 'agua',
    ],
    openings: [
      'Suena interesante, pero la verdad es que estoy muy ocupada. No tengo tiempo para empezar una rutina nueva con suplementos.',
      'No sé, el problema es que soy muy caótica con mis rutinas. Olvido hasta tomar medicamentos recetados. ¿Cómo voy a acordarme de eso?',
    ],
    turns: [
      {
        stageName: 'Resistencia a añadir algo nuevo a la rutina',
        good: [
          '¿O sea que no tarda nada? ¿Y exactamente cuándo se supone que lo tomo para que lo recuerde?',
          'Si de verdad es tan rápido... ¿y se puede mezclar con algo que ya tomo en las mañanas?',
        ],
        weak: [
          'No, es que ni siquiera recuerdo tomar el medicamento que me recetó el doctor. Menos voy a acordarme de eso.',
          'Igual lo olvidaré. Soy muy mala con la constancia para este tipo de cosas.',
        ],
      },
      {
        stageName: 'Duda sobre la facilidad de uso diaria',
        good: [
          'Okay, si de verdad son solo 30 segundos... ¿y lo puedo mezclar en el café o en algo que ya tomo?',
          '¿Solo eso? Eso sí lo puedo hacer. ¿Y cuánto tiempo para ver resultados siendo constante?',
        ],
        weak: [
          'Igual lo olvidaré. No soy constante. Empiezo algo y a la semana lo abandono.',
          'No, ahorita no es buen momento. Tengo demasiadas cosas encima en el trabajo.',
        ],
      },
      {
        stageName: 'Último obstáculo antes de comprometerse',
        good: [
          'Mira, si de verdad es así de fácil, podría intentarlo. ¿Cuánto sale para probarlo un mes?',
          'Okay, si se integra tan fácil a mi rutina actual... ¿cómo funciona el pedido?',
        ],
        weak: [
          'No, mejor en enero cuando tenga menos cosas en el trabajo. Ahorita no puedo.',
          'Lo pienso. Pero la verdad ahorita tengo mil cosas. No es el momento.',
        ],
      },
    ],
    closingMessage: 'Okay, si son solo 30 segundos en las mañanas... lo intento. ¿Cuánto cuesta el primer mes?',
    recommendations: [
      '⏱️ Cuantifica el tiempo exacto: "Son literalmente 30 segundos: mezclas, agitas y listo." Los números concretos eliminan la excusa del tiempo mejor que cualquier argumento.',
      '🔗 Ancla el producto a algo que ya hace: "¿Tomas café en las mañanas? Mezclas esto mientras esperas que esté listo." Crea el hábito sobre un hábito existente.',
      '📦 Sugiere empezar con el kit más pequeño. Reducir el compromiso inicial baja la barrera de entrada para personas con poco tiempo y atención dividida.',
    ],
  },

  {
    id: 'indecisive',
    emoji: '🤔',
    name: 'Indeciso crónico',
    subtitle: '"Déjame pensarlo... te aviso después"',
    difficulty: 'Alta',
    difficultyColor: 'text-red-400 bg-red-900/20 border-red-700/30',
    clientNames: ['Tomás', 'Alejandro', 'Rodrigo', 'Fernando', 'Sebastián'],
    keywords: [
      'oferta', 'especial', 'hoy', 'garantia', 'preocupa', 'detiene', 'freno',
      'prueba', 'resultado', 'beneficio', 'funciona', 'limite', 'exclusivo',
      'riesgo', 'pierde', 'ventaja', 'que te', 'que te pasa',
    ],
    openings: [
      'Sí, puede ser interesante... déjame pensarlo un poco y te digo. No quiero decidir así de rápido.',
      'Mmm, suena bien lo que dices. Pero necesito meditarlo. Te mando un mensaje después.',
    ],
    turns: [
      {
        stageName: 'Posposición indefinida inicial',
        good: [
          '¿Hay alguna oferta o algo especial si decido hoy? ¿O el precio sigue igual después?',
          'Bueno... ¿cuál sería el beneficio concreto de decidir ahora y no esperar?',
        ],
        weak: [
          'Okay, cuando lo piense te escribo. No te preocupes.',
          'Sí, sí, ya te digo. Solo que ahorita no tengo la cabeza para decidir esto.',
        ],
      },
      {
        stageName: 'Descubrimiento del freno real',
        good: [
          'La verdad es que me preocupa si realmente va a funcionar para alguien como yo. No quiero arrepentirme.',
          'Lo que me detiene es que no sé si tengo el presupuesto. ¿Hay algún plan de pago o algo?',
        ],
        weak: [
          'No, de verdad te aviso. No es buen momento ahora. Mucho trabajo.',
          'Mejor lo hablo con mi esposa primero. Cualquier cosa te escribo.',
        ],
      },
      {
        stageName: 'Punto de quiebre para la decisión',
        good: [
          'Okay, ¿pero si no me gusta en el primer mes qué pasa? ¿Puedo cancelar o devolver?',
          'Si hay garantía y oferta especial esta semana... me convences. Cuéntame más.',
        ],
        weak: [
          'Mejor lo hablo con mi pareja primero y te confirmo. Gracias.',
          'Mira, ahorita no puedo decidir. Dame un par de semanas y te escribo.',
        ],
      },
    ],
    closingMessage: 'Bien, si hay oferta esta semana y garantía de devolución... me animo. ¿Cómo empezamos?',
    recommendations: [
      '❓ Haz preguntas abiertas para descubrir el freno real: "¿Qué es específicamente lo que te detiene?" La indecisión casi siempre esconde un miedo concreto que sí puedes resolver.',
      '⚡ Crea urgencia real, no falsa: "El precio especial de lanzamiento termina el viernes" es creíble. "Stock limitado" suena a truco y destruye la confianza.',
      '🛡️ La garantía de devolución es determinante para este perfil. Elimina el riesgo percibido y convierte una decisión difícil en una prueba sin nada que perder.',
    ],
  },

  {
    id: 'family',
    emoji: '👥',
    name: 'Familiar en otra MLM',
    subtitle: '"Mi cuñada vende algo parecido"',
    difficulty: 'Media',
    difficultyColor: 'text-amber-400 bg-amber-900/20 border-amber-700/30',
    clientNames: ['Natalia', 'Paola', 'Claudia', 'Diana', 'Vanessa'],
    keywords: [
      'diferencia', 'mejor', 'resultado', 'directo', 'precio', 'personal',
      'confia', 'calidad', 'acompanamiento', 'servicio', 'exclusivo', 'ventaja',
      'testimonio', 'comprobado', 'superior', 'atencion',
    ],
    openings: [
      'Mi cuñada vende algo muy parecido. ¿Por qué le compraría a ti y no apoyarla a ella directamente?',
      'Ya conozco a alguien de la familia que vende suplementos de otra empresa. ¿En qué eres diferente?',
    ],
    turns: [
      {
        stageName: 'Lealtad familiar vs. propuesta de valor',
        good: [
          'Okay, ¿en qué específicamente es mejor el tuyo? Porque el de mi cuñada tampoco está nada mal la verdad.',
          'Tienes razón en que son productos diferentes. ¿Cuál es la ventaja principal que tendría al comprarte a ti?',
        ],
        weak: [
          'Igual prefiero apoyar a la familia. Me sentiría incómoda comprándole a alguien de afuera.',
          'No sé... sería raro comprarle a otra persona cuando tengo a alguien de confianza que vende algo parecido.',
        ],
      },
      {
        stageName: 'Comparación de productos y acompañamiento',
        good: [
          '¿Y el servicio después de la venta? ¿Me darías seguimiento personalizado o me quedo sola con el producto?',
          '¿Tienes testimonios de personas que hayan cambiado de esa marca a la tuya y hayan notado diferencia real?',
        ],
        weak: [
          'No sé, igual es complicado comprarle a alguien que no conozco bien cuando tengo la opción familiar.',
          'El acompañamiento de mi cuñada también es bueno. Ya la conozco y confío en ella hace años.',
        ],
      },
      {
        stageName: 'Apertura a comparar directamente',
        good: [
          'Mira, si tienes testimonios con resultados comprobados... me interesa conocer más antes de decidir.',
          'Okay, cuéntame más del producto. Si los resultados son realmente mejores, lo pienso en serio.',
        ],
        weak: [
          'Voy a hablar con mi cuñada primero para ver qué dice ella. Después te comento.',
          'No, creo que prefiero quedarme con mi cuñada. Es familia y la apoyo.',
        ],
      },
    ],
    closingMessage: 'Sabes qué, me convenciste de que son productos diferentes. Dime cómo funciona el pedido contigo.',
    recommendations: [
      '🤝 Nunca hables mal del producto de la competencia, ni aunque sea de un familiar. Di: "Ese también es bueno. Lo que hace diferente al mío es X." Respeto + diferenciación.',
      '🎯 Enfócate en el servicio y acompañamiento personalizado. Puedes superar la lealtad familiar si demuestras un nivel de atención que la competencia no puede dar.',
      '📊 Pregunta si ya probó el producto de su familiar. Si lo usa y le funciona, acepta el "no" con gracia. Si no lo ha probado aún, tienes una apertura real que explorar.',
    ],
  },

  {
    id: 'mlm',
    emoji: '💼',
    name: 'Escéptico del modelo MLM',
    subtitle: '"Eso es una pirámide"',
    difficulty: 'Muy alta',
    difficultyColor: 'text-red-400 bg-red-900/20 border-red-700/30',
    clientNames: ['Eduardo', 'Pablo', 'Luis', 'Jorge', 'Antonio'],
    keywords: [
      'empresa', 'legitima', 'legal', 'producto', 'real', 'consumidor', 'regulada',
      'registro', 'anos', 'historia', 'certificado', 'mercado', 'distribuidor',
      'compania', 'reputacion', 'piramide', 'diferencia', 'ventas directas',
    ],
    openings: [
      'Espera... ¿eso no es una pirámide? He escuchado muchas historias malas de ese tipo de negocios. Gente que pierde dinero.',
      '¿MLM? No sé... ese esquema me suena a que solo gana el que está arriba. ¿No es eso cuasi ilegal?',
    ],
    turns: [
      {
        stageName: 'Confusión entre MLM y esquema piramidal ilegal',
        good: [
          '¿O sea que no es una pirámide? ¿Qué diferencia hay exactamente? No lo tengo del todo claro.',
          'Okay, si la empresa lleva décadas en el mercado y está regulada... ¿cuánto tiempo lleva operando?',
        ],
        weak: [
          'Eso es lo que dicen todos los que están en esos sistemas. Al final siempre hay alguien que pierde.',
          'No sé... conozco personas que se metieron y lo único que hicieron fue molestar a su familia para vender.',
        ],
      },
      {
        stageName: 'Desconfianza profunda en el modelo',
        good: [
          'Okay, si hay un producto real que la gente compra sin obligación de vender... ¿por qué se distribuye así y no en tiendas normales?',
          'Si la empresa está registrada, ¿puedo verificarlo yo mismo? ¿Tienen página oficial con información pública?',
        ],
        weak: [
          'Conozco personas que perdieron dinero metiéndose en esas cosas. No me parece confiable el modelo.',
          'No, ese tipo de negocios no me convence para nada. Gracias pero no es para mí.',
        ],
      },
      {
        stageName: 'Apertura al producto como consumidor',
        good: [
          'Bueno, aunque el negocio no me interesa, cuéntame del producto. ¿Para qué sirve? ¿Puedo comprarlo solo como consumidor?',
          'Okay, el modelo de negocio no es lo mío. Pero el producto en sí, ¿qué resultados da con personas reales?',
        ],
        weak: [
          'No, no me interesa nada relacionado con ese modelo. Gracias de todos modos.',
          'Mira, aprecio que lo expliques pero no es algo en lo que yo confíe. No es personal.',
        ],
      },
    ],
    closingMessage: 'Okay, quizás me interese solo como consumidor del producto. ¿Se puede comprar sin meterme en la parte del negocio?',
    recommendations: [
      '📚 Aprende la diferencia legal clave y explícala con claridad: pirámide ilegal = ingresos solo de reclutamiento, sin producto real. MLM legítimo = ingresos de ventas de producto con demanda real.',
      '🏢 Ten datos concretos de la empresa listos: año de fundación, países donde opera, regulaciones que cumple. Los hechos verificables derrumban el escepticismo mejor que cualquier argumento emocional.',
      '👤 Para este perfil, redirige hacia "solo consumidor". Es mucho más fácil convertirlos primero en clientes satisfechos que en distribuidores. El producto convence donde el modelo de negocio no puede.',
    ],
  },
]

export function evaluateResponse(profileId, text) {
  const profile = PROFILES.find(p => p.id === profileId)
  if (!profile) return 'weak'
  if (text.trim().length < 20) return 'weak'

  const n = normalize(text)
  const matched = profile.keywords.filter(kw => n.includes(kw))
  const hasEmpathy = /entiendo|comprendo|te entiendo|es normal|claro|te escucho|me imagino|entendible/.test(n)
  const hasQuestion = text.includes('?')
  const hasSocialProof = /cliente|testimonio|resultado|ejemplo|caso|persona|experiencia/.test(n)

  if (matched.length >= 2) return 'good'
  if (matched.length >= 1 && (hasEmpathy || hasQuestion || hasSocialProof)) return 'good'
  if (matched.length >= 1) return 'moderate'
  return 'weak'
}

export function getSimInit(profileId) {
  const profile = PROFILES.find(p => p.id === profileId)
  if (!profile) return null
  return {
    clientName: pick(profile.clientNames),
    openingMessage: pick(profile.openings),
  }
}

export function getClientResponse(profileId, clientStage, evaluation) {
  const profile = PROFILES.find(p => p.id === profileId)
  if (!profile) return { message: '...', isClosing: false }

  if (clientStage >= profile.turns.length) {
    return { message: profile.closingMessage, isClosing: true }
  }

  const turn = profile.turns[clientStage]
  const pool = (evaluation === 'good' || evaluation === 'moderate') ? turn.good : turn.weak
  return { message: pick(pool), isClosing: false }
}

export function generateFeedback(profileId, sessionLog) {
  const profile = PROFILES.find(p => p.id === profileId)
  if (!profile || sessionLog.length === 0) return null

  const points = sessionLog.reduce((sum, t) => {
    if (t.evaluation === 'good') return sum + 1
    if (t.evaluation === 'moderate') return sum + 0.6
    return sum
  }, 0)
  const score = Math.round((points / sessionLog.length) * 10)

  const turnDetails = sessionLog.map(t => ({
    stageName: t.clientStage < profile.turns.length
      ? profile.turns[t.clientStage].stageName
      : 'Señal de cierre',
    evaluation: t.evaluation,
    text: t.text,
  }))

  return {
    score,
    goodCount: sessionLog.filter(t => t.evaluation === 'good').length,
    moderateCount: sessionLog.filter(t => t.evaluation === 'moderate').length,
    weakCount: sessionLog.filter(t => t.evaluation === 'weak').length,
    total: sessionLog.length,
    turnDetails,
    recommendations: profile.recommendations,
  }
}
