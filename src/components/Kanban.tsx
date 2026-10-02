import { useEffect, useState } from 'react'
import { ProjectService, TaskService } from '../lib/services'
import type { Project, Task } from '../types'
import { Btn, Card, Tag } from './ui'

const WIP_LIMIT = 3

export function Kanban({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [project,     setProject]     = useState<Project | null>(null)
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [showForm,    setShowForm]    = useState(false)
  const [newTitle,    setNewTitle]    = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('med')

  useEffect(() => {
    ProjectService.getActive().then(p => {
      setProject(p)
      if (p) TaskService.getByProject(p.id).then(setTasks)
    })
  }, [])

  const backlog = tasks.filter(t => t.status === 'backlog')
  const active  = tasks.filter(t => t.status === 'active')
  const done    = tasks.filter(t => t.status === 'done')

  async function moveTask(id: number, status: Task['status']) {
    if (status === 'active' && active.length >= WIP_LIMIT) {
      onToast(`Limite de ${WIP_LIMIT} tarefas em andamento atingido. Conclua uma antes.`, true)
      return
    }
    await TaskService.updateStatus(id, status)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (status === 'done') onToast('Tarefa concluída. Seguindo em frente. ✓')
  }

  async function addTask() {
    if (!newTitle.trim() || !project) return
    const t = await TaskService.create({
      project_id: project.id,
      title: newTitle.trim(),
      status: 'backlog',
      priority: newPriority,
      created_at: new Date().toISOString().split('T')[0],
    })
    setTasks(prev => [...prev, t])
    setNewTitle('')
    setShowForm(false)
    onToast('Tarefa adicionada ao Backlog.')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)' }}>
            {project?.name ?? '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--fg-muted)', marginTop: 4 }}>
            <span style={{ color: 'var(--good)' }}>⚑</span>
            <span>{project?.finish_line ?? '—'}</span>
          </div>
        </div>
        <Btn variant="primary" onClick={() => setShowForm(v => !v)}>+ Tarefa</Btn>
      </div>

      {/* Add task form */}
      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 14 }}>
            Nova tarefa → Backlog
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label htmlFor="new-task-title" style={{ display: 'block', fontFamily: 'var(--f-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 6 }}>Título</label>
              <input
                id="new-task-title"
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="O que precisa ser feito?"
                autoFocus
                style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--fg)', fontFamily: 'var(--f-body)', fontSize: '0.88rem', padding: '9px 12px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="new-task-priority" style={{ display: 'block', fontFamily: 'var(--f-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 6 }}>Prioridade</label>
                <select
                  id="new-task-priority"
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as Task['priority'])}
                  style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--fg)', fontFamily: 'var(--f-body)', fontSize: '0.88rem', padding: '9px 12px' }}
                >
                  <option value="high">Alta</option>
                  <option value="med">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <Btn variant="primary" onClick={addTask} style={{ flex: 1 }}>Adicionar</Btn>
                <Btn onClick={() => setShowForm(false)}>Cancelar</Btn>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KanbanCol title="Backlog" count={backlog.length} tasks={backlog} colType="backlog" wipCount={active.length} onMove={moveTask} />
        <KanbanCol title="Em Andamento" wip={`${active.length} / ${WIP_LIMIT}`} wipOver={active.length > WIP_LIMIT} tasks={active} colType="active" wipCount={active.length} onMove={moveTask} />
        <KanbanCol title="Concluído" doneCount={done.length} tasks={done} colType="done" wipCount={active.length} onMove={moveTask} />
      </div>
    </div>
  )
}

// ── Coluna ────────────────────────────────────────────────────────────────────

function KanbanCol({
  title, count, wip, wipOver, doneCount, tasks, colType, wipCount, onMove,
}: {
  title: string
  count?: number
  wip?: string
  wipOver?: boolean
  doneCount?: number
  tasks: Task[]
  colType: 'backlog' | 'active' | 'done'
  wipCount: number
  onMove: (id: number, status: Task['status']) => void
}) {
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, minHeight: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{title}</span>
        {wip && (
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', color: wipOver ? 'var(--danger)' : 'var(--warn)', background: wipOver ? 'var(--danger-lo)' : 'var(--accent-lo)', border: `1px solid ${wipOver ? 'var(--danger)' : 'var(--warn)'}`, borderRadius: 3, padding: '1px 6px' }}>{wip}</span>
        )}
        {count !== undefined && <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', color: 'var(--fg-muted)' }}>{count}</span>}
        {doneCount !== undefined && <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', color: 'var(--good)' }}>{doneCount} ✓</span>}
      </div>

      {tasks.map(task => (
        <TaskCard key={task.id} task={task} colType={colType} wipCount={wipCount} onMove={onMove} />
      ))}
    </div>
  )
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({ task, colType, wipCount, onMove }: {
  task: Task
  colType: 'backlog' | 'active' | 'done'
  wipCount: number
  onMove: (id: number, status: Task['status']) => void
}) {
  const borderLeft = colType === 'done' ? '3px solid var(--good)' : colType === 'active' ? '3px solid var(--accent)' : '1px solid var(--border)'

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft, borderRadius: 5, padding: 12, marginBottom: 8, opacity: colType === 'done' ? 0.55 : 1 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--fg)', marginBottom: 6, lineHeight: 1.4, textDecoration: colType === 'done' ? 'line-through' : 'none' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tag priority={task.priority} />
        {colType === 'backlog' && (
          <Btn
            style={{ fontSize: '0.68rem', padding: '3px 8px' }}
            disabled={wipCount >= WIP_LIMIT}
            title={wipCount >= WIP_LIMIT ? 'Limite de andamento atingido' : undefined}
            onClick={() => onMove(task.id, 'active')}
          >
            → Andamento
          </Btn>
        )}
        {colType === 'active' && (
          <Btn
            variant="good"
            style={{ fontSize: '0.68rem', padding: '3px 8px' }}
            onClick={() => onMove(task.id, 'done')}
          >
            ✓ Concluir
          </Btn>
        )}
      </div>
    </div>
  )
}
