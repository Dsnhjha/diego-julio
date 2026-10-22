import { useEffect, useState } from 'react'
import { ProjectService, TaskService } from '../lib/services'
import type { Project, Task } from '../types'
import { Btn, Card } from './ui'

const WIP_LIMIT = 3
const MAX_ACTIVE = 2

export function Kanban({ onToast }: { onToast: (msg: string, warn?: boolean) => void }) {
  const [projects,     setProjects]     = useState<Project[]>([])
  const [tasks,        setTasks]        = useState<Record<string, Task[]>>({})
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [showNewProj,  setShowNewProj]  = useState(false)
  const [projTitle,    setProjTitle]    = useState('')
  const [projObj,      setProjObj]      = useState('')
  const [projDod,      setProjDod]      = useState('')
  const [savingProj,   setSavingProj]   = useState(false)
  const [showForm,     setShowForm]     = useState<string | null>(null)
  const [newTitle,     setNewTitle]     = useState('')

  useEffect(() => {
    ProjectService.getActiveAll().then(async ps => {
      setProjects(ps)
      if (ps.length > 0) setExpanded(ps[0].id)
      const taskMap: Record<string, Task[]> = {}
      await Promise.all(ps.map(async p => {
        taskMap[p.id] = await TaskService.getByProject(p.id)
      }))
      setTasks(taskMap)
    })
  }, [])

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projTitle.trim()) { onToast('Dê um nome ao projeto.', true); return }
    if (projects.length >= MAX_ACTIVE) { onToast(`Limite de ${MAX_ACTIVE} projetos ativos atingido.`, true); return }
    setSavingProj(true)
    try {
      const p = await ProjectService.create({
        title: projTitle.trim(),
        objective: projObj.trim() || undefined,
        definition_of_done: projDod.trim() || undefined,
      })
      setProjects(prev => [...prev, p])
      setTasks(prev => ({ ...prev, [p.id]: [] }))
      setExpanded(p.id)
      setShowNewProj(false)
      setProjTitle(''); setProjObj(''); setProjDod('')
      onToast('Projeto criado. Vamos construir.')
    } catch {
      onToast('Erro ao criar projeto.', true)
    } finally {
      setSavingProj(false)
    }
  }

  async function addTask(projectId: string) {
    if (!newTitle.trim()) return
    const t = await TaskService.create({ project_id: projectId, title: newTitle.trim(), status: 'backlog' })
    setTasks(prev => ({ ...prev, [projectId]: [...(prev[projectId] ?? []), t] }))
    setNewTitle('')
    setShowForm(null)
    onToast('Tarefa adicionada ao Backlog.')
  }

  async function moveTask(projectId: string, id: string, status: Task['status']) {
    const inProgress = (tasks[projectId] ?? []).filter(t => t.status === 'in_progress')
    if (status === 'in_progress' && inProgress.length >= WIP_LIMIT) {
      onToast(`Limite de ${WIP_LIMIT} tarefas em andamento atingido.`, true); return
    }
    await TaskService.updateStatus(id, status)
    setTasks(prev => ({ ...prev, [projectId]: prev[projectId].map(t => t.id === id ? { ...t, status } : t) }))
    if (status === 'completed') onToast('Tarefa concluída. ✓')
  }

  async function deleteTask(projectId: string, id: string) {
    await TaskService.delete(id)
    setTasks(prev => ({ ...prev, [projectId]: prev[projectId].filter(t => t.id !== id) }))
    onToast('Tarefa removida.')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
          {projects.length}/{MAX_ACTIVE} projetos ativos
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {projects.length < MAX_ACTIVE && (
            <Btn variant="primary" onClick={() => setShowNewProj(v => !v)}>+ Novo Projeto</Btn>
          )}
        </div>
      </div>

      {/* Formulário novo projeto */}
      {showNewProj && (
        <Card style={{ marginBottom: 20 }}>
          <form onSubmit={createProject} style={{ display: 'grid', gap: 12 }}>
            <div style={monoLabel}>Novo Projeto</div>
            <div>
              <label style={labelSt}>Nome do Projeto *</label>
              <input autoFocus value={projTitle} onChange={e => setProjTitle(e.target.value)} placeholder="Ex: Curso de CapCut" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Objetivo</label>
              <input value={projObj} onChange={e => setProjObj(e.target.value)} placeholder="O que você quer alcançar?" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Definição de Pronto</label>
              <input value={projDod} onChange={e => setProjDod(e.target.value)} placeholder="Como saberá que concluiu?" style={inputSt} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn type="submit" variant="primary" disabled={savingProj}>{savingProj ? 'Criando...' : 'Criar Projeto'}</Btn>
              <Btn type="button" onClick={() => setShowNewProj(false)}>Cancelar</Btn>
            </div>
          </form>
        </Card>
      )}

      {projects.length === 0 && !showNewProj && (
        <div style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem', padding: '40px 0' }}>
          Nenhum projeto ativo. Clique em "+ Novo Projeto" para começar.
        </div>
      )}

      {/* Projetos em acordeão */}
      <div style={{ display: 'grid', gap: 12 }}>
        {projects.map(project => {
          const projTasks = tasks[project.id] ?? []
          const isOpen = expanded === project.id
          const done = projTasks.filter(t => t.status === 'completed').length
          const pct = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0
          const backlog    = projTasks.filter(t => t.status === 'backlog')
          const inProgress = projTasks.filter(t => t.status === 'in_progress')
          const completed  = projTasks.filter(t => t.status === 'completed')

          return (
            <div key={project.id} style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              {/* Cabeçalho clicável */}
              <div
                onClick={() => setExpanded(isOpen ? null : project.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: isOpen ? 'var(--bg-raised)' : 'var(--bg-card)', cursor: 'pointer', gap: 12, flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)' }}>
                    {project.title}
                  </div>
                  {project.definition_of_done && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 2 }}>
                      <span style={{ color: 'var(--good)' }}>⚑</span> {project.definition_of_done}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--accent)' }}>{pct}%</div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', color: 'var(--fg-muted)' }}>{done}/{projTasks.length} tarefas</div>
                  </div>
                  <span style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Barra de progresso fina */}
              <div style={{ height: 3, background: 'var(--bg-raised)' }}>
                <div style={{ height: '100%', background: 'var(--accent)', width: `${pct}%`, transition: 'width 0.4s ease' }} />
              </div>

              {/* Kanban expandido */}
              {isOpen && (
                <div style={{ padding: '16px 18px', background: 'var(--bg)' }}>
                  {/* Botão + Tarefa */}
                  <div style={{ marginBottom: 14 }}>
                    {showForm === project.id ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          autoFocus
                          type="text"
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addTask(project.id)}
                          placeholder="O que precisa ser feito?"
                          style={{ ...inputSt, flex: 1 }}
                        />
                        <Btn variant="primary" onClick={() => addTask(project.id)}>Adicionar</Btn>
                        <Btn onClick={() => setShowForm(null)}>✕</Btn>
                      </div>
                    ) : (
                      <Btn variant="primary" onClick={() => { setShowForm(project.id); setNewTitle('') }}>+ Tarefa</Btn>
                    )}
                  </div>

                  {/* Board */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <KanbanCol title="Backlog" count={backlog.length} tasks={backlog} colType="backlog" wipCount={inProgress.length} onMove={(id, s) => moveTask(project.id, id, s)} onDelete={id => deleteTask(project.id, id)} />
                    <KanbanCol title="Em Andamento" wip={`${inProgress.length} / ${WIP_LIMIT}`} wipOver={inProgress.length > WIP_LIMIT} tasks={inProgress} colType="in_progress" wipCount={inProgress.length} onMove={(id, s) => moveTask(project.id, id, s)} onDelete={id => deleteTask(project.id, id)} />
                    <KanbanCol title="Concluído" doneCount={completed.length} tasks={completed} colType="completed" wipCount={inProgress.length} onMove={(id, s) => moveTask(project.id, id, s)} onDelete={id => deleteTask(project.id, id)} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCol({ title, count, wip, wipOver, doneCount, tasks, colType, wipCount, onMove, onDelete }: {
  title: string; count?: number; wip?: string; wipOver?: boolean; doneCount?: number
  tasks: Task[]; colType: 'backlog' | 'in_progress' | 'completed'; wipCount: number
  onMove: (id: string, status: Task['status']) => void; onDelete: (id: string) => void
}) {
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, minHeight: 140 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{title}</span>
        {wip && <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', color: wipOver ? 'var(--danger)' : 'var(--accent)', background: 'var(--bg-card)', border: `1px solid ${wipOver ? 'var(--danger)' : 'var(--accent)'}`, borderRadius: 3, padding: '1px 5px' }}>{wip}</span>}
        {count !== undefined && <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', color: 'var(--fg-muted)' }}>{count}</span>}
        {doneCount !== undefined && <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.68rem', color: 'var(--good)' }}>{doneCount} ✓</span>}
      </div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} colType={colType} wipCount={wipCount} onMove={onMove} onDelete={onDelete} />
      ))}
    </div>
  )
}

