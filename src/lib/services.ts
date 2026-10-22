import { supabase } from './supabase'
import { getUserId } from './userContext'
import {
  mockBooks, mockIdeas, mockInvestments, mockLogs, mockPhrases, mockProjects, mockStats, mockStreak, mockTasks,
} from './mockData'
import type { Book, ExecutionLog, IdentityPhrase, IdeaParking, InvestmentGoal, Project, ReadingLog, Stats, Task } from '../types'

const USE_MOCK = supabase === null

function localDateStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function uid() { return getUserId() }

// ── Projetos ──────────────────────────────────────────────────────────────────

export const ProjectService = {
  async getActive(): Promise<Project | null> {
    if (USE_MOCK) return mockProjects.find(p => p.status === 'active') ?? null

    const { data } = await supabase!
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .eq('user_id', uid())
      .maybeSingle()
    return data
  },

  async getAll(): Promise<Project[]> {
    if (USE_MOCK) return mockProjects

    const { data } = await supabase!.from('projects').select('*').eq('user_id', uid())
    return data ?? []
  },

  async complete(id: string): Promise<void> {
    if (USE_MOCK) {
      const p = mockProjects.find(p => p.id === id)
      if (p) p.status = 'completed'
      return
    }
    await supabase!.from('projects').update({ status: 'completed', progress: 100 }).eq('id', id).eq('user_id', uid())
  },

  async create(project: { title: string; objective?: string; definition_of_done?: string }): Promise<Project> {
    if (USE_MOCK) {
      const p: Project = { ...project, id: String(Date.now()), status: 'active', progress: 0, created_at: new Date().toISOString() }
      mockProjects.push(p)
      return p
    }
    const { data, error } = await supabase!
      .from('projects')
      .insert({ ...project, status: 'active', progress: 0, user_id: uid() })
      .select()
      .single()
    if (error) throw error
    return data
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
      .eq('user_id', uid())
      .order('created_at', { ascending: true })
    return data ?? []
  },

  async getAll(): Promise<Task[]> {
    if (USE_MOCK) return _mockTasks

    const { data } = await supabase!
      .from('tasks')
      .select('*')
      .eq('user_id', uid())
      .order('created_at', { ascending: true })
    return data ?? []
  },

  async create(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    if (USE_MOCK) {
      const newTask: Task = { ...task, id: String(Date.now()), created_at: new Date().toISOString() }
      _mockTasks.push(newTask)
      return newTask
    }

    const { data, error } = await supabase!.from('tasks').insert({ ...task, user_id: uid() }).select().single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      _mockTasks = _mockTasks.filter(t => t.id !== id)
      return
    }

    // Busca a tarefa antes de apagar para saber o status e projeto
    const { data: task } = await supabase!.from('tasks').select('status, project_id').eq('id', id).single()
    await supabase!.from('tasks').delete().eq('id', id)

    if (!task) return

    // Recalcula progresso do projeto
    if (task.project_id) {
      const { data: all } = await supabase!.from('tasks').select('status').eq('project_id', task.project_id)
      const progress = all && all.length > 0
        ? Math.round(all.filter(t => t.status === 'completed').length / all.length * 100)
        : 0
      await supabase!.from('projects').update({ progress }).eq('id', task.project_id)
    }

    // Se era concluída, decrementa o log de execução do dia
    if (task.status === 'completed') {
      const today = localDateStr()
      const { data: log } = await supabase!
        .from('execution_logs')
        .select('id, tasks_completed_count')
        .eq('log_date', today)
        .eq('user_id', uid())
        .maybeSingle()
      if (log && log.tasks_completed_count > 1) {
        await supabase!.from('execution_logs')
          .update({ tasks_completed_count: log.tasks_completed_count - 1 })
          .eq('id', log.id)
      } else if (log) {
        await supabase!.from('execution_logs').delete().eq('id', log.id)
      }
    }
  },

  async updateStatus(id: string, status: Task['status']): Promise<void> {
    if (USE_MOCK) {
      const t = _mockTasks.find(t => t.id === id)
      if (t) t.status = status
      return
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'completed') updateData.completed_at = localDateStr()
    await supabase!.from('tasks').update(updateData).eq('id', id)

    // Recalcula progresso do projeto
    const task = await supabase!.from('tasks').select('project_id').eq('id', id).single()
    if (!task.data?.project_id) return
    const projectId = task.data.project_id
    const { data: all } = await supabase!.from('tasks').select('status').eq('project_id', projectId)
    if (!all || all.length === 0) return
    const done = all.filter(t => t.status === 'completed').length
    const progress = Math.round((done / all.length) * 100)
    await supabase!.from('projects').update({ progress }).eq('id', projectId)

    // Registra log de execução do dia ao concluir uma tarefa
    if (status === 'completed') {
      const today = localDateStr()
      const { data: existing } = await supabase!
        .from('execution_logs')
        .select('id, tasks_completed_count')
        .eq('log_date', today)
        .eq('user_id', uid())
        .maybeSingle()

      if (existing) {
        await supabase!
          .from('execution_logs')
          .update({ tasks_completed_count: existing.tasks_completed_count + 1, worked_today: true })
          .eq('id', existing.id)
      } else {
        await supabase!
          .from('execution_logs')
          .insert({ log_date: today, tasks_completed_count: 1, worked_today: true, user_id: uid() })
      }
    }
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
      .eq('user_id', uid())
      .order('unlock_date', { ascending: true })
    return data ?? []
  },

  async create(idea: Omit<IdeaParking, 'id' | 'created_at'>): Promise<IdeaParking> {
    if (USE_MOCK) {
      const newIdea: IdeaParking = { ...idea, id: String(Date.now()), created_at: new Date().toISOString() }
      _mockIdeas.push(newIdea)
      return newIdea
    }

    const { data, error } = await supabase!.from('idea_parking').insert({ ...idea, user_id: uid() }).select().single()
    if (error) throw error
    return data
  },
}

