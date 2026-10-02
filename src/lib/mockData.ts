import type { ExecutionLog, IdentityPhrase, IdeaParking, Project, Stats, Task } from '../types'

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'App Diego Júlio',
    objective: 'Lançar o app de produtividade pessoal',
    status: 'active',
    progress: 40,
    target_date: '2026-12-31',
    created_at: new Date().toISOString(),
  },
]

export const mockTasks: Task[] = [
  { id: '1', project_id: '1', title: 'Configurar Supabase', status: 'completed', created_at: new Date().toISOString() },
  { id: '2', project_id: '1', title: 'Deploy no Vercel', status: 'in_progress', created_at: new Date().toISOString() },
  { id: '3', project_id: '1', title: 'Criar tabelas SQL', status: 'backlog', created_at: new Date().toISOString() },
]

export const mockIdeas: IdeaParking[] = [
  {
    id: '1',
    title: 'App de finanças pessoais',
    description: 'Controle de gastos com IA',
    unlock_date: '2026-12-01',
    created_at: new Date().toISOString(),
  },
]

export const mockPhrases: IdentityPhrase[] = [
  { id: '1', category: 'Execução', phrase: 'Eu termino o que construo.', streak_count: 3, created_at: new Date().toISOString() },
  { id: '2', category: 'Foco', phrase: 'Execução é minha vantagem competitiva.', streak_count: 1, created_at: new Date().toISOString() },
  { id: '3', category: 'Mentalidade', phrase: 'Foco é a habilidade mais rara.', streak_count: 0, created_at: new Date().toISOString() },
]

export const mockLogs: ExecutionLog[] = [
  { id: '1', log_date: new Date().toISOString().split('T')[0], tasks_completed_count: 2, worked_today: true, created_at: new Date().toISOString() },
]

export const mockStats: Stats = {
  tasks_done: 1,
  projects_done: 0,
  execution_days: 1,
}

export const mockStreak = 1
