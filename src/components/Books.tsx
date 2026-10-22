import { useEffect, useState } from 'react'
import { sendCompletionEmail } from '../lib/emailService'
import { BookService } from '../lib/services'
import type { Book } from '../types'
import { Btn, Card, CardLabel } from './ui'

export function Books({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [books,      setBooks]      = useState<Book[]>([])
  const [showForm,   setShowForm]   = useState(false)
  const [showLog,    setShowLog]    = useState<string | null>(null)
  const [pages,      setPages]      = useState('')
  const [newTitle,   setNewTitle]   = useState('')
  const [newAuthor,  setNewAuthor]  = useState('')
  const [newTotal,   setNewTotal]   = useState('')
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    BookService.getAll().then(setBooks)
  }, [])

  const active = books.find(b => b.status === 'active') ?? null

  async function createBook(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newTotal.trim()) { onToast('Preencha título e total de páginas.', true); return }
    const total = parseInt(newTotal)
    if (isNaN(total) || total < 1) { onToast('Total de páginas inválido.', true); return }
    setSaving(true)
    try {
      const b = await BookService.create({ title: newTitle.trim(), author: newAuthor.trim() || undefined, total_pages: total })
      setBooks(prev => [b, ...prev])
      setNewTitle(''); setNewAuthor(''); setNewTotal('')
      setShowForm(false)
      onToast('Livro cadastrado. Bons estudos.')
    } catch { onToast('Erro ao salvar.', true) }
    finally { setSaving(false) }
  }

  async function logReading(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    const n = parseInt(pages)
    if (isNaN(n) || n < 1) { onToast('Número de páginas inválido.', true); return }
    setSaving(true)
    try {
      await BookService.logReading(active.id, n)
      const updated = { ...active, pages_read: Math.min(active.total_pages, active.pages_read + n) }
      if (updated.pages_read >= active.total_pages) updated.status = 'completed'
      setBooks(prev => prev.map(b => b.id === active.id ? updated : b))
      setPages('')
      setShowLog(null)
      if (updated.pages_read >= active.total_pages) {
        onToast('Livro concluído! 📚')
        sendCompletionEmail('book', active.title, `${active.total_pages} páginas lidas no total.`)
      } else {
        onToast(`+${n} páginas registradas.`)
      }
    } catch { onToast('Erro ao registrar.', true) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', margin: 0 }}>
          Leitura
        </h1>
        {!active && (
          <Btn variant="primary" onClick={() => setShowForm(v => !v)}>+ Livro</Btn>
        )}
      </div>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginBottom: 24, maxWidth: '55ch', lineHeight: 1.7 }}>
        Um livro de cada vez. Páginas diárias constroem quem você está se tornando.
      </p>

      {/* Formulário novo livro */}
      {showForm && !active && (
        <Card style={{ marginBottom: 20 }}>
          <form onSubmit={createBook} style={{ display: 'grid', gap: 12 }}>
            <div style={monoLabel}>Novo Livro</div>
            <div>
              <label style={labelSt}>Título *</label>
              <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Hábitos Atômicos" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Autor</label>
              <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} placeholder="Ex: James Clear" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Total de Páginas *</label>
              <input type="number" min={1} value={newTotal} onChange={e => setNewTotal(e.target.value)} placeholder="Ex: 320" style={inputSt} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn type="submit" variant="primary" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</Btn>
              <Btn type="button" onClick={() => setShowForm(false)}>Cancelar</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Livro ativo */}
      {active && (
        <Card style={{ marginBottom: 20 }}>
          <CardLabel>Leitura Atual</CardLabel>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
            {active.title}
          </div>
          {active.author && (
            <div style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginBottom: 12 }}>{active.author}</div>
          )}

          {/* Barra de progresso */}
          {(() => {
            const pct = active.total_pages > 0 ? Math.round((active.pages_read / active.total_pages) * 100) : 0
            const filled = Math.round(pct / 10)
            const blocks = '█'.repeat(filled) + '░'.repeat(10 - filled)
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.82rem', color: 'var(--accent)' }}>{blocks}</span>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: '1rem', fontWeight: 500, color: 'var(--accent)' }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-raised)', borderRadius: 2, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: `${pct}%`, borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--fg-muted)', marginBottom: 14 }}>
                  {active.pages_read} / {active.total_pages} páginas
                </div>
              </>
            )
          })()}

          {/* Registrar leitura */}
          {showLog === active.id ? (
            <form onSubmit={logReading} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                type="number"
                min={1}
                value={pages}
                onChange={e => setPages(e.target.value)}
                placeholder="Páginas lidas hoje"
                style={{ ...inputSt, maxWidth: 180 }}
              />
              <Btn type="submit" variant="primary" disabled={saving}>{saving ? '...' : 'Registrar'}</Btn>
              <Btn type="button" onClick={() => setShowLog(null)}>✕</Btn>
            </form>
          ) : (
            <Btn onClick={() => setShowLog(active.id)}>+ Páginas lidas hoje</Btn>
          )}
        </Card>
      )}

      {/* Histórico */}
      {books.filter(b => b.status === 'completed').length > 0 && (
        <>
          <div style={monoLabel}>Lidos</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {books.filter(b => b.status === 'completed').map(b => (
              <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--good)', borderRadius: 5, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                <div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textDecoration: 'line-through' }}>{b.title}</div>
                  {b.author && <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{b.author}</div>}
                </div>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--good)' }}>✓ {b.total_pages}p</span>
              </div>
            ))}
          </div>
        </>
      )}

      {books.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem', padding: '40px 0' }}>
          Nenhum livro ainda. Clique em "+ Livro" para começar.
        </div>
      )}
    </div>
  )
}

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--f-mono)',
  fontSize: '0.68rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--fg-muted)',
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--f-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--fg-muted)',
  marginBottom: 6,
}

const inputSt: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--fg)',
  fontFamily: 'var(--f-body)',
  fontSize: '0.88rem',
  padding: '9px 12px',
}