// ── Frases de Identidade ──────────────────────────────────────────────────────

let _mockPhrases = mockPhrases.map(p => ({ ...p }))

export const IdentityService = {
  async getPhrases(): Promise<IdentityPhrase[]> {
    if (USE_MOCK) return _mockPhrases

    const { data } = await supabase!.from('identity_phrases').select('*').eq('user_id', uid())
    return data ?? []
  },

  async createPhrase(phrase: Omit<IdentityPhrase, 'id' | 'created_at' | 'last_repeated_date'>): Promise<IdentityPhrase> {
    if (USE_MOCK) {
      const newPhrase: IdentityPhrase = { ...phrase, id: String(Date.now()), created_at: new Date().toISOString() }
      _mockPhrases.push(newPhrase)
      return newPhrase
    }

    const { data, error } = await supabase!.from('identity_phrases').insert({ ...phrase, user_id: uid() }).select().single()
    if (error) throw error
    return data
  },

  async markRepeated(id: string): Promise<void> {
    const today = localDateStr()

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
      .eq('user_id', uid())
      .order('log_date', { ascending: false })
      .limit(60)
    if (!data) return 0

    let streak = 0
    const today = localDateStr()
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
      supabase!.from('tasks').select('id', { count: 'exact' }).eq('status', 'completed').eq('user_id', uid()),
      supabase!.from('projects').select('id', { count: 'exact' }).eq('status', 'completed').eq('user_id', uid()),
      supabase!.from('execution_logs').select('log_date').eq('worked_today', true).eq('user_id', uid()),
    ])

    return {
      tasks_done:     tasks.count    ?? 0,
      projects_done:  projects.count ?? 0,
      execution_days: new Set(logs.data?.map(r => r.log_date as string)).size,
    }
  },

  async getRecent(limit = 10): Promise<ExecutionLog[]> {
    if (USE_MOCK) return mockLogs.slice(0, limit)

    const [{ data: logs }, { data: tasks }] = await Promise.all([
      supabase!.from('execution_logs').select('*').eq('user_id', uid()).order('log_date', { ascending: false }).limit(limit),
      supabase!.from('tasks').select('title, completed_at, projects(title)').eq('status', 'completed').eq('user_id', uid()),
    ])

    if (!logs?.length) return []

    return logs.map(log => {
      const dayTasks = (tasks ?? []).filter((t: any) => t.completed_at === log.log_date)
      const projectName = (dayTasks[0] as any)?.projects?.title ?? undefined
      const taskTitles = dayTasks.map((t: any) => t.title as string)
      return { ...log, project_name: projectName, completed_tasks: taskTitles }
    })
  },
}

// ── Livros ────────────────────────────────────────────────────────────────────

let _mockBooks = mockBooks.map(b => ({ ...b }))

