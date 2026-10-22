import { useEffect, useState } from 'react'
import { BookService, ExecutionLogService, InvestmentService, ProjectService, TaskService } from '../lib/services'
import type { Book, InvestmentGoal, Project, Stats } from '../types'
import { Card, CardLabel } from './ui'

export function Dashboard({ userId }: { userId: string }) {
  const [projects,    setProjects]    = useState<Project[]>([])
  const [projectPcts, setProjectPcts] = useState<Record<string, number>>({})
  const [book,        setBook]        = useState<Book | null>(null)
  const [investments, setInvestments] = useState<InvestmentGoal[]>([])
  const [streak,      setStreak]      = useState(0)
  const [stats,       setStats]       = useState<Stats>({ tasks_done: 0, projects_done: 0, execution_days: 0 })

  useEffect(() => {
    if (!userId) return
    Promise.all([
      ProjectService.getActiveAll(),
      ExecutionLogService.getStreak(),
      ExecutionLogService.getStats(),
      BookService.getActive(),
      InvestmentService.getAll(),
    ]).then(async ([ps, s, st, b, inv]) => {
      setProjects(ps as Project[])
      setStreak(s)
      setStats(st)
      setBook(b)
      setInvestments((inv as InvestmentGoal[]).filter(g => g.status === 'active'))
      const pcts: Record<string, number> = {}
      await Promise.all((ps as Project[]).map(async p => {
        const tasks = await TaskService.getByProject(p.id)
        if (tasks.length > 0) {
          const done = tasks.filter(t => t.status === 'completed').length
          pcts[p.id] = Math.round((done / tasks.length) * 100)
        } else {
          pcts[p.id] = p.progress
        }
      }))
      setProjectPcts(pcts)
    })
  }, [userId])

  return (
    <div>
      <p style={{
        fontFamily: 'var(--f-display)',
        fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--fg)',
        margin: '0 0 28px',
        lineHeight: 1.1,
        textWrap: 'balance',
      }}>
        EU <span style={{ color: 'var(--accent)' }}>TERMINO</span> O QUE CONSTRUO.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Projetos ativos */}
        {projects.length === 0 ? (
          <Card style={{ gridColumn: '1 / -1' }}>
            <CardLabel>Projetos Ativos</CardLabel>
            <div style={{ fontSize: '0.85rem', color: 'var(--fg-muted)' }}>Nenhum projeto ativo.</div>
          </Card>
        ) : projects.map(project => {
          const pct = projectPcts[project.id] ?? 0
          const filled = Math.round(pct / 10)
          const blocks = '█'.repeat(filled) + '░'.repeat(10 - filled)
          return (
            <Card key={project.id} style={{ gridColumn: '1 / -1' }}>
              <CardLabel>{projects.length > 1 ? 'Projeto Ativo' : 'Projeto Principal Ativo'}</CardLabel>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {project.title}
              </div>
              {project.objective && (
                <div style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginTop: 4 }}>{project.objective}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.85rem', color: 'var(--accent)' }}>{blocks}</span>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--accent)' }}>{pct}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--bg-raised)', borderRadius: 2, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', background: 'var(--accent)', width: `${pct}%`, borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
              {project.definition_of_done && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
                  <span style={{ color: 'var(--good)' }}>⚑</span>
                  <span>{project.definition_of_done}</span>
                </div>
              )}
            </Card>
          )
        })}

        {/* Livro atual */}
        {book && (() => {
          const bookPct = book.total_pages > 0 ? Math.round((book.pages_read / book.total_pages) * 100) : 0
          return (
            <Card style={{ gridColumn: '1 / -1' }}>
              <CardLabel>Leitura Atual</CardLabel>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {book.title}
              </div>
              {book.author && (
                <div style={{ fontSize: '0.78rem', color: 'var(--fg-muted)', marginTop: 2 }}>{book.author}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{book.pages_read} / {book.total_pages} páginas</span>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '1rem', fontWeight: 500, color: 'var(--accent)' }}>{bookPct}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-raised)', borderRadius: 2, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--accent)', width: `${bookPct}%`, borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
            </Card>
          )
        })()}

        {/* Investimentos ativos */}
        {investments.length > 0 && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <CardLabel>Metas de Investimento</CardLabel>
            <div style={{ display: 'grid', gap: 14 }}>
              {investments.map(goal => {
                const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
                return (
                  <div key={goal.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div>
                        <span style={{ fontFamily: 'var(--f-display)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{goal.title}</span>
                        <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 3, padding: '1px 5px', marginLeft: 8 }}>{goal.horizon}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.9rem', fontWeight: 500, color: 'var(--accent)' }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--fg-muted)', fontFamily: 'var(--f-mono)', marginBottom: 4 }}>
                      <span>{goal.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {goal.target_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div style={{ height: 7, background: 'var(--bg-raised)', borderRadius: 2, border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--accent)', width: `${pct}%`, borderRadius: 2, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Streak */}
        <Card>
          <CardLabel>Sequência de Execução</CardLabel>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '3.2rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
            {streak}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>dias consecutivos avançando</div>
        </Card>

        {/* Placar rápido */}
        <Card>
          <CardLabel>Placar Rápido</CardLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { value: stats.tasks_done,     label: 'Tarefas',     color: 'var(--accent)' },
              { value: stats.projects_done,  label: 'Projetos 🏆', color: 'var(--good)'   },
              { value: stats.execution_days, label: 'Dias',        color: 'var(--fg)'     },
            ].map(({ value, label, color }) => (
              <div key={label} style={{ textAlign: 'center', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 5, padding: '12px 8px' }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '2rem', fontWeight: 700, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--fg-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
