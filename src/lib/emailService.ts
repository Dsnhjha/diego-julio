import { supabase } from './supabase'

type EmailType = 'project' | 'book' | 'investment'

export async function sendCompletionEmail(type: EmailType, title: string, extra?: string) {
  if (!supabase) return

  try {
    await supabase.functions.invoke('send-email', {
      body: { type, title, extra },
    })
  } catch {
    // silencia — e-mail é secundário, não deve quebrar o fluxo
  }
}
