import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, email, name } = req.body || {}
  if (!userId || !email) return res.status(400).json({ error: 'Missing fields' })

  const secret = process.env.VERIFICATION_SECRET
  const resendKey = process.env.RESEND_API_KEY
  if (!secret || !resendKey) return res.status(500).json({ error: 'Server misconfigured' })

  const expiry = Date.now() + 24 * 60 * 60 * 1000
  const payload = `${userId}.${expiry}`
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const token = `${payload}.${hmac}`

  const appUrl = process.env.APP_URL || `https://${req.headers.host}`
  const verifyUrl = `${appUrl}/api/verify-email?token=${encodeURIComponent(token)}`

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ClearOffer <noreply@clearoffer.org>',
      to: email,
      subject: 'Verify your ClearOffer account',
      html: buildHtml(name || 'there', verifyUrl),
    }),
  })

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}))
    return res.status(500).json({ error: err.message || 'Failed to send email' })
  }

  res.status(200).json({ ok: true })
}

function buildHtml(name, verifyUrl) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,system-ui,sans-serif">
<div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <div style="background:#08080E;padding:24px 32px;display:flex;align-items:center;gap:8px">
    <span style="color:#F59E0B;font-size:18px">&#10022;</span>
    <span style="color:white;font-weight:900;font-size:16px;letter-spacing:-0.5px">CLEAROFFER</span>
  </div>
  <div style="padding:32px">
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:900">Verify your email</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px">
      Hey ${name}, click the button below to verify your ClearOffer account. This link expires in 24 hours.
    </p>
    <a href="${verifyUrl}" style="display:inline-block;background:#F59E0B;color:#000;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none">
      Verify my email
    </a>
    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">
      If you didn't create a ClearOffer account, you can ignore this email.
    </p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px">
    <p style="margin:0;color:#94a3b8;font-size:12px">&copy; 2026 ClearOffer &middot; <a href="https://clearoffer.org" style="color:#94a3b8">clearoffer.org</a></p>
  </div>
</div>
</body>
</html>`
}
