import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  // Use the user's own token — the RPC runs as them via auth.uid()
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { error } = await supabase.rpc('delete_my_account')

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ success: true })
}
