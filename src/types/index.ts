export interface Project {
  id: string
  title: string
  objective?: string
  definition_of_done?: string
  status: 'active' | 'completed' | 'paused' | 'parking'
  progress: number
  target_date?: string
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  status: 'backlog' | 'in_progress' | 'completed'
  due_date?: string
  created_at: string
}

export interface IdeaParking {
  id: string
  title: string
  description?: string
  unlock_date: string
  created_at: string
}

export interface IdentityPhrase {
  id: string
  category: string
  phrase: string
  last_repeated_date?: string
  streak_count: number
  created_at: string
}

export interface ExecutionLog {
  id: string
  log_date: string
  tasks_completed_count: number
  worked_today: boolean
  created_at: string
  project_name?: string
  completed_tasks?: string[]
}

export interface Stats {
  tasks_done: number
  projects_done: number
  execution_days: number
}

export interface Book {
  id: string
  title: string
  author?: string
  total_pages: number
  pages_read: number
  status: 'active' | 'completed'
  created_at: string
  notes?: string
}

export interface ReadingLog {
  id: string
  book_id: string
  log_date: string
  pages_read: number
  created_at: string
}

export interface InvestmentGoal {
  id: string
  title: string
  horizon: string
  target_amount: number
  current_amount: number
  status: 'active' | 'completed'
  created_at: string
}
