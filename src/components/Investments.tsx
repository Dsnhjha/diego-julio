import { useEffect, useState } from 'react'
import { sendCompletionEmail } from '../lib/emailService'
import { InvestmentService } from '../lib/services'
import type { InvestmentGoal } from '../types'
import { Btn, Card } from './ui'

const horizonColor = 'var(--accent)'

function formatBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function buildHorizon(value: string, unit: string) {
  return `${value} ${unit}`
}

export function Investments({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [goals,        setGoals]        = useState<InvestmentGoal[]>([])
  const [showForm,     setShowForm]     = useState(false)
  const [showAdd,      setShowAdd]      = useState<string | null>(null)
  const [addAmount,    setAddAmount]    = useState('')
  const [newTitle,     setNewTitle]     = useState('')
  const [horizonUnit,  setHorizonUnit]  = useState<'dias' | 'meses' | 'anos'>('meses')
  const [horizonValue, setHorizonValue] = useState('')
  const [newTarget,    setNewTarget]    = useState('')
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    InvestmentService.getAll().then(setGoals)
  }, [])

  async function createGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newTarget.trim() || !horizonValue.trim()) { onToast('Preencha todos os campos.', true); return }
    const target = parseFloat(newTarget.replace(',', '.'))
    const hVal = parseInt(horizonValue)
    if (isNaN(target) || target <= 0) { onToast('Valor inválido.', true); return }
    if (isNaN(hVal) || hVal < 1) { onToast('Prazo inválido.', true); return }
    setSaving(true)
    try {
      const g = await InvestmentService.create({ title: newTitle.trim(), horizon: buildHorizon(horizonValue, horizonUnit), target_amount: target })
      setGoals(prev => [...prev, g])
      setNewTitle(''); setNewTarget(''); setHorizonValue(''); setHorizonUnit('meses')
      setShowForm(false)
      onToast('Meta criada.')
    } catch { onToast('Erro ao salvar.', true) }
    finally { setSaving(false) }
  }

  async function contribute(id: string) {
    const amount = parseFloat(addAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) { onToast('Valor inválido.', true); return }
    setSaving(true)
    try {
      const updated = await InvestmentService.addContribution(id, amount)
      setGoals(prev => prev.map(g => g.id === id ? updated : g))
      setAddAmount('')
      setShowAdd(null)
      if (updated.status === 'completed') {
        onToast('Meta atingida! 🏆')
        sendCompletionEmail('investment', updated.title, `${formatBRL(updated.target_amount)} conquistados.`)
      } else {
        onToast(`${formatBRL(amount)} aportados.`)
      }
    } catch { onToast('Erro ao registrar.', true) }
    finally { setSaving(false) }
  }

  const active = goals.filter(g => g.status === 'active')
  const done   = goals.filter(g => g.status === 'completed')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', margin: 0 }}>
          Investimentos
        </h1>
        <Btn variant="primary" onClick={() => setShowForm(v => !v)}>+ Meta</Btn>
      </div>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginBottom: 24, maxWidth: '55ch', lineHeight: 1.7 }}>
        Metas financeiras com progresso visível. Cada aporte é um passo.
      </p>

      {/* Formulário nova meta */}
      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <form onSubmit={createGoal} style={{ display: 'grid', gap: 12 }}>
            <div style={monoLabel}>Nova Meta Financeira</div>
            <div>
              <label style={labelSt}>Nome da Meta *</label>
              <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Reserva de Emergência" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Prazo</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  value={horizonValue}
                  onChange={e => setHorizonValue(e.target.value)}
                  placeholder="Ex: 12"
                  style={{ ...inputSt, maxWidth: 100 }}
                />
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  {(['dias', 'meses', 'anos'] as const).map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setHorizonUnit(u)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 4,
                        border: `1px solid ${horizonUnit === u ? horizonColor : 'var(--border)'}`,
                        background: horizonUnit === u ? `color-mix(in srgb, ${horizonColor} 15%, transparent)` : 'var(--bg-raised)',
                        color: horizonUnit === u ? horizonColor : 'var(--fg-muted)',
                        fontFamily: 'var(--f-mono)',
                        fontSize: '0.72rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label style={labelSt}>Valor Alvo (R$) *</label>
              <input type="number" min={1} step="0.01" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="Ex: 10000" style={inputSt} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn type="submit" variant="primary" disabled={saving}>{saving ? 'Salvando...' : 'Criar Meta'}</Btn>
              <Btn type="button" onClick={() => setShowForm(false)}>Cancelar</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Metas ativas */}
      {active.length > 0 && (
        <div style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
          {active.map(goal => {
            const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
            const filled = Math.round(pct / 10)
            const blocks = '█'.repeat(filled) + '░'.repeat(10 - filled)
            return (
              <Card key={goal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {goal.title}
                    </div>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: horizonColor, border: `1px solid ${horizonColor}`, borderRadius: 3, padding: '1px 6px' }}>
                      {goal.horizon}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: '1rem', fontWeight: 500, color: horizonColor }}>{pct}%</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 4px' }}>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.8rem', color: horizonColor }}>{blocks}</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-raised)', borderRadius: 2, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', background: horizonColor, width: `${pct}%`, borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--fg-muted)', marginBottom: 14 }}>
                  {formatBRL(goal.current_amount)} / {formatBRL(goal.target_amount)}
                  <span style={{ marginLeft: 12, color: 'var(--fg-dim)' }}>faltam {formatBRL(goal.target_amount - goal.current_amount)}</span>
                </div>

                {showAdd === goal.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      autoFocus
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={addAmount}
                      onChange={e => setAddAmount(e.target.value)}
                      placeholder="Valor aportado (R$)"
                      style={{ ...inputSt, maxWidth: 200 }}
                    />
                    <Btn variant="primary" disabled={saving} onClick={() => contribute(goal.id)}>{saving ? '...' : 'Aportar'}</Btn>
                    <Btn onClick={() => setShowAdd(null)}>✕</Btn>
                  </div>
                ) : (
                  <Btn onClick={() => setShowAdd(goal.id)}>+ Registrar Aporte</Btn>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Metas concluídas */}
      {done.length > 0 && (
        <>
          <div style={{ ...monoLabel, marginBottom: 10 }}>Concluídas</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {done.map(goal => (
              <div key={goal.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--good)', borderRadius: 5, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                <div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textDecoration: 'line-through' }}>{goal.title}</div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', color: 'var(--fg-muted)' }}>{goal.horizon}</div>
                </div>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.8rem', color: 'var(--good)' }}>✓ {formatBRL(goal.target_amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {goals.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem', padding: '40px 0' }}>
          Nenhuma meta ainda. Clique em "+ Meta" para começar.
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
