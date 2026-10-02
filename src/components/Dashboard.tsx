import { useEffect, useState } from 'react'
import { ExecutionLogService, ProjectService } from '../lib/services'
import type { Project, Stats } from '../types'
import { Card, CardLabel } from './ui'

export function Dashboard() {
  const [project, setProject] = useState<Project | null>(null)
  const [streak,  setStreak]  = useState(0)
  const [stats,   setStats]   = useState<Stats>({ tasks_done: 0, projects_done: 0, execution_days: 0 })

  useEffect(() => {
    Promise.all([
      ProjectService.getActive(),
      ExecutionLogService.getStreak(),
      ExecutionLogService.getStats(),
    ]).then(([p, s, st]) => {
      setProject(p)
      setStreak(s)
      setStats(st)
    })
  }, [])

  const pct    = project ? project.progress : 0
  const filled = Math.round(pct / 10)
  const blocks = '█'.repeat(filled) + '░'.repeat(10 - filled)

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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Projeto principal */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <CardLabel>Projeto Principal Ativo</CardLabel>
          <div style={{
            fontFamily: 'var(--f-display)',
            fontSize: '1.3rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {project?.title ?? '—'}
          </div>

          {project?.objective && (
            <div style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginTop: 4 }}>
              {project.objective}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.85rem', color: 'var(--accent)' }}>{blocks}</span>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--accent)' }}>{pct}%</span>
          </div>

          <div style={{ height: 10, background: 'var(--bg-raised)', borderRadius: 2, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', background: 'var(--accent)', width: `${pct}%`, borderRadius: 2, transition: 'width 0.6s ease' }} />
          </div>

          {project?.definition_of_done && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
              <span style={{ color: 'var(--good)' }}>⚑</span>
              <span>{project.definition_of_done}</span>
            </div>
          )}
        </Card>

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
              { value: stats.tasks_done,    label: 'Tarefas',     color: 'var(--accent)' },
              { value: stats.projects_done, label: 'Projetos 🏆', color: 'var(--good)'   },
              { value: stats.execution_days,label: 'Dias',        color: 'var(--fg)'     },
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
