import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const TO_EMAIL       = Deno.env.get('NOTIFY_EMAIL')   ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  type: 'project' | 'book' | 'investment'
  title: string
  extra?: string
}

function buildHtml(type: EmailPayload['type'], title: string, extra?: string): string {
  const icons   = { project: '🏆', book: '📚', investment: '💰' }
  const labels  = { project: 'Projeto Concluído', book: 'Livro Concluído', investment: 'Meta Atingida' }
  const icon    = icons[type]
  const label   = labels[type]

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0e11;font-family:'Inter',Arial,sans-serif;color:#e4e6ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0e11;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#181b22;border:1px solid #252830;border-radius:8px;overflow:hidden;max-width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#f0a500;padding:24px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#0d0e11;font-weight:700;">Diego Júlio · Sistema de Identidade</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 8px;font-size:48px;line-height:1;">${icon}</p>
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#f0a500;">${label}</h1>
            <h2 style="margin:0 0 24px;font-size:18px;font-weight:600;color:#e4e6ed;">${title}</h2>

            <div style="border-left:3px solid #f0a500;padding:12px 16px;background:#13151a;border-radius:0 4px 4px 0;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#6b7280;font-family:monospace;letter-spacing:0.06em;text-transform:uppercase;">EU TERMINO O QUE CONSTRUO.</p>
            </div>

            ${extra ? `<p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">${extra}</p>` : ''}

            <p style="margin:0;font-size:13px;color:#3d4252;">Isso é prova. Continue.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #252830;">
            <p style="margin:0;font-size:11px;color:#3d4252;letter-spacing:0.06em;">diego-julio.vercel.app · Sistema pessoal de comportamento</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: EmailPayload = await req.json()

    const subjects = {
      project:    `🏆 Projeto concluído: ${payload.title}`,
      book:       `📚 Livro concluído: ${payload.title}`,
      investment: `💰 Meta atingida: ${payload.title}`,
    }

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'Diego Júlio <onboarding@resend.dev>',
        to:      [TO_EMAIL],
        subject: subjects[payload.type],
        html:    buildHtml(payload.type, payload.title, payload.extra),
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
