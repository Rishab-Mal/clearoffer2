import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  // Verify the user's JWT to get their ID
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' })

  const uid = user.id

  // Step 1: Clean up all public table FK references via RPC
  const { error: cleanupErr } = await supabaseAdmin.rpc('cleanup_user_data', { target_uid: uid })
  if (cleanupErr) return res.status(500).json({ error: 'Cleanup failed: ' + cleanupErr.message })

  // Step 2: Let GoTrue delete the auth user + auth.* tables
  const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(uid)
  if (deleteErr) return res.status(500).json({ error: 'Failed to delete user: ' + deleteErr.message })

  res.status(200).json({ success: true })
}
