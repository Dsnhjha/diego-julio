import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')  ?? ''
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')    ?? ''
const SUPABASE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const APP_URL         = Deno.env.get('APP_URL')         ?? 'https://diego-julio.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { projectId, invitedEmail, invitedBy } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Busca o token do convite recém-criado
    const { data: invite } = await supabase
      .from('project_invites')
      .select('token, project_id')
      .eq('project_id', projectId)
      .eq('invited_email', invitedEmail)
      .eq('invited_by', invitedBy)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!invite) throw new Error('Convite não encontrado')

    // Busca nome do projeto
    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single()

    const projectTitle = project?.title ?? 'um projeto'
    const inviteLink   = `${APP_URL}?invite=${invite.token}`

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0e11;font-family:'Inter',Arial,sans-serif;color:#e4e6ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0e11;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#181b22;border:1px solid #252830;border-radius:8px;overflow:hidden;max-width:100%;">

        <tr>
          <td style="background:#f0a500;padding:24px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#0d0e11;font-weight:700;">Convite para projeto compartilhado</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 8px;font-size:48px;line-height:1;">👥</p>
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#f0a500;">Você foi convidado</h1>
            <h2 style="margin:0 0 24px;font-size:18px;font-weight:600;color:#e4e6ed;">${projectTitle}</h2>

            <div style="border-left:3px solid #f0a500;padding:12px 16px;background:#13151a;border-radius:0 4px 4px 0;margin-bottom:32px;">
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                Alguém te convidou para acompanhar e compartilhar o progresso do projeto <strong style="color:#e4e6ed;">${projectTitle}</strong>.
                Vocês vão ver a evolução um do outro em tempo real.
              </p>
            </div>

            <a href="${inviteLink}" style="display:inline-block;background:#f0a500;color:#0d0e11;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:700;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;">
              Aceitar convite →
            </a>

            <p style="margin:24px 0 0;font-size:12px;color:#3d4252;">
              Ou copie o link: ${inviteLink}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px;border-top:1px solid #252830;">
            <p style="margin:0;font-size:11px;color:#3d4252;letter-spacing:0.06em;">diego-julio.vercel.app · Crescimento lado a lado</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'Diego Júlio <onboarding@resend.dev>',
        to:      [invitedEmail],
        subject: `👥 Você foi convidado para "${projectTitle}"`,
        html,
      }),
    })

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)

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
