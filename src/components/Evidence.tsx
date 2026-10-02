import { useEffect, useState } from 'react'
import { ExecutionLogService } from '../lib/services'
import type { ExecutionLog, Stats } from '../types'
import { formatDate } from './ui'

export function Evidence() {
  const [stats, setStats] = useState<Stats>({ tasks_done: 0, projects_done: 0, execution_days: 0 })
  const [logs,  setLogs]  = useState<ExecutionLog[]>([])

  useEffect(() => {
    Promise.all([
      ExecutionLogService.getStats(),
      ExecutionLogService.getRecent(10),
    ]).then(([s, l]) => { setStats(s); setLogs(l) })
  }, [])

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

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 20px' }} />

      <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 14 }}>
        Registro de Execução Recente
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Data', 'Tipo', 'Descrição', 'Projeto'].map(h => (
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
                  {formatDate(log.date)}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: log.type === 'project' ? 'var(--accent)' : 'var(--good)', marginRight: 6, verticalAlign: 'middle' }} />
                  {log.type === 'project' ? 'Projeto' : 'Tarefa'}
                </td>
                <td style={{ fontSize: '0.82rem', padding: '10px 12px', borderBottom: '1px solid var(--border)', minWidth: 0 }}>
                  {log.description}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', padding: '10px 12px', borderBottom: '1px solid var(--border)', minWidth: 0 }}>
                  {log.project}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
