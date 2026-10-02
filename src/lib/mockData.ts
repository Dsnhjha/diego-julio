import type { ExecutionLog, IdentityPhrase, IdeaParking, Project, Stats, Task } from '../types'

export const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Plataforma de Freelancers',
    status: 'active',
    tasks_total: 18,
    tasks_done: 14,
    finish_line: 'MVP publicado e primeiro cliente pagando',
    started_at: '2026-08-15',
  },
]

export const mockTasks: Task[] = [
  { id: 1, project_id: 1, title: 'Design do sistema de pagamentos',  status: 'done',    priority: 'high', created_at: '2026-09-01' },
  { id: 2, project_id: 1, title: 'Integração com Stripe',            status: 'done',    priority: 'high', created_at: '2026-09-05' },
  { id: 3, project_id: 1, title: 'Tela de perfil do freelancer',     status: 'done',    priority: 'med',  created_at: '2026-09-08' },
  { id: 4, project_id: 1, title: 'Sistema de reviews e avaliações',  status: 'done',    priority: 'med',  created_at: '2026-09-10' },
  { id: 5, project_id: 1, title: 'Testes de integração (E2E)',        status: 'active',  priority: 'high', created_at: '2026-09-20' },
  { id: 6, project_id: 1, title: 'Configurar CI/CD no GitHub',        status: 'active',  priority: 'med',  created_at: '2026-09-22' },
  { id: 7, project_id: 1, title: 'Landing page + SEO básico',         status: 'backlog', priority: 'med',  created_at: '2026-09-25' },
  { id: 8, project_id: 1, title: 'Onboarding do primeiro cliente',    status: 'backlog', priority: 'high', created_at: '2026-09-25' },
  { id: 9, project_id: 1, title: 'Deploy em produção',                status: 'backlog', priority: 'high', created_at: '2026-09-26' },
]

export const mockIdeas: IdeaParking[] = [
  { id: 1, title: 'App de meditação para devs',          description: 'Sessões curtas de 5 min com foco em clareza mental antes de codar.',  available_at: '2026-11-01' },
  { id: 2, title: 'SaaS de notas de reunião com IA',     description: 'Transcrição automática + resumo de action items para times remotos.', available_at: '2026-12-15' },
  { id: 3, title: 'Curso online de freelancing técnico', description: 'Do primeiro cliente até escalar para R$15k/mês.',                      available_at: '2027-01-10' },
]

export const mockPhrases: IdentityPhrase[] = [
  { id: 1, phrase: 'A parte difícil não é sinal para desistir. É parte do processo.', streak: 14, done_today: false },
  { id: 2, phrase: 'Eu não espero motivação. Eu executo e a motivação vem depois.',   streak: 9,  done_today: false },
  { id: 3, phrase: 'Cada tarefa concluída é uma prova de quem estou me tornando.',    streak: 21, done_today: true  },
  { id: 4, phrase: 'Projetos inacabados não existem no meu vocabulário.',             streak: 6,  done_today: false },
]

export const mockLogs: ExecutionLog[] = [
  { id: 1, date: '2026-10-01', type: 'task',    description: 'Configurar CI/CD no GitHub',  project: 'Plataforma de Freelancers' },
  { id: 2, date: '2026-09-30', type: 'task',    description: 'Testes de integração (E2E)',  project: 'Plataforma de Freelancers' },
  { id: 3, date: '2026-09-29', type: 'task',    description: 'Sistema de reviews',           project: 'Plataforma de Freelancers' },
  { id: 4, date: '2026-09-28', type: 'project', description: 'Auth MVP concluído',            project: 'Plataforma de Freelancers' },
  { id: 5, date: '2026-09-27', type: 'task',    description: 'Tela de perfil do freelancer', project: 'Plataforma de Freelancers' },
]

export const mockStats: Stats = {
  tasks_done: 47,
  projects_done: 2,
  execution_days: 34,
}

export const mockStreak = 12
