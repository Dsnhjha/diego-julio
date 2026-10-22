import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')        ?? ''
const TO_EMAIL         = Deno.env.get('NOTIFY_EMAIL')          ?? ''
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')          ?? ''
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Coleta dados da semana
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    const [project, logs, book, investments] = await Promise.all([
      supabase.from('projects').select('title, progress').eq('status', 'active').limit(1).single(),
      supabase.from('execution_logs').select('log_date, tasks_completed_count').gte('log_date', weekAgoStr).eq('worked_today', true),
      supabase.from('books').select('title, pages_read, total_pages').eq('status', 'active').limit(1).single(),
      supabase.from('investment_goals').select('title, current_amount, target_amount').eq('status', 'active'),
    ])

    const diasTrabalhados  = logs.data?.length ?? 0
    const tarefasSemana    = logs.data?.reduce((s, l) => s + l.tasks_completed_count, 0) ?? 0
    const projetoAtivo     = project.data
    const livroAtivo       = book.data
    const metasAtivas      = investments.data ?? []

    // Calcula streak atual
    const { data: allLogs } = await supabase
      .from('execution_logs')
      .select('log_date')
      .eq('worked_today', true)
      .order('log_date', { ascending: false })
      .limit(60)

    let streak = 0
    if (allLogs) {
      const today = new Date().toISOString().split('T')[0]
      const dates = [...new Set(allLogs.map(r => r.log_date as string))].sort().reverse()
      let expected = today
      for (const d of dates) {
        if (d === expected) {
          streak++
          const dt = new Date(expected)
          dt.setDate(dt.getDate() - 1)
          expected = dt.toISOString().split('T')[0]
        } else break
      }
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0e11;font-family:'Inter',Arial,sans-serif;color:#e4e6ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0e11;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#181b22;border:1px solid #252830;border-radius:8px;overflow:hidden;max-width:100%;">

        <tr>
          <td style="background:#f0a500;padding:24px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#0d0e11;font-weight:700;">Diego Júlio · Resumo Semanal</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 32px;">
            <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#f0a500;">Semana em Números</h1>
            <p style="margin:0 0 32px;font-size:13px;color:#6b7280;">Prova da mudança de identidade.</p>

            <!-- Stats da semana -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td width="33%" style="text-align:center;padding:16px 8px;background:#13151a;border:1px solid #252830;border-radius:4px;">
                  <p style="margin:0;font-size:32px;font-weight:700;color:#f0a500;font-variant-numeric:tabular-nums;">${diasTrabalhados}</p>
                  <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">Dias ativos</p>
                </td>
                <td width="4%"></td>
                <td width="33%" style="text-align:center;padding:16px 8px;background:#13151a;border:1px solid #252830;border-radius:4px;">
                  <p style="margin:0;font-size:32px;font-weight:700;color:#e4e6ed;font-variant-numeric:tabular-nums;">${tarefasSemana}</p>
                  <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">Tarefas</p>
                </td>
                <td width="4%"></td>
                <td width="33%" style="text-align:center;padding:16px 8px;background:#13151a;border:1px solid #252830;border-radius:4px;">
                  <p style="margin:0;font-size:32px;font-weight:700;color:#34d27b;font-variant-numeric:tabular-nums;">${streak}</p>
                  <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">Streak atual</p>
                </td>
              </tr>
            </table>

            ${projetoAtivo ? `
            <!-- Projeto -->
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;font-family:monospace;">Projeto Ativo</p>
            <div style="background:#13151a;border:1px solid #252830;border-radius:4px;padding:16px;margin-bottom:20px;">
              <p style="margin:0 0 8px;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">${projetoAtivo.title}</p>
              <div style="height:6px;background:#252830;border-radius:2px;overflow:hidden;">
                <div style="height:100%;width:${projetoAtivo.progress}%;background:#f0a500;border-radius:2px;"></div>
              </div>
              <p style="margin:6px 0 0;font-size:12px;color:#f0a500;font-family:monospace;">${projetoAtivo.progress}%</p>
            </div>` : ''}

            ${livroAtivo ? `
            <!-- Livro -->
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;font-family:monospace;">Leitura Atual</p>
            <div style="background:#13151a;border:1px solid #252830;border-radius:4px;padding:16px;margin-bottom:20px;">
              <p style="margin:0 0 8px;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">${livroAtivo.title}</p>
              <div style="height:6px;background:#252830;border-radius:2px;overflow:hidden;">
                <div style="height:100%;width:${Math.round(livroAtivo.pages_read / livroAtivo.total_pages * 100)}%;background:#f0a500;border-radius:2px;"></div>
              </div>
              <p style="margin:6px 0 0;font-size:12px;color:#f0a500;font-family:monospace;">${livroAtivo.pages_read} / ${livroAtivo.total_pages} páginas</p>
            </div>` : ''}

            ${metasAtivas.length > 0 ? `
            <!-- Investimentos -->
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;font-family:monospace;">Metas Financeiras</p>
            <div style="background:#13151a;border:1px solid #252830;border-radius:4px;padding:16px;margin-bottom:20px;">
              ${metasAtivas.map(m => {
                const pct = Math.round(m.current_amount / m.target_amount * 100)
                const current = m.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                const target  = m.target_amount.toLocaleString('pt-BR',  { style: 'currency', currency: 'BRL' })
                return `
                <p style="margin:0 0 6px;font-size:13px;font-weight:600;">${m.title}</p>
                <div style="height:6px;background:#252830;border-radius:2px;overflow:hidden;margin-bottom:4px;">
                  <div style="height:100%;width:${pct}%;background:#34d27b;border-radius:2px;"></div>
                </div>
                <p style="margin:0 0 12px;font-size:11px;color:#34d27b;font-family:monospace;">${current} / ${target}</p>`
              }).join('')}
            </div>` : ''}

            <div style="border-left:3px solid #f0a500;padding:12px 16px;background:#13151a;border-radius:0 4px 4px 0;">
              <p style="margin:0;font-size:13px;color:#6b7280;font-family:monospace;letter-spacing:0.06em;text-transform:uppercase;">EU TERMINO O QUE CONSTRUO.</p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px;border-top:1px solid #252830;">
            <p style="margin:0;font-size:11px;color:#3d4252;letter-spacing:0.06em;">diego-julio.vercel.app · Resumo automático semanal</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'Diego Júlio <onboarding@resend.dev>',
        to:      [TO_EMAIL],
        subject: `📊 Resumo semanal — ${diasTrabalhados} dias ativos, streak de ${streak}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error: ${err}`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status:  500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
