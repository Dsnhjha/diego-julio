import { Flame } from 'lucide-react'

interface LayoutProps {
  streak: number
  activeTab: string
  onTabChange: (tab: string) => void
  children: React.ReactNode
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'kanban',    label: 'Kanban'    },
  { id: 'identity',  label: 'Identidade'},
  { id: 'parking',   label: 'Estacionamento' },
  { id: 'evidence',  label: 'Evidências'},
]

export function Layout({ streak, activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', minHeight: '100svh' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 'env(safe-area-inset-top, 0px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{
            fontFamily: 'var(--f-display)',
            fontSize: '1.6rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--fg)',
            lineHeight: 1,
          }}>
            Diego Júlio
          </span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', display: 'inline-block', marginBottom: 2,
          }} />
        </div>

        <span style={{
          fontFamily: 'var(--f-mono)',
          fontSize: '0.78rem',
          color: 'var(--accent)',
          background: 'var(--accent-lo)',
          border: '1px solid var(--accent)',
          borderRadius: 4,
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <Flame size={13} />
          {streak} dias
        </span>
      </header>

      {/* Nav */}
      <nav style={{
        background: 'var(--bg-raised)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              fontFamily: 'var(--f-body)',
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--fg-muted)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '12px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{
        maxWidth: 1100,
        width: '100%',
        margin: '0 auto',
        paddingInline: 24,
        paddingBlock: 28,
      }}>
        {children}
      </main>
    </div>
  )
}
