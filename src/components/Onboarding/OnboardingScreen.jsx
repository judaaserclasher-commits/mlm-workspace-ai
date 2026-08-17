import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Check, ArrowRight, Zap } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import {
  analyzeRoutine, buildHypothesis, detectBrand, extractTicketAmount,
  detectFinanceMode, detectPlatforms, extractUserName, generateActionPlan,
} from '../../services/OnboardingEngine'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function md(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AriaAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-lg" style={{ background: 'var(--accent)' }}>
      SH
    </div>
  )
}

function SherixBubble({ content, tasks }) {
  return (
    <div className="flex gap-3 px-5 py-2">
      <AriaAvatar />
      <div className="flex-1 pt-1 space-y-3">
        {content && (
          <p
            className="text-sm text-[#d1d5db] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: md(content) }}
          />
        )}
        {tasks && (
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <div key={i} className="rounded-xl p-3.5 flex gap-3" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(37,99,235,0.3)' }}>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>{i + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#e5e7eb] leading-snug">{task.title}</p>
                  <p className="text-[11px] text-[#6b7280] mt-1 leading-relaxed">{task.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UserBubble({ content }) {
  return (
    <div className="flex justify-end px-5 py-2">
      <div className="rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[78%]" style={{ background: 'var(--accent)' }}>
        <p className="text-sm text-white leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 px-5 py-2">
      <AriaAvatar />
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 bg-[#6b7280] rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function ProgressSteps({ current, completed }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {[1, 2, 3, 4].map((step) => {
        const done = completed.includes(step)
        const active = current === step
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: done ? '#059669' : active ? 'var(--accent)' : 'var(--bg-tertiary)',
                border: done || active ? 'none' : '1px solid var(--border)',
                boxShadow: active ? '0 0 0 2px rgba(37,99,235,0.3)' : 'none',
              }}
            >
              {done
                ? <Check size={12} className="text-white" />
                : <span className="text-[10px] font-bold" style={{ color: active ? '#fff' : 'var(--text-muted)' }}>{step}</span>
              }
            </div>
            {step < 4 && (
              <div className="h-px w-5 transition-colors duration-300" style={{ background: done ? '#065F46' : 'var(--border)' }} />
            )}
          </div>
        )
      })}
      {current >= 1 && current <= 4 && (
        <span className="text-[10px] text-[#4b5563] ml-1.5 font-medium">Paso {current} de 4</span>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const setUserProfile = useWorkspaceStore((s) => s.setUserProfile)
  const addTasks = useWorkspaceStore((s) => s.addTasks)

  const [messages, setMessages] = useState([])
  const [phase, setPhase] = useState('init')
  const [isTyping, setIsTyping] = useState(false)
  const [chips, setChips] = useState(null)
  const [input, setInput] = useState('')
  const [profile, setProfile] = useState({
    name: '', brand: '', avgTicket: 0,
    spaces: [], socialGroups: [], psychoTraits: [], availability: [],
    platforms: [], followers: {}, financeMode: 'both',
  })
  const [completedSteps, setCompletedSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [showWorkspaceBtn, setShowWorkspaceBtn] = useState(false)
  const [isBusy, setIsBusy] = useState(true)
  const [pendingProfile, setPendingProfile] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const phaseRef = useRef('init')
  const profileRef = useRef(profile)
  const bootedRef = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { profileRef.current = profile }, [profile])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const addMsg = useCallback((role, content, extra = {}) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, content, ...extra }])
  }, [])

  const sherixType = useCallback(async (content, extra = {}, delay = null) => {
    setIsTyping(true)
    await sleep(delay !== null ? delay : Math.min(2000, 550 + content.length * 9))
    setIsTyping(false)
    addMsg('sherix', content, extra)
  }, [addMsg])

  // ─── Boot ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    setPhase('booting')
    ;(async () => {
      await sleep(400)
      await sherixType('¡Hola! Soy **Sherix**, tu consultora de negocio personal. 👋', {}, 900)
      await sherixType('Voy a personalizar tu workspace en menos de 2 minutos para que desde hoy esté 100% enfocado en **tu** negocio.', {}, 1200)
      await sherixType('Para empezar... ¿cuál es tu nombre?', {}, 700)
      setPhase('greeting')
      setIsBusy(false)
      inputRef.current?.focus()
    })()
  }, [])

  // ─── Input handler ─────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (isBusy || isTyping) return
    const text = input.trim()
    if (!text) return

    setInput('')
    setChips(null)
    setIsBusy(true)
    addMsg('user', text)

    const p = phaseRef.current
    const prof = profileRef.current

    try {
      if (p === 'greeting') await doGreeting(text, prof)
      else if (p === 'step1') await doStep1(text, prof)
      else if (p === 'step1-hyp') await doStep1Hyp(text, prof)
      else if (p === 'step1-correct') await doStep1Correct(text, prof)
      else if (p === 'step2') await doStep2(text, prof)
      else if (p === 'step2-ticket') await doStep2Ticket(text, prof)
      else if (p === 'step3') await doStep3(text, prof)
      else if (p === 'step4') await doStep4(text, prof)
    } finally {
      setIsBusy(false)
    }
  }, [isBusy, isTyping, input, addMsg])

  const handleChipClick = useCallback(async (chip) => {
    if (isBusy || isTyping) return
    setChips(null)
    setIsBusy(true)
    addMsg('user', chip)

    const prof = profileRef.current
    try {
      if (phaseRef.current === 'step1-hyp') await doStep1Hyp(chip, prof)
    } finally {
      setIsBusy(false)
    }
  }, [isBusy, isTyping, addMsg])

  // ─── Phase logic ───────────────────────────────────────────────────────────

  const updateProfile = (updates) => {
    setProfile(prev => {
      const next = { ...prev, ...updates }
      profileRef.current = next
      return next
    })
    return { ...profileRef.current, ...updates }
  }

  const doGreeting = async (text, prof) => {
    const raw = extractUserName(text) || text.trim().split(/\s+/)[0] || 'Amig@'
    const name = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
    const next = updateProfile({ name })

    await sherixType(`¡Mucho gusto, **${name}**! 🙌`, {}, 600)
    await sherixType(
      'Mi primera pregunta: **¿cómo es un día típico para ti?**\n\nCuéntame desde que te levantas — a dónde vas, qué haces, con quién convives. Cualquier detalle me ayuda.',
      {}, 1100
    )
    setCurrentStep(1)
    setPhase('step1')
    inputRef.current?.focus()
  }

  const doStep1 = async (text, prof) => {
    const analysis = analyzeRoutine(text)
    updateProfile(analysis)
    const fullProf = { ...prof, ...analysis }

    setIsTyping(true)
    await sleep(1700)
    setIsTyping(false)

    const hypothesis = buildHypothesis(analysis.spaces, analysis.socialGroups, analysis.psychoTraits)
    await sherixType(
      `Basándome en lo que describes, parece que ${hypothesis}.\n\n¿Eso refleja bien tu realidad?`,
      {}, 600
    )
    setChips(['✓ Sí, correcto', '↩ No, déjame corregirte'])
    setPhase('step1-hyp')
    inputRef.current?.focus()
  }

  const doStep1Hyp = async (text, prof) => {
    const n = text.toLowerCase()
    const confirmed = /s[ií]|correcto|yes|bien|exacto/.test(n) && !/no/.test(n)

    if (confirmed) {
      await sherixType('Perfecto, ya tengo claro tu perfil de prospección. 💡', {}, 600)
      setCompletedSteps(prev => [...prev, 1])
      await goToStep2()
    } else {
      await sherixType(
        '¡Sin problema! ¿Puedes contarme un poco más sobre los lugares donde pasas más tiempo y las personas con quien más convives?',
        {}, 900
      )
      setPhase('step1-correct')
      inputRef.current?.focus()
    }
  }

  const doStep1Correct = async (text, prof) => {
    const extra = analyzeRoutine(text)
    updateProfile({
      spaces: [...new Set([...(prof.spaces || []), ...extra.spaces])],
      socialGroups: [...new Set([...(prof.socialGroups || []), ...extra.socialGroups])],
      psychoTraits: [...new Set([...(prof.psychoTraits || []), ...extra.psychoTraits])],
    })
    await sherixType('Entendido. Guardé eso para personalizar tus sugerencias. 👌', {}, 700)
    setCompletedSteps(prev => [...prev, 1])
    await goToStep2()
  }

  const goToStep2 = async () => {
    setCurrentStep(2)
    await sherixType('Ahora sí, el negocio. **¿Con qué marca o empresa trabajas?**', {}, 800)
    setPhase('step2')
    inputRef.current?.focus()
  }

  const doStep2 = async (text, prof) => {
    const detected = detectBrand(text)
    const raw = detected || text.trim().split(/\s+/).slice(0, 3).join(' ')
    const brand = raw.charAt(0).toUpperCase() + raw.slice(1)
    updateProfile({ brand })

    const isFamous = !!detected
    if (isFamous) {
      await sherixType(`¡Excelente elección! Tengo integrado el catálogo de **${brand}**. 🌟`, {}, 700)
    } else {
      await sherixType(`Genial, trabajo con **${brand}**. Usaré eso como referencia para tus recomendaciones.`, {}, 700)
    }
    await sherixType('¿Cuánto gasta normalmente un cliente tuyo en una compra? Un número aproximado está perfecto.', {}, 800)
    setPhase('step2-ticket')
    inputRef.current?.focus()
  }

  const doStep2Ticket = async (text, prof) => {
    const amount = extractTicketAmount(text) || 0
    updateProfile({ avgTicket: amount })

    if (amount > 0) {
      await sherixType(`Ticket promedio de **$${amount.toLocaleString('es-MX')}**. Eso me ayuda a calibrar tus metas perfectamente.`, {}, 800)
    } else {
      await sherixType('Anotado. Puedes ajustar eso más adelante en la sección de Finanzas.', {}, 600)
    }

    setCompletedSteps(prev => [...prev, 2])
    setCurrentStep(3)
    await sherixType(
      'Una pregunta rápida sobre el dinero: **¿separas las finanzas del negocio de tus gastos personales, o todo va en la misma bolsa?**',
      {}, 1000
    )
    setPhase('step3')
    inputRef.current?.focus()
  }

  const doStep3 = async (text, prof) => {
    const mode = detectFinanceMode(text)
    updateProfile({ financeMode: mode })

    const n = text.toLowerCase()
    let reply
    // Check "no separo" / "todo junto" before "separo" to avoid false positives
    if (/no.*sep[ao]|todo junto|la misma bolsa|mezclad|sin control|revuelto/.test(n)) {
      reply = 'Entendido. Tu workspace tiene módulos separados para negocio y personal — en unas semanas notarás la diferencia en claridad financiera. 💰'
    } else if (/\bseparo\b|\bseparado[s]?\b|\bpor separado\b/.test(n)) {
      reply = '¡Perfecto orden financiero! 🎉 Tu workspace ya tiene módulos separados para negocio y personal, listos para usar.'
    } else if (/solo negocio|unicamente negocio/.test(n)) {
      reply = 'Perfecto, me enfoco en las finanzas del negocio. Tendrás tu módulo configurado para eso.'
    } else {
      reply = 'Entendido. Tu workspace tiene módulos separados para negocio y personal — en unas semanas notarás la diferencia en claridad financiera. 💰'
    }

    await sherixType(reply, {}, 800)
    setCompletedSteps(prev => [...prev, 3])
    setCurrentStep(4)
    await sherixType(
      'Último paso, te lo prometo. 😄 **¿En qué redes publicas contenido para tu negocio?** Instagram, TikTok, Facebook, WhatsApp... ¿Y con cuántos seguidores aproximadamente?',
      {}, 1100
    )
    setPhase('step4')
    inputRef.current?.focus()
  }

  const doStep4 = async (text, prof) => {
    const { platforms, followers } = detectPlatforms(text)
    const next = updateProfile({ platforms, followers })

    let reply
    if (platforms.length > 0) {
      reply = `Perfecto, tienes presencia en **${platforms.join(', ')}**. Tus sugerencias de contenido estarán adaptadas a esas plataformas. 📱`
    } else {
      reply = 'Sin problema — tu workspace tiene recomendaciones para construir tu presencia digital desde cero. ¡Es el mejor momento para empezar!'
    }

    await sherixType(reply, {}, 800)
    setCompletedSteps(prev => [...prev, 4])
    await runActionPlan(next)
  }

  const runActionPlan = async (finalProfile) => {
    setIsTyping(true)
    await sleep(2000)
    setIsTyping(false)

    const plan = generateActionPlan(finalProfile)

    const displayName = finalProfile.name || 'Campeón'
    await sherixType(
      `¡**${displayName}**, ya conozco tu negocio! Aquí están tus **3 acciones concretas para hoy:**`,
      {}, 700
    )
    await sleep(150)
    addMsg('sherix', '', { tasks: plan })
    await sleep(300)
    await sherixType(
      'Las agregué directamente a tu **kanban de tareas**. Ahora tienes todo listo para arrancar. 🚀',
      {}, 900
    )

    addTasks(plan)
    setPendingProfile({ ...finalProfile, onboardingComplete: true })
    await sleep(500)
    setShowWorkspaceBtn(true)
    setPhase('plan')
  }

  const handleSkip = () => {
    setUserProfile({ onboardingComplete: true, skipped: true, name: '' })
  }

  const handleEnterWorkspace = () => {
    if (pendingProfile) setUserProfile(pendingProfile)
  }

  const inputDisabled = isBusy || isTyping || showWorkspaceBtn

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div className="w-full max-w-2xl mb-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--accent)' }}>
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>MLM Workspace</span>
          <span className="text-[10px] font-medium rounded-full px-2 py-0.5" style={{ color: 'var(--accent)', background: 'var(--accent-glow)', border: '1px solid rgba(37,99,235,0.3)' }}>AI</span>
        </div>

        {showWorkspaceBtn ? (
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-900/30">
                <Check size={12} className="text-white" />
              </div>
            ))}
            <span className="text-[11px] text-emerald-400 ml-2 font-semibold">¡Configuración completa!</span>
          </div>
        ) : currentStep > 0 ? (
          <ProgressSteps current={currentStep} completed={completedSteps} />
        ) : null}
      </div>

      {/* Chat panel */}
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        style={{ height: '510px' }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
          {messages.map(msg => (
            msg.role === 'sherix'
              ? <SherixBubble key={msg.id} content={msg.content} tasks={msg.tasks} />
              : <UserBubble key={msg.id} content={msg.content} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Chips */}
        {chips && !showWorkspaceBtn && (
          <div className="px-5 py-3 border-t">
            <div className="flex gap-2 flex-wrap">
              {chips.map((chip, i) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={isBusy}
                  className={`text-xs px-4 py-2 rounded-xl border font-medium transition-all ${
                    i === 0
                      ? 'border-emerald-700/60 text-emerald-400 hover:bg-emerald-950/30 bg-emerald-950/10'
                      : 'border-neutral-700 text-neutral-400 hover:border-blue-600/50 hover:text-blue-400 hover:bg-blue-950/10'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Workspace button */}
        {showWorkspaceBtn && (
          <div className="px-5 py-4 border-t flex justify-center">
            <button
              onClick={handleEnterWorkspace}
              className="flex items-center gap-2.5 px-7 py-3 text-white font-bold text-sm rounded-xl transition-all group"
              style={{ background: 'var(--accent)', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}
            >
              Ver mi workspace
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Input */}
        {!showWorkspaceBtn && (
          <div className="px-5 py-3.5 border-t">
            <div className="flex gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                disabled={inputDisabled}
                placeholder={chips ? 'O escribe tu respuesta...' : 'Escribe tu respuesta...'}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors disabled:opacity-40"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-active)' }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)' }}
              />
              <button
                onClick={handleSend}
                disabled={inputDisabled || !input.trim()}
                className="w-10 h-10 rounded-xl disabled:opacity-30 flex items-center justify-center transition-all shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip */}
      {!showWorkspaceBtn && (
        <button
          onClick={handleSkip}
          className="mt-5 text-xs text-[#2a2a2a] hover:text-[#4b5563] transition-colors"
        >
          Saltar por ahora
        </button>
      )}
    </div>
  )
}
