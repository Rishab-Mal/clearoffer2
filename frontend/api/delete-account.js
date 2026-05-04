import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verify the caller is actually logged in by checking their JWT
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' })

  const uid = user.id

  try {
    // Anonymize reviews so content stays but identity is removed
    await supabaseAdmin.from('reviews')
      .update({ anonymous: true, show_university: false })
      .eq('user_id', uid)

    // Delete user-specific data
    await supabaseAdmin.from('review_votes').delete().eq('user_id', uid)
    await supabaseAdmin.from('saved_companies').delete().eq('user_id', uid)
    await supabaseAdmin.from('job_alerts').delete().eq('user_id', uid)
    await supabaseAdmin.from('reports').delete().eq('reporter_id', uid)
    await supabaseAdmin.from('profiles').delete().eq('id', uid)

    // Delete the auth user
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(uid)
    if (deleteErr) return res.status(500).json({ error: deleteErr.message })

    res.status(200).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