export const BookService = {
  async getActive(): Promise<Book | null> {
    if (USE_MOCK) return _mockBooks.find(b => b.status === 'active') ?? null
    const { data } = await supabase!.from('books').select('*').eq('status', 'active').eq('user_id', uid()).order('created_at', { ascending: false }).limit(1).maybeSingle()
    return data ?? null
  },

  async getAll(): Promise<Book[]> {
    if (USE_MOCK) return _mockBooks
    const { data } = await supabase!.from('books').select('*').eq('user_id', uid()).order('created_at', { ascending: false })
    return data ?? []
  },

  async create(book: Omit<Book, 'id' | 'created_at' | 'pages_read' | 'status'>): Promise<Book> {
    if (USE_MOCK) {
      const b: Book = { ...book, id: String(Date.now()), pages_read: 0, status: 'active', created_at: new Date().toISOString() }
      _mockBooks.push(b)
      return b
    }
    const { data, error } = await supabase!.from('books').insert({ ...book, pages_read: 0, status: 'active', user_id: uid() }).select().single()
    if (error) throw error
    return data
  },

  async logReading(bookId: string, pagesRead: number): Promise<void> {
    if (USE_MOCK) {
      const b = _mockBooks.find(b => b.id === bookId)
      if (b) b.pages_read = Math.min(b.total_pages, b.pages_read + pagesRead)
      return
    }
    const today = localDateStr()
    const { data: existing } = await supabase!.from('reading_logs').select('id, pages_read').eq('book_id', bookId).eq('log_date', today).single()
    if (existing) {
      await supabase!.from('reading_logs').update({ pages_read: existing.pages_read + pagesRead }).eq('id', existing.id)
    } else {
      await supabase!.from('reading_logs').insert({ book_id: bookId, log_date: today, pages_read: pagesRead, user_id: uid() })
    }
    // Atualiza total de páginas lidas no livro
    const { data: logs } = await supabase!.from('reading_logs').select('pages_read').eq('book_id', bookId)
    const total = (logs ?? []).reduce((sum, l) => sum + l.pages_read, 0)
    const { data: book } = await supabase!.from('books').select('total_pages').eq('id', bookId).single()
    const pages_read = Math.min(total, book?.total_pages ?? total)
    await supabase!.from('books').update({ pages_read }).eq('id', bookId)
    if (book && pages_read >= book.total_pages) {
      await supabase!.from('books').update({ status: 'completed' }).eq('id', bookId)
    }
  },

  async getRecentLogs(bookId: string, limit = 7): Promise<ReadingLog[]> {
    if (USE_MOCK) return []
    const { data } = await supabase!.from('reading_logs').select('*').eq('book_id', bookId).order('log_date', { ascending: false }).limit(limit)
    return data ?? []
  },

  async saveNotes(bookId: string, notes: string): Promise<void> {
    if (USE_MOCK) return
    await supabase!.from('books').update({ notes }).eq('id', bookId)
  },
}

// ── Investimentos ─────────────────────────────────────────────────────────────

let _mockInvestments = mockInvestments.map(i => ({ ...i }))

export const InvestmentService = {
  async getAll(): Promise<InvestmentGoal[]> {
    if (USE_MOCK) return _mockInvestments
    const { data } = await supabase!.from('investment_goals').select('*').eq('user_id', uid()).order('created_at', { ascending: true })
    return data ?? []
  },

  async create(goal: Omit<InvestmentGoal, 'id' | 'created_at' | 'current_amount' | 'status'>): Promise<InvestmentGoal> {
    if (USE_MOCK) {
      const g: InvestmentGoal = { ...goal, id: String(Date.now()), current_amount: 0, status: 'active', created_at: new Date().toISOString() }
      _mockInvestments.push(g)
      return g
    }
    const { data, error } = await supabase!.from('investment_goals').insert({ ...goal, current_amount: 0, status: 'active', user_id: uid() }).select().single()
    if (error) throw error
    return data
  },

  async addContribution(id: string, amount: number): Promise<InvestmentGoal> {
    if (USE_MOCK) {
      const g = _mockInvestments.find(g => g.id === id)
      if (g) {
        g.current_amount = Math.min(g.target_amount, g.current_amount + amount)
        if (g.current_amount >= g.target_amount) g.status = 'completed'
      }
      return g!
    }
    const { data: goal } = await supabase!.from('investment_goals').select('current_amount, target_amount').eq('id', id).single()
    if (!goal) throw new Error('Meta não encontrada')
    const current_amount = Math.min(goal.target_amount, goal.current_amount + amount)
    const status = current_amount >= goal.target_amount ? 'completed' : 'active'
    const { data, error } = await supabase!.from('investment_goals').update({ current_amount, status }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
}
