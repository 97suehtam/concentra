// Exclui a conta de quem chama (direito de eliminação, LGPD art. 18).
// Apaga as fotos do bucket 'avatares' e o usuário do Auth. Perfil, favoritos, conexões e
// bloqueios saem junto (on delete cascade); denúncias feitas ficam sem autor (on delete set null).
// A service role só existe aqui dentro, nunca no app.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return responder({ erro: 'Use POST' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return responder({ erro: 'Sem sessão' }, 401)

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return responder({ erro: 'Sessão inválida' }, 401)

  // Fotos primeiro: o Storage não apaga sozinho quando o usuário some
  const { data: fotos } = await admin.storage.from('avatares').list(user.id)
  if (fotos?.length) await admin.storage.from('avatares').remove(fotos.map((f) => `${user.id}/${f.name}`))

  const { error: erroExclusao } = await admin.auth.admin.deleteUser(user.id)
  if (erroExclusao) return responder({ erro: erroExclusao.message }, 500)

  return responder({ ok: true })
})
