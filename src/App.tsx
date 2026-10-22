import { useEffect, useState } from 'react'
import { Books }       from './components/Books'
import { Dashboard }   from './components/Dashboard'
import { Evidence }    from './components/Evidence'
import { Identity }    from './components/Identity'
import { Investments } from './components/Investments'
import { Kanban }      from './components/Kanban'
import { Layout }      from './components/Layout'
import { Parking }     from './components/Parking'
import { Toast }       from './components/ui'
import { ExecutionLogService } from './lib/services'

type Tab = 'dashboard' | 'kanban' | 'identity' | 'parking' | 'evidence' | 'books' | 'investments'

interface ToastState {
  message: string
  warn: boolean
  key: number
}

export default function App() {
  const [tab,    setTab]    = useState<Tab>('dashboard')
  const [streak, setStreak] = useState(0)
  const [toast,  setToast]  = useState<ToastState | null>(null)

  useEffect(() => {
    ExecutionLogService.getStreak().then(setStreak)

    try {
      const saved = localStorage.getItem('dj_tab') as Tab | null
      if (saved) setTab(saved)
    } catch { /* sem localStorage */ }
  }, [])

  function showToast(message: string, warn = false) {
    setToast({ message, warn, key: Date.now() })
    setTimeout(() => setToast(null), 2800)
  }

  function handleTabChange(next: string) {
    setTab(next as Tab)
    try { localStorage.setItem('dj_tab', next) } catch { /* ok */ }
  }

  return (
    <Layout streak={streak} activeTab={tab} onTabChange={handleTabChange}>
      {tab === 'dashboard'   && <Dashboard />}
      {tab === 'kanban'      && <Kanban       onToast={showToast} />}
      {tab === 'identity'    && <Identity     onToast={showToast} />}
      {tab === 'parking'     && <Parking      onToast={showToast} />}
      {tab === 'evidence'    && <Evidence     onToast={showToast} />}
      {tab === 'books'       && <Books        onToast={showToast} />}
      {tab === 'investments' && <Investments  onToast={showToast} />}

      {toast && <Toast key={toast.key} message={toast.message} warn={toast.warn} />}
    </Layout>
  )
}
