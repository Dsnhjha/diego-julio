import { useEffect, useState } from 'react'
import { ExecutionLogService, ProjectService } from '../lib/services'
import type { ExecutionLog, Project, Stats } from '../types'
import { Btn, formatDate } from './ui'

export function Evidence({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [stats,   setStats]   = useState<Stats>({ tasks_done: 0, projects_done: 0, execution_days: 0 })
  const [logs,    setLogs]    = useState<ExecutionLog[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    Promise.all([
      ExecutionLogService.getStats(),
      ExecutionLogService.getRecent(10),
      ProjectService.getActive(),
    ]).then(([s, l, p]) => { setStats(s); setLogs(l); setProject(p) })
  }, [])

  async function completeProject() {
    if (!project) return
    setCompleting(true)
    await ProjectService.complete(project.id)
    setProject(prev => prev ? { ...prev, status: 'completed' } : prev)
    setStats(prev => ({ ...prev, projects_done: prev.projects_done + 1 }))
    onToast('Projeto concluído. 🏆 Vitória registrada.')
    setCompleting(false)
  }

  const tiles = [
    { value: stats.tasks_done,     label: 'Tarefas Concluídas',    color: 'var(--accent)' },
    { value: stats.projects_done,  label: 'Projetos Concluídos 🏆', color: 'var(--good)'   },
    { value: stats.execution_days, label: 'Dias de Execução',       color: 'var(--fg)'     },
  ]

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', margin: '0 0 8px', textWrap: 'balance' }}>
        Placar de Vitórias
      </h1>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginBottom: 20, maxWidth: '55ch', lineHeight: 1.7 }}>
        Números absolutos. Prova da mudança de identidade.
      </p>

      {/* Big tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {tiles.map(({ value, label, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '3.5rem', fontWeight: 700, lineHeight: 1, color, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Botão concluir projeto */}
      {project && project.status !== 'completed' && (
        <div style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 4 }}>
              Projeto Ativo
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg)' }}>
              {project.title}
            </div>
          </div>
          <Btn
            variant="good"
            disabled={completing}
            onClick={completeProject}
            style={{ fontSize: '0.8rem', padding: '8px 18px', whiteSpace: 'nowrap' }}
          >
            {completing ? 'Salvando...' : '🏆 Concluir Projeto'}
          </Btn>
        </div>
      )}

      {project?.status === 'completed' && (
        <div style={{ marginBottom: 24, padding: '12px 20px', background: 'var(--good-lo)', border: '1px solid var(--good)', borderRadius: 6, fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--good)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ✓ {project.title} — Projeto Concluído
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 20px' }} />

      <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 14 }}>
        Registro de Execução Recente
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Data', 'Tarefas', 'Trabalhou'].map(h => (
                <th key={h} style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--fg-muted)', padding: '10px 12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {formatDate(log.log_date)}
                </td>
                <td style={{ fontFamily: 'var(--f-mono)', fontSize: '0.82rem', padding: '10px 12px', borderBottom: '1px solid var(--border)', color: 'var(--accent)' }}>
                  {log.tasks_completed_count}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: log.worked_today ? 'var(--good)' : 'var(--border)', marginRight: 6, verticalAlign: 'middle' }} />
                  <span style={{ fontSize: '0.78rem', color: log.worked_today ? 'var(--good)' : 'var(--fg-muted)' }}>
                    {log.worked_today ? 'Sim' : 'Não'}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem', padding: '32px 12px' }}>
                  Nenhum registro ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
