import { useEffect, useState } from 'react'
import { IdentityService } from '../lib/services'
import type { IdentityPhrase } from '../types'
import { Btn, Card } from './ui'

export function Identity({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [phrases,   setPhrases]   = useState<IdentityPhrase[]>([])
  const [showForm,  setShowForm]  = useState(false)
  const [newPhrase, setNewPhrase] = useState('')
  const [newCat,    setNewCat]    = useState('')

  useEffect(() => {
    IdentityService.getPhrases().then(setPhrases)
  }, [])

  const today = new Date().toISOString().split('T')[0]

  async function repeat(id: string) {
    const phrase = phrases.find(p => p.id === id)
    if (phrase?.last_repeated_date === today) {
      onToast('Já repetida hoje. Volte amanhã.', true)
      return
    }
    await IdentityService.markRepeated(id)
    setPhrases(prev =>
      prev.map(p => p.id === id ? { ...p, streak_count: p.streak_count + 1, last_repeated_date: today } : p)
    )
    const updated = phrases.find(p => p.id === id)
    if (updated) onToast(`Sequência atualizada: ${updated.streak_count + 1} dias consecutivos.`)
  }

  async function addPhrase(e?: React.FormEvent) {
    e?.preventDefault()
    if (!newPhrase.trim()) { onToast('Escreva a frase.', true); return }
    try {
      const created = await IdentityService.createPhrase({
        phrase: newPhrase.trim(),
        category: newCat.trim() || 'Identidade',
        streak_count: 0,
      })
      setPhrases(prev => [...prev, created])
      setNewPhrase('')
      setNewCat('')
      setShowForm(false)
      onToast('Frase adicionada.')
    } catch (err) {
      console.error('Erro ao criar frase:', err)
      onToast('Erro ao salvar. Tente novamente.', true)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', margin: 0, textWrap: 'balance' }}>
          Quem Estou Me Tornando
        </h1>
        <Btn variant="primary" onClick={() => setShowForm(v => !v)}>+ Frase</Btn>
      </div>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginBottom: 24, maxWidth: '55ch', lineHeight: 1.7 }}>
        Repita cada frase em voz alta. Não é motivação — é reprogramação. A sequência é a prova.
      </p>

      {/* Formulário */}
      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <form onSubmit={addPhrase} style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
              Nova frase de identidade
            </div>
            <div>
              <label htmlFor="phrase-text" style={labelStyle}>Frase</label>
              <input
                id="phrase-text"
                type="text"
                value={newPhrase}
                onChange={e => setNewPhrase(e.target.value)}
                placeholder="Ex: Eu entrego o que prometo."
                autoFocus
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="phrase-cat" style={labelStyle}>Categoria</label>
              <input
                id="phrase-cat"
                type="text"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                placeholder="Ex: Execução, Foco, Disciplina..."
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn type="submit" variant="primary">Adicionar</Btn>
              <Btn type="button" onClick={() => setShowForm(false)}>Cancelar</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de frases */}
      <div style={{ display: 'grid', gap: 14 }}>
        {phrases.map(phrase => {
          const doneToday = phrase.last_repeated_date === today
          return (
            <div
              key={phrase.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: 20,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
                  {phrase.category}
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.35rem', fontWeight: 600, letterSpacing: '0.03em', color: 'var(--fg)', lineHeight: 1.35 }}>
                  {phrase.phrase}
                </div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.8rem', color: 'var(--fg-muted)', marginTop: 6 }}>
                  Sequência: <span style={{ color: 'var(--good)', fontWeight: 500 }}>{phrase.streak_count} dias</span>
                </div>
              </div>

              <button
                onClick={() => repeat(phrase.id)}
                aria-pressed={doneToday}
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  border: `1px solid ${doneToday ? 'var(--good)' : 'var(--border)'}`,
                  borderRadius: 4,
                  background: doneToday ? 'color-mix(in srgb, var(--good) 15%, transparent)' : 'var(--bg-raised)',
                  color: doneToday ? 'var(--good)' : 'var(--fg-muted)',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {doneToday ? '✓ Repetido hoje' : '[ ✓ Repetir hoje ]'}
              </button>
            </div>
          )
        })}

        {phrases.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem', padding: '40px 0' }}>
            Nenhuma frase ainda. Clique em "+ Frase" para começar.
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--f-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--fg-muted)',
  marginBottom: 6,
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
