import { useEffect, useState } from 'react'
import { ProjectService, TaskService } from '../lib/services'
import type { Project, Task } from '../types'
import { Btn, Card } from './ui'

const WIP_LIMIT = 3

export function Kanban({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [project,  setProject]  = useState<Project | null>(null)
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    ProjectService.getActive().then(p => {
      setProject(p)
      if (p) TaskService.getByProject(p.id).then(setTasks)
      else TaskService.getAll().then(setTasks)
    })
  }, [])

  const backlog    = tasks.filter(t => t.status === 'backlog')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const completed  = tasks.filter(t => t.status === 'completed')

  async function moveTask(id: string, status: Task['status']) {
    if (status === 'in_progress' && inProgress.length >= WIP_LIMIT) {
      onToast(`Limite de ${WIP_LIMIT} tarefas em andamento atingido. Conclua uma antes.`, true)
      return
    }
    await TaskService.updateStatus(id, status)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (status === 'completed') onToast('Tarefa concluída. Seguindo em frente. ✓')
  }

  async function addTask() {
    if (!newTitle.trim() || !project) return
    const t = await TaskService.create({
      project_id: project.id,
      title: newTitle.trim(),
      status: 'backlog',
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
            {project?.title ?? '—'}
          </div>
          {project?.definition_of_done && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--fg-muted)', marginTop: 4 }}>
              <span style={{ color: 'var(--good)' }}>⚑</span>
              <span>{project.definition_of_done}</span>
            </div>
          )}
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
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="primary" onClick={addTask}>Adicionar</Btn>
              <Btn onClick={() => setShowForm(false)}>Cancelar</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KanbanCol title="Backlog" count={backlog.length} tasks={backlog} colType="backlog" wipCount={inProgress.length} onMove={moveTask} />
        <KanbanCol title="Em Andamento" wip={`${inProgress.length} / ${WIP_LIMIT}`} wipOver={inProgress.length > WIP_LIMIT} tasks={inProgress} colType="in_progress" wipCount={inProgress.length} onMove={moveTask} />
        <KanbanCol title="Concluído" doneCount={completed.length} tasks={completed} colType="completed" wipCount={inProgress.length} onMove={moveTask} />
      </div>
    </div>
  )
}

function KanbanCol({
  title, count, wip, wipOver, doneCount, tasks, colType, wipCount, onMove,
}: {
  title: string
  count?: number
  wip?: string
  wipOver?: boolean
  doneCount?: number
  tasks: Task[]
  colType: 'backlog' | 'in_progress' | 'completed'
  wipCount: number
  onMove: (id: string, status: Task['status']) => void
}) {
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, minHeight: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{title}</span>
        {wip && (
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', color: wipOver ? 'var(--danger)' : 'var(--accent)', background: 'var(--bg-card)', border: `1px solid ${wipOver ? 'var(--danger)' : 'var(--accent)'}`, borderRadius: 3, padding: '1px 6px' }}>{wip}</span>
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

function TaskCard({ task, colType, wipCount, onMove }: {
  task: Task
  colType: 'backlog' | 'in_progress' | 'completed'
  wipCount: number
  onMove: (id: string, status: Task['status']) => void
}) {
  const borderLeft = colType === 'completed' ? '3px solid var(--good)' : colType === 'in_progress' ? '3px solid var(--accent)' : '1px solid var(--border)'

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft, borderRadius: 5, padding: 12, marginBottom: 8, opacity: colType === 'completed' ? 0.55 : 1 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--fg)', marginBottom: 6, lineHeight: 1.4, textDecoration: colType === 'completed' ? 'line-through' : 'none' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {colType === 'backlog' && (
          <Btn
            style={{ fontSize: '0.68rem', padding: '3px 8px' }}
            disabled={wipCount >= WIP_LIMIT}
            title={wipCount >= WIP_LIMIT ? 'Limite de andamento atingido' : undefined}
            onClick={() => onMove(task.id, 'in_progress')}
          >
            → Andamento
          </Btn>
        )}
        {colType === 'in_progress' && (
          <Btn
            variant="good"
            style={{ fontSize: '0.68rem', padding: '3px 8px' }}
            onClick={() => onMove(task.id, 'completed')}
          >
            ✓ Concluir
          </Btn>
        )}
      </div>
    </div>
  )
}
