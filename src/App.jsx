import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'
import { useWorkspaceStore } from './store/workspaceStore'
import TopBar from './components/Layout/TopBar'
import Sidebar from './components/Layout/Sidebar'
import ChatPanel from './components/Chat/ChatPanel'
import ModulesPanel from './components/Layout/ModulesPanel'
import OnboardingScreen from './components/Onboarding/OnboardingScreen'
import AuthScreen from './components/Auth/AuthScreen'
import ToastContainer from './components/UI/Toast'
import './index.css'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg animate-pulse select-none"
          style={{ background: 'var(--accent)' }}
        >
          M
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cargando...</span>
      </div>
    </div>
  )
}

export default function App() {
  // undefined = auth not checked yet; null = checked & not logged in; object = logged in
  const [authUser,   setAuthUser]   = useState(undefined)
  // dataReady = Firestore profile has been loaded (prevents flash of OnboardingScreen)
  const [dataReady,  setDataReady]  = useState(false)

  const loadUserData = useWorkspaceStore((s) => s.loadUserData)
  const clearStore   = useWorkspaceStore((s) => s.clearStore)
  const userProfile  = useWorkspaceStore((s) => s.userProfile)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        clearStore()
        setAuthUser(null)
        setDataReady(true)
      } else {
        // Load Firestore data BEFORE updating authUser so the component
        // never renders with authUser set but profile still null.
        await loadUserData(user.uid)
        console.log('onboardingComplete desde Firestore:', useWorkspaceStore.getState().userProfile?.onboardingComplete)
        setAuthUser(user)
        setDataReady(true)
      }
    })
    return unsubscribe
  }, [])

  // Auth still being determined, or Firestore load in flight
  if (authUser === undefined || !dataReady) return <LoadingScreen />

  // Not logged in
  if (!authUser) return <AuthScreen />

  // Logged in but not onboarded
  if (!userProfile?.onboardingComplete) return <OnboardingScreen />

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <TopBar firebaseUser={authUser} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — 72px vertical nav */}
        <Sidebar />

        {/* Chat — fixed 310px */}
        <div className="shrink-0 overflow-hidden" style={{ width: 310, borderRight: '1px solid var(--border)' }}>
          <ChatPanel />
        </div>

        {/* Modules — flex-1 */}
        <div className="flex-1 overflow-hidden">
          <ModulesPanel />
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
