import { RedirectToSignIn, SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { setUserId } from './lib/userContext'
import { Books }       from './components/Books'
import { Dashboard }   from './components/Dashboard'
import { Evidence }    from './components/Evidence'
import { Identity }    from './components/Identity'
import { Investments } from './components/Investments'
import { Kanban }      from './components/Kanban'
import { Layout }      from './components/Layout'
import { Parking }     from './components/Parking'
import { Toast }       from './components/ui'
import { ExecutionLogService, InviteService } from './lib/services'

type Tab = 'dashboard' | 'kanban' | 'identity' | 'parking' | 'evidence' | 'books' | 'investments'

interface ToastState {
  message: string
  warn: boolean
  key: number
}

export default function App() {
  const { user } = useUser()
  const [tab,         setTab]         = useState<Tab>('dashboard')
  const [streak,      setStreak]      = useState(0)
  const [toast,       setToast]       = useState<ToastState | null>(null)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteDone,  setInviteDone]  = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite')
    if (token) setInviteToken(token)
  }, [])

  useEffect(() => {
    setUserId(user?.id ?? null)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    ExecutionLogService.getStreak().then(setStreak)

    // Aceita convite automaticamente após login
    if (inviteToken && !inviteDone) {
      setInviteDone(true)
      InviteService.acceptInvite(inviteToken, user.id).then(result => {
        if (result) {
          showToast('Você entrou no projeto compartilhado! 🎉')
          window.history.replaceState({}, '', '/')
          setInviteToken(null)
          setTab('kanban')
          localStorage.setItem('dj_tab', 'kanban')
        } else {
          showToast('Convite inválido ou já usado.', true)
        }
      })
    }

    try {
      const saved = localStorage.getItem('dj_tab') as Tab | null
      if (saved && !inviteToken) setTab(saved)
    } catch { /* sem localStorage */ }
  }, [user?.id])

  function showToast(message: string, warn = false) {
    setToast({ message, warn, key: Date.now() })
    setTimeout(() => setToast(null), 2800)
  }

  function handleTabChange(next: string) {
    setTab(next as Tab)
    try { localStorage.setItem('dj_tab', next) } catch { /* ok */ }
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <Layout streak={streak} activeTab={tab} onTabChange={handleTabChange}>
          {tab === 'dashboard'   && user?.id && <Dashboard userId={user.id} />}
          {tab === 'kanban'      && <Kanban       onToast={showToast} />}
          {tab === 'identity'    && <Identity     onToast={showToast} />}
          {tab === 'parking'     && <Parking      onToast={showToast} />}
          {tab === 'evidence'    && <Evidence     onToast={showToast} />}
          {tab === 'books'       && <Books        onToast={showToast} />}
          {tab === 'investments' && <Investments  onToast={showToast} />}

          {toast && <Toast key={toast.key} message={toast.message} warn={toast.warn} />}
        </Layout>
      </SignedIn>
    </>
  )
}
