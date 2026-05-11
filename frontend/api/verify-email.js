const crypto = require('crypto')

module.exports = async function handler(req, res) {
  const token = req.query.token
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`

  if (!token) return res.redirect(`${appUrl}/auth?error=missing-token`)

  const secret = process.env.VERIFICATION_SECRET
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret || !supabaseUrl || !serviceRoleKey) {
    return res.redirect(`${appUrl}/auth?error=server-error`)
  }

  const parts = token.split('.')
  if (parts.length !== 3) return res.redirect(`${appUrl}/auth?error=invalid-token`)

  const [userId, expiry, hmac] = parts

  if (Date.now() > Number(expiry)) return res.redirect(`${appUrl}/auth?error=expired-token`)

  const payload = `${userId}.${expiry}`
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  let valid = false
  try {
    valid = crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return res.redirect(`${appUrl}/auth?error=invalid-token`)
  }
  if (!valid) return res.redirect(`${appUrl}/auth?error=invalid-token`)

  const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ email_verified: true }),
  })

  if (!updateRes.ok) return res.redirect(`${appUrl}/auth?error=update-failed`)

  res.redirect(`${appUrl}/auth?verified=true`)
}
