import { db } from './firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const userDoc = (uid, ...segments) => doc(db, 'users', uid, ...segments)

// ── Profile ───────────────────────────────────────────────────────────────────

export async function saveProfile(uid, profile) {
  await setDoc(userDoc(uid, 'profile', 'data'), profile)
}

export async function loadProfile(uid) {
  const snap = await getDoc(userDoc(uid, 'profile', 'data'))
  return snap.exists() ? snap.data() : null
}

// ── Generic list (items array) ────────────────────────────────────────────────

export async function saveList(uid, collName, items) {
  await setDoc(userDoc(uid, collName, 'data'), { items })
}

export async function loadList(uid, collName) {
  const snap = await getDoc(userDoc(uid, collName, 'data'))
  return snap.exists() ? (snap.data().items ?? []) : null
}

// ── Transactions (sales + expenses together) ──────────────────────────────────

export async function saveTransactions(uid, sales, expenses) {
  await setDoc(userDoc(uid, 'transactions', 'data'), { sales, expenses })
}

export async function loadTransactions(uid) {
  const snap = await getDoc(userDoc(uid, 'transactions', 'data'))
  if (!snap.exists()) return null
  return { sales: snap.data().sales ?? [], expenses: snap.data().expenses ?? [] }
}

// ── Chat history (max 100 messages stored as flat array) ──────────────────────

export async function saveChatHistory(uid, messages) {
  const serializable = messages.map(m => ({
    id:        m.id,
    role:      m.role,
    content:   m.content,
    timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : (m.timestamp ?? new Date().toISOString()),
    actions:   m.actions ?? [],
  }))
  await setDoc(userDoc(uid, 'chatHistory', 'data'), { messages: serializable.slice(-100) })
}

export async function loadChatHistory(uid) {
  const snap = await getDoc(userDoc(uid, 'chatHistory', 'data'))
  if (!snap.exists()) return []
  return (snap.data().messages ?? []).map(m => ({
    ...m,
    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
  }))
}

// ── Sherix memory block ───────────────────────────────────────────────────────

export async function saveMemory(uid, memory) {
  // Firestore can't store raw Date, convert lastActive
  const toSave = {
    ...memory,
    lastActive: memory.lastActive instanceof Date ? memory.lastActive.toISOString() : (memory.lastActive ?? null),
  }
  await setDoc(userDoc(uid, 'memory', 'data'), toSave)
}

export async function loadMemory(uid) {
  const snap = await getDoc(userDoc(uid, 'memory', 'data'))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    ...d,
    lastActive: d.lastActive ? new Date(d.lastActive) : null,
  }
}

// ── RAG knowledge base ────────────────────────────────────────────────────────

async function saveRagSection(uid, section, items) {
  await setDoc(userDoc(uid, 'rag', section), { items })
}

async function loadRagSection(uid, section) {
  const snap = await getDoc(userDoc(uid, 'rag', section))
  return snap.exists() ? (snap.data().items ?? []) : []
}

export const saveRagPdfs  = (uid, items) => saveRagSection(uid, 'pdfs', items)
export const saveRagLinks = (uid, items) => saveRagSection(uid, 'links', items)
export const saveRagNotes = (uid, items) => saveRagSection(uid, 'notes', items)

export async function loadRag(uid) {
  const [pdfs, links, notes] = await Promise.all([
    loadRagSection(uid, 'pdfs'),
    loadRagSection(uid, 'links'),
    loadRagSection(uid, 'notes'),
  ])
  return { pdfs, links, notes }
}

// ── Radar opportunities ───────────────────────────────────────────────────────

export async function saveRadarOpportunities(uid, opportunities) {
  await setDoc(userDoc(uid, 'radar', 'opportunities'), { items: opportunities })
}

export async function loadRadarOpportunities(uid) {
  const snap = await getDoc(userDoc(uid, 'radar', 'opportunities'))
  return snap.exists() ? (snap.data().items ?? []) : []
}

// ── Load all user data in parallel ───────────────────────────────────────────

export async function loadAllUserData(uid) {
  const [profile, prospects, tasks, transactions, personalExpenses, chatHistory, memory, rag, radarOpportunities] = await Promise.all([
    loadProfile(uid),
    loadList(uid, 'prospects'),
    loadList(uid, 'tasks'),
    loadTransactions(uid),
    loadList(uid, 'personalExpenses'),
    loadChatHistory(uid),
    loadMemory(uid),
    loadRag(uid),
    loadRadarOpportunities(uid),
  ])
  return { profile, prospects, tasks, transactions, personalExpenses, chatHistory, memory, rag, radarOpportunities }
}
