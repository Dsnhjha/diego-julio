import { useEffect, useState } from 'react'
import { IdeaParkingService } from '../lib/services'
import type { IdeaParking } from '../types'
import { Btn, daysUntil, formatDate } from './ui'

export function Parking({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [ideas, setIdeas]     = useState<IdeaParking[]>([])
  const [title, setTitle]     = useState('')
  const [desc,  setDesc]      = useState('')
  const [date,  setDate]      = useState('')

  useEffect(() => {
    IdeaParkingService.getAll().then(setIdeas)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) { onToast('Preencha título e data.', true); return }
    const idea = await IdeaParkingService.create({ title: title.trim(), description: desc.trim(), unlock_date: date })
    setIdeas(prev => [...prev, idea])
    setTitle(''); setDesc(''); setDate('')
    onToast('Ideia estacionada. Foco no projeto atual.')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', margin: '0 0 8px', textWrap: 'balance' }}>
        Estacionamento de Ideias
      </h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginBottom: 20, maxWidth: '55ch', lineHeight: 1.7 }}>
        Ideias novas ficam aqui, trancadas até a data definida. Nada compete com o projeto atual.
      </p>

      {/* Formulário */}
      <form onSubmit={submit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 14 }}>
          Registrar nova ideia
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <Field id="park-title" label="Título da ideia">
            <input id="park-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome curto e direto" style={inputStyle} />
          </Field>
          <Field id="park-desc" label="Descrição">
            <textarea id="park-desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="O que é, para quem, por que importa..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field id="park-date" label="Disponível para avaliação em">
              <input id="park-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </Field>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Btn variant="primary" style={{ width: '100%' }}>Estacionar ideia</Btn>
            </div>
          </div>
        </div>
      </form>

      {/* Lista */}
      <div style={{ display: 'grid', gap: 12 }}>
        {ideas.map(idea => {
          const locked = idea.unlock_date > today
          const days   = daysUntil(idea.unlock_date)
          return (
            <div key={idea.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'start', opacity: locked ? 0.7 : 1 }}>
              <span style={{ fontSize: '1.1rem', color: locked ? 'var(--lock)' : 'var(--good)', paddingTop: 2 }}>
                {locked ? '🔒' : '🔓'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem', color: locked ? 'var(--fg-muted)' : 'var(--fg)', marginBottom: 3 }}>
                  {idea.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--fg-dim)', lineHeight: 1.5 }}>
                  {idea.description}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', textAlign: 'right', whiteSpace: 'nowrap', paddingTop: 2, color: locked && days <= 30 ? 'var(--accent)' : 'var(--fg-muted)' }}>
                {locked ? (
                  <>Disponível em<br /><strong>{formatDate(idea.unlock_date)}</strong><br /><span style={{ color: 'var(--fg-dim)', fontSize: '0.65rem' }}>{days} dias</span></>
                ) : (
                  <span style={{ color: 'var(--good)' }}>Disponível ✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontFamily: 'var(--f-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--fg)',
  fontFamily: 'var(--f-body)',
  fontSize: '0.88rem',
  padding: '9px 12px',
}
