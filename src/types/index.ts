export interface Project {
  id: number
  name: string
  status: 'active' | 'completed' | 'archived'
  tasks_total: number
  tasks_done: number
  finish_line: string
  started_at: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  status: 'backlog' | 'active' | 'done'
  priority: 'high' | 'med' | 'low'
  created_at: string
}

export interface IdeaParking {
  id: number
  title: string
  description: string
  available_at: string
}

export interface IdentityPhrase {
  id: number
  phrase: string
  streak: number
  done_today: boolean
}

export interface ExecutionLog {
  id: number
  date: string
  type: 'task' | 'project'
  description: string
  project: string
}

export interface Stats {
  tasks_done: number
  projects_done: number
  execution_days: number
}
