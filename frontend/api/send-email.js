export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { to, subject, html } = req.body

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ClearOffer <noreply@clearoffer.org>',
        to,
        subject,
        html,
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Send failed' })
    res.status(200).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
