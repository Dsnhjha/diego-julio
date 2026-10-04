import { useEffect, useState } from 'react'
import { ProjectService, TaskService } from '../lib/services'
import type { Project, Task } from '../types'
import { Btn, Card } from './ui'

const WIP_LIMIT = 3

export function Kanban({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [project,      setProject]      = useState<Project | null>(null)
  const [tasks,        setTasks]        = useState<Task[]>([])
  const [showForm,     setShowForm]     = useState(false)
  const [newTitle,     setNewTitle]     = useState('')
  const [showNewProj,  setShowNewProj]  = useState(false)
  const [projTitle,    setProjTitle]    = useState('')
  const [projObj,      setProjObj]      = useState('')
  const [projDod,      setProjDod]      = useState('')
  const [savingProj,   setSavingProj]   = useState(false)

  useEffect(() => {
    ProjectService.getActive().then(p => {
      setProject(p)
      if (p) TaskService.getByProject(p.id).then(setTasks)
      else TaskService.getAll().then(setTasks)
    })
  }, [])

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projTitle.trim()) { onToast('Dê um nome ao projeto.', true); return }
    setSavingProj(true)
    try {
      const p = await ProjectService.create({
        title: projTitle.trim(),
        objective: projObj.trim() || undefined,
        definition_of_done: projDod.trim() || undefined,
      })
      setProject(p)
      setTasks([])
      setShowNewProj(false)
      setProjTitle(''); setProjObj(''); setProjDod('')
      onToast('Projeto criado. Vamos construir.')
    } catch {
      onToast('Erro ao criar projeto.', true)
    } finally {
      setSavingProj(false)
    }
  }

  const backlog    = tasks.filter(t => t.status === 'backlog')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const completed  = tasks.filter(t => t.status === 'completed')

  async function deleteTask(id: string) {
    await TaskService.delete(id)
    setTasks(prev => prev.filter(t => t.id !== id))
    onToast('Tarefa removida.')
  }

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
        <div style={{ display: 'flex', gap: 8 }}>
          {!project && (
            <Btn variant="primary" onClick={() => setShowNewProj(v => !v)}>+ Novo Projeto</Btn>
          )}
          {project && (
            <Btn variant="primary" onClick={() => setShowForm(v => !v)}>+ Tarefa</Btn>
          )}
        </div>
      </div>

      {/* Formulário novo projeto */}
      {showNewProj && !project && (
        <Card style={{ marginBottom: 20 }}>
          <form onSubmit={createProject} style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
              Novo Projeto
            </div>
            <div>
              <label style={projLabelStyle}>Nome do Projeto *</label>
              <input autoFocus value={projTitle} onChange={e => setProjTitle(e.target.value)} placeholder="Ex: Curso de CapCut" style={projInputStyle} />
            </div>
            <div>
              <label style={projLabelStyle}>Objetivo</label>
              <input value={projObj} onChange={e => setProjObj(e.target.value)} placeholder="O que você quer alcançar?" style={projInputStyle} />
            </div>
            <div>
              <label style={projLabelStyle}>Definição de Pronto</label>
              <input value={projDod} onChange={e => setProjDod(e.target.value)} placeholder="Como saberá que concluiu?" style={projInputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn type="submit" variant="primary" disabled={savingProj}>{savingProj ? 'Criando...' : 'Criar Projeto'}</Btn>
              <Btn type="button" onClick={() => setShowNewProj(false)}>Cancelar</Btn>
            </div>
          </form>
        </Card>
      )}

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
        <KanbanCol title="Backlog" count={backlog.length} tasks={backlog} colType="backlog" wipCount={inProgress.length} onMove={moveTask} onDelete={deleteTask} />
        <KanbanCol title="Em Andamento" wip={`${inProgress.length} / ${WIP_LIMIT}`} wipOver={inProgress.length > WIP_LIMIT} tasks={inProgress} colType="in_progress" wipCount={inProgress.length} onMove={moveTask} onDelete={deleteTask} />
        <KanbanCol title="Concluído" doneCount={completed.length} tasks={completed} colType="completed" wipCount={inProgress.length} onMove={moveTask} onDelete={deleteTask} />
      </div>
    </div>
  )
}

function KanbanCol({
  title, count, wip, wipOver, doneCount, tasks, colType, wipCount, onMove, onDelete,
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
  onDelete: (id: string) => void
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
        <TaskCard key={task.id} task={task} colType={colType} wipCount={wipCount} onMove={onMove} onDelete={onDelete} />
      ))}
    </div>
  )
}

function TaskCard({ task, colType, wipCount, onMove, onDelete }: {
  task: Task
  colType: 'backlog' | 'in_progress' | 'completed'
  wipCount: number
  onMove: (id: string, status: Task['status']) => void
  onDelete: (id: string) => void
}) {
  const borderLeft = colType === 'completed' ? '3px solid var(--good)' : colType === 'in_progress' ? '3px solid var(--accent)' : '1px solid var(--border)'

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft, borderRadius: 5, padding: 12, marginBottom: 8, opacity: colType === 'completed' ? 0.55 : 1 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--fg)', marginBottom: 6, lineHeight: 1.4, textDecoration: colType === 'completed' ? 'line-through' : 'none' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <button
          onClick={() => onDelete(task.id)}
          title="Apagar tarefa"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: '0.75rem', padding: '2px 4px', lineHeight: 1 }}
        >
          ✕
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
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
    </div>
  )
}

const projLabelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--f-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--fg-muted)',
  marginBottom: 6,
}

const projInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--fg)',
  fontFamily: 'var(--f-body)',
  fontSize: '0.88rem',
  padding: '9px 12px',
}
