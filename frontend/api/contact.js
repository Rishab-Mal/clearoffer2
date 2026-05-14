export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, message, name } = req.body || {}
  if (!email || !message) return res.status(400).json({ error: 'Email and message are required.' })

  const resendKey = process.env.RESEND_API_KEY
  const contactEmail = process.env.CONTACT_EMAIL
  if (!resendKey || !contactEmail) return res.status(500).json({ error: 'Server misconfigured.' })

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ClearOffer Contact <noreply@clearoffer.org>',
      to: contactEmail,
      reply_to: email,
      subject: `ClearOffer contact: ${name || email}`,
      html: `
        <p><strong>From:</strong> ${name ? `${name} &lt;${email}&gt;` : email}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      `,
    }),
  })

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}))
    return res.status(500).json({ error: err.message || 'Failed to send.' })
  }

  res.status(200).json({ ok: true })
}
