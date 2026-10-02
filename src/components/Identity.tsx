import { useEffect, useState } from 'react'
import { IdentityService } from '../lib/services'
import type { IdentityPhrase } from '../types'

export function Identity({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [phrases, setPhrases] = useState<IdentityPhrase[]>([])

  useEffect(() => {
    IdentityService.getPhrases().then(setPhrases)
  }, [])

  async function repeat(id: number) {
    const phrase = phrases.find(p => p.id === id)
    if (phrase?.done_today) {
      onToast('Já repetida hoje. Volte amanhã.', true)
      return
    }
    await IdentityService.markRepeated(id)
    setPhrases(prev =>
      prev.map(p => p.id === id ? { ...p, streak: p.streak + 1, done_today: true } : p)
    )
    const updated = phrases.find(p => p.id === id)
    if (updated) onToast(`Sequência atualizada: ${updated.streak + 1} dias consecutivos.`)
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', margin: '0 0 8px', textWrap: 'balance' }}>
        Quem Estou Me Tornando
      </h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginBottom: 24, maxWidth: '55ch', lineHeight: 1.7 }}>
        Repita cada frase em voz alta. Não é motivação — é reprogramação. A sequência é a prova.
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
        {phrases.map(phrase => (
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
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', fontWeight: 600, letterSpacing: '0.03em', color: 'var(--fg)', lineHeight: 1.35 }}>
                {phrase.phrase}
              </div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', color: 'var(--fg-muted)', marginTop: 6 }}>
                Sequência: <span style={{ color: 'var(--good)', fontWeight: 500 }}>{phrase.streak} dias</span>
              </div>
            </div>

            <button
              onClick={() => repeat(phrase.id)}
              aria-pressed={phrase.done_today}
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '0.72rem',
                fontWeight: 500,
                letterSpacing: '0.06em',
                border: `1px solid ${phrase.done_today ? 'var(--good)' : 'var(--border-hi)'}`,
                borderRadius: 4,
                background: phrase.done_today ? 'var(--good-lo)' : 'var(--bg-raised)',
                color: phrase.done_today ? 'var(--good)' : 'var(--fg-muted)',
                padding: '8px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {phrase.done_today ? '✓ Repetido hoje' : '[ ✓ Repetir hoje ]'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
