import { useEffect, useState } from 'react'
import { sendCompletionEmail } from '../lib/emailService'
import { ExecutionLogService, ProjectService } from '../lib/services'
import type { ExecutionLog, Project, Stats } from '../types'
import { Btn, formatDate } from './ui'

export function Evidence({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [stats,      setStats]      = useState<Stats>({ tasks_done: 0, projects_done: 0, execution_days: 0 })
  const [logs,       setLogs]       = useState<ExecutionLog[]>([])
  const [projects,   setProjects]   = useState<Project[]>([])
  const [completing, setCompleting] = useState<string | null>(null)
  const [expanded,   setExpanded]   = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      ExecutionLogService.getStats(),
      ExecutionLogService.getRecent(10),
      ProjectService.getActiveAll(),
    ]).then(([s, l, ps]) => { setStats(s); setLogs(l); setProjects(ps as Project[]) })
  }, [])

  async function completeProject(project: Project) {
    setCompleting(project.id)
    await ProjectService.complete(project.id)
    setProjects(prev => prev.filter(p => p.id !== project.id))
    setStats(prev => ({ ...prev, projects_done: prev.projects_done + 1 }))
    onToast('Projeto concluído. 🏆 Vitória registrada.')
    sendCompletionEmail('project', project.title)
    setCompleting(null)
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

      {/* Botões concluir projetos ativos */}
      {projects.length > 0 && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
          {projects.map(project => (
            <div key={project.id} style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
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
                disabled={completing === project.id}
                onClick={() => completeProject(project)}
                style={{ fontSize: '0.8rem', padding: '8px 18px', whiteSpace: 'nowrap' }}
              >
                {completing === project.id ? 'Salvando...' : '🏆 Concluir Projeto'}
              </Btn>
            </div>
          ))}
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
              {['Data', 'Projeto', 'Tarefas', 'Concluiu', 'Vitória'].map(h => (
                <th key={h} style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const isOpen = expanded === log.id
              return (
                <>
                  <tr
                    key={log.id}
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                    style={{ cursor: 'pointer', background: isOpen ? 'var(--bg-raised)' : 'transparent', transition: 'background 0.15s' }}
                  >
                    <td style={{ fontFamily: 'var(--f-mono)', fontSize: '0.75rem', color: 'var(--fg-muted)', padding: '10px 12px', borderBottom: isOpen ? 'none' : '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                      {formatDate(log.log_date)}
                    </td>
                    <td style={{ fontFamily: 'var(--f-body)', fontSize: '0.82rem', padding: '10px 12px', borderBottom: isOpen ? 'none' : '1px solid var(--border)', color: 'var(--fg)', fontWeight: 500 }}>
                      {log.project_name ?? '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--f-mono)', fontSize: '0.82rem', padding: '10px 12px', borderBottom: isOpen ? 'none' : '1px solid var(--border)', color: 'var(--accent)' }}>
                      {log.tasks_completed_count}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: isOpen ? 'none' : '1px solid var(--border)' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: log.worked_today ? 'var(--good)' : 'var(--border)', marginRight: 6, verticalAlign: 'middle' }} />
                      <span style={{ fontSize: '0.78rem', color: log.worked_today ? 'var(--good)' : 'var(--fg-muted)' }}>
                        {log.worked_today ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: isOpen ? 'none' : '1px solid var(--border)', fontSize: '1rem' }}>
                      {log.worked_today ? '🏆' : ''}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={5} style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)', padding: '0 12px 12px 24px' }}>
                        {log.completed_tasks && log.completed_tasks.length > 0 ? (
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {log.completed_tasks.map((t, i) => (
                              <li key={i} style={{ fontFamily: 'var(--f-body)', fontSize: '0.8rem', color: 'var(--fg-muted)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: 'var(--good)', fontSize: '0.7rem' }}>✓</span> {t}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', color: 'var(--fg-muted)' }}>Sem detalhes de tarefas.</span>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem', padding: '32px 12px' }}>
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
