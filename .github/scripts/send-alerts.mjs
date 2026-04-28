import { createClient } from '@supabase/supabase-js'

const LISTINGS_URL =
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function emailHtml(name, job) {
  const location = job.locations?.slice(0, 2).join(', ') || 'Multiple locations'
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,system-ui,sans-serif">
<div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <div style="background:#08080E;padding:24px 32px;display:flex;align-items:center;gap:8px">
    <span style="color:#F59E0B;font-size:18px">✦</span>
    <span style="color:white;font-weight:900;font-size:16px;letter-spacing:-0.5px">CLEAROFFER</span>
  </div>
  <div style="padding:32px">
    <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Job Alert</p>
    <h2 style="margin:0 0 4px;color:#0f172a;font-size:22px;font-weight:900">New role at ${job.company_name}</h2>
    <p style="margin:0 0 24px;color:#475569;font-size:14px">Hey ${name}, a new internship just dropped. Be one of the first to apply.</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 4px;color:#0f172a;font-weight:700;font-size:16px">${job.title}</p>
      <p style="margin:0 0 12px;color:#64748b;font-size:14px">${job.company_name}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <span style="color:#475569;font-size:13px">📍 ${location}</span>
        ${job.terms?.length ? `<span style="color:#475569;font-size:13px">📅 ${job.terms[0]}</span>` : ''}
        ${job.sponsorship === 'Offers Sponsorship' ? `<span style="color:#16a34a;font-size:13px;font-weight:600">✓ Sponsors visa</span>` : ''}
      </div>
    </div>

    <a href="${job.url}" style="display:block;background:#F59E0B;color:black;font-weight:700;font-size:15px;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none">
      Apply now →
    </a>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;text-align:center">
      Early applications significantly improve your chances. This role was just posted.
    </p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
    <span style="color:#94a3b8;font-size:12px">© 2025 ClearOffer</span>
    <span style="color:#94a3b8;font-size:12px">You're receiving this because you subscribed to ${job.company_name} alerts.</span>
  </div>
</div>
</body>
</html>`
}

async function sendEmail(to, name, job) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ClearOffer Alerts <alerts@clearoffer.org>',
      to,
      subject: `🔔 ${job.company_name} just posted: ${job.title}`,
      html: emailHtml(name, job),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`Failed to send to ${to}:`, err)
  }
}

async function main() {
  console.log('Fetching SimplifyJobs listings...')
  const listings = await fetch(LISTINGS_URL).then(r => r.json())
  const active = listings.filter(l => l.active && l.is_visible)
  console.log(`${active.length} active listings`)

  // Get all subscriptions with user email + name
  const { data: alerts, error: alertErr } = await supabase
    .from('job_alerts')
    .select('user_id, company_name, profiles(email, name)')
  if (alertErr) { console.error('Failed to fetch alerts:', alertErr); return }
  if (!alerts?.length) { console.log('No alerts configured.'); return }

  const subscribedCompanies = new Set(alerts.map(a => a.company_name.toLowerCase()))

  // Find relevant new jobs
  const relevant = active.filter(job => subscribedCompanies.has(job.company_name.toLowerCase()))
  console.log(`${relevant.length} jobs match subscribed companies`)

  // Get already-notified job IDs
  const { data: notified } = await supabase.from('notified_jobs').select('job_id')
  const notifiedIds = new Set((notified || []).map(n => n.job_id))

  const newJobs = relevant.filter(job => !notifiedIds.has(job.id))
  console.log(`${newJobs.length} new jobs to notify about`)

  let sent = 0
  for (const job of newJobs) {
    const subscribers = alerts.filter(
      a => a.company_name.toLowerCase() === job.company_name.toLowerCase()
    )
    for (const sub of subscribers) {
      const email = sub.profiles?.email
      const name = sub.profiles?.name?.split(' ')[0] || 'there'
      if (!email) continue
      await sendEmail(email, name, job)
      sent++
    }
    // Mark notified regardless of email success so we don't re-notify
    await supabase.from('notified_jobs').upsert({
      job_id: job.id,
      company_name: job.company_name,
      title: job.title,
    }, { onConflict: 'job_id' })
  }

  console.log(`Done. Sent ${sent} alert emails.`)
}

main().catch(err => { console.error(err); process.exit(1) })
