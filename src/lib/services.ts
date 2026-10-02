import { supabase } from './supabase'
import {
  mockIdeas, mockLogs, mockPhrases, mockProjects, mockStats, mockStreak, mockTasks,
} from './mockData'
import type { ExecutionLog, IdentityPhrase, IdeaParking, Project, Stats, Task } from '../types'

const USE_MOCK = supabase === null

// ── Projetos ──────────────────────────────────────────────────────────────────

export const ProjectService = {
  async getActive(): Promise<Project | null> {
    if (USE_MOCK) return mockProjects.find(p => p.status === 'active') ?? null

    const { data } = await supabase!
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .single()
    return data
  },

  async getAll(): Promise<Project[]> {
    if (USE_MOCK) return mockProjects

    const { data } = await supabase!.from('projects').select('*')
    return data ?? []
  },
}

// ── Tarefas ───────────────────────────────────────────────────────────────────

let _mockTasks = [...mockTasks]

export const TaskService = {
  async getByProject(projectId: string): Promise<Task[]> {
    if (USE_MOCK) return _mockTasks.filter(t => t.project_id === projectId)

    const { data } = await supabase!
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    return data ?? []
  },

  async getAll(): Promise<Task[]> {
    if (USE_MOCK) return _mockTasks

    const { data } = await supabase!
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    return data ?? []
  },

  async create(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    if (USE_MOCK) {
      const newTask: Task = { ...task, id: String(Date.now()), created_at: new Date().toISOString() }
      _mockTasks.push(newTask)
      return newTask
    }

    const { data, error } = await supabase!.from('tasks').insert(task).select().single()
    if (error) throw error
    return data
  },

  async updateStatus(id: string, status: Task['status']): Promise<void> {
    if (USE_MOCK) {
      const t = _mockTasks.find(t => t.id === id)
      if (t) t.status = status
      return
    }

    await supabase!.from('tasks').update({ status }).eq('id', id)
  },
}

// ── Estacionamento de Ideias ──────────────────────────────────────────────────

let _mockIdeas = [...mockIdeas]

export const IdeaParkingService = {
  async getAll(): Promise<IdeaParking[]> {
    if (USE_MOCK) return _mockIdeas

    const { data } = await supabase!
      .from('idea_parking')
      .select('*')
      .order('unlock_date', { ascending: true })
    return data ?? []
  },

  async create(idea: Omit<IdeaParking, 'id' | 'created_at'>): Promise<IdeaParking> {
    if (USE_MOCK) {
      const newIdea: IdeaParking = { ...idea, id: String(Date.now()), created_at: new Date().toISOString() }
      _mockIdeas.push(newIdea)
      return newIdea
    }

    const { data, error } = await supabase!.from('idea_parking').insert(idea).select().single()
    if (error) throw error
    return data
  },
}

// ── Frases de Identidade ──────────────────────────────────────────────────────

let _mockPhrases = mockPhrases.map(p => ({ ...p }))

export const IdentityService = {
  async getPhrases(): Promise<IdentityPhrase[]> {
    if (USE_MOCK) return _mockPhrases

    const { data } = await supabase!.from('identity_phrases').select('*')
    return data ?? []
  },

  async createPhrase(phrase: Omit<IdentityPhrase, 'id' | 'created_at' | 'last_repeated_date'>): Promise<IdentityPhrase> {
    if (USE_MOCK) {
      const newPhrase: IdentityPhrase = { ...phrase, id: String(Date.now()), created_at: new Date().toISOString() }
      _mockPhrases.push(newPhrase)
      return newPhrase
    }

    const { data, error } = await supabase!.from('identity_phrases').insert(phrase).select().single()
    if (error) throw error
    return data
  },

  async markRepeated(id: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    if (USE_MOCK) {
      const p = _mockPhrases.find(p => p.id === id)
      if (p && p.last_repeated_date !== today) {
        p.streak_count++
        p.last_repeated_date = today
      }
      return
    }

    const { data } = await supabase!
      .from('identity_phrases')
      .select('last_repeated_date, streak_count')
      .eq('id', id)
      .single()

    if (!data) return
    if (data.last_repeated_date === today) return

    await supabase!
      .from('identity_phrases')
      .update({ last_repeated_date: today, streak_count: (data.streak_count ?? 0) + 1 })
      .eq('id', id)
  },
}

// ── Logs de Execução e Estatísticas ──────────────────────────────────────────

export const ExecutionLogService = {
  async getStreak(): Promise<number> {
    if (USE_MOCK) return mockStreak

    const { data } = await supabase!
      .from('execution_logs')
      .select('log_date')
      .eq('worked_today', true)
      .order('log_date', { ascending: false })
      .limit(60)
    if (!data) return 0

    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const dates = [...new Set(data.map(r => r.log_date as string))].sort().reverse()
    let expected = today
    for (const d of dates) {
      if (d === expected) {
        streak++
        const dt = new Date(expected)
        dt.setDate(dt.getDate() - 1)
        expected = dt.toISOString().split('T')[0]
      } else break
    }
    return streak
  },

  async getStats(): Promise<Stats> {
    if (USE_MOCK) return mockStats

    const [tasks, projects, logs] = await Promise.all([
      supabase!.from('tasks').select('id', { count: 'exact' }).eq('status', 'completed'),
      supabase!.from('projects').select('id', { count: 'exact' }).eq('status', 'completed'),
      supabase!.from('execution_logs').select('log_date').eq('worked_today', true),
    ])

    return {
      tasks_done:     tasks.count    ?? 0,
      projects_done:  projects.count ?? 0,
      execution_days: new Set(logs.data?.map(r => r.log_date as string)).size,
    }
  },

  async getRecent(limit = 10): Promise<ExecutionLog[]> {
    if (USE_MOCK) return mockLogs.slice(0, limit)

    const { data } = await supabase!
      .from('execution_logs')
      .select('*')
      .order('log_date', { ascending: false })
      .limit(limit)
    return data ?? []
  },
}
