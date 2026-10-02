import type { CSSProperties, ReactNode } from 'react'

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── CardLabel ─────────────────────────────────────────────────────────────────

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--f-mono)',
      fontSize: '0.68rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      color: 'var(--fg-muted)',
      marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────

interface BtnProps {
  onClick?: () => void
  children: ReactNode
  variant?: 'default' | 'primary' | 'good'
  disabled?: boolean
  style?: CSSProperties
  title?: string
}

export function Btn({ onClick, children, variant = 'default', disabled, style, title }: BtnProps) {
  const base: CSSProperties = {
    fontFamily: 'var(--f-body)',
    fontSize: '0.8rem',
    fontWeight: variant === 'primary' ? 600 : 500,
    border: '1px solid',
    borderRadius: 4,
    padding: '7px 14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.15s',
  }

  const variants = {
    default: {
      background: 'var(--bg-card)',
      borderColor: 'var(--border-hi)',
      color: 'var(--fg)',
    },
    primary: {
      background: 'var(--accent)',
      borderColor: 'var(--accent)',
      color: '#000',
    },
    good: {
      background: 'var(--good-lo)',
      borderColor: 'var(--good)',
      color: 'var(--good)',
    },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  )
}

// ── Tag ───────────────────────────────────────────────────────────────────────

export function Tag({ priority }: { priority: 'high' | 'med' | 'low' }) {
  const map = {
    high: { bg: 'var(--danger-lo)', color: 'var(--danger)', label: 'Alta'   },
    med:  { bg: 'var(--accent-lo)', color: 'var(--accent)', label: 'Média'  },
    low:  { bg: 'var(--good-lo)',   color: 'var(--good)',   label: 'Baixa'  },
  }
  const { bg, color, label } = map[priority]
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '0.65rem',
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      padding: '2px 6px',
      borderRadius: 3,
      background: bg,
      color,
    }}>
      {label}
    </span>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export function Toast({ message, warn }: { message: string; warn?: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      right: 24,
      background: 'var(--bg-card)',
      border: `1px solid ${warn ? 'var(--warn)' : 'var(--good)'}`,
      borderRadius: 5,
      padding: '10px 16px',
      fontFamily: 'var(--f-mono)',
      fontSize: '0.78rem',
      color: warn ? 'var(--warn)' : 'var(--good)',
      zIndex: 200,
      maxWidth: 320,
    }}>
      {message}
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function daysUntil(iso: string) {
  const target = new Date(iso + 'T00:00:00')
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000))
}