function TaskCard({ task, colType, wipCount, onMove, onDelete }: {
  task: Task; colType: 'backlog' | 'in_progress' | 'completed'; wipCount: number
  onMove: (id: string, status: Task['status']) => void; onDelete: (id: string) => void
}) {
  const borderLeft = colType === 'completed' ? '3px solid var(--good)' : colType === 'in_progress' ? '3px solid var(--accent)' : '1px solid var(--border)'
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft, borderRadius: 5, padding: 10, marginBottom: 6, opacity: colType === 'completed' ? 0.55 : 1 }}>
      <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--fg)', marginBottom: 6, lineHeight: 1.4, textDecoration: colType === 'completed' ? 'line-through' : 'none' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: '0.72rem', padding: '2px 4px' }}>✕</button>
        <div style={{ display: 'flex', gap: 5 }}>
          {colType === 'backlog' && (
            <Btn style={{ fontSize: '0.66rem', padding: '3px 7px' }} disabled={wipCount >= WIP_LIMIT} onClick={() => onMove(task.id, 'in_progress')}>→ Andamento</Btn>
          )}
          {colType === 'in_progress' && (
            <Btn variant="good" style={{ fontSize: '0.66rem', padding: '3px 7px' }} onClick={() => onMove(task.id, 'completed')}>✓ Concluir</Btn>
          )}
        </div>
      </div>
    </div>
  )
}

const monoLabel: React.CSSProperties = { fontFamily: 'var(--f-mono)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-muted)' }
const labelSt: React.CSSProperties = { display: 'block', fontFamily: 'var(--f-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 6 }
const inputSt: React.CSSProperties = { width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--fg)', fontFamily: 'var(--f-body)', fontSize: '0.88rem', padding: '9px 12px' }
