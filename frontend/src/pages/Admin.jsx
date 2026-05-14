import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { Flag, Trash2, CheckCircle, AlertTriangle, Mail, Send, Users, User, ChevronDown } from 'lucide-react'

const ADMIN_EMAILS = ['malhotra.r@ufl.edu', 'rishab.malhotra7580@gmail.com']
async function sendEmail({ to, toName, subject, html }) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: toName ? `${toName} <${to}>` : to, subject, html }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Send failed')
  return data
}

function buildHtml(subject, body) {
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
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:900">${subject}</h2>
    <div style="color:#475569;font-size:15px;line-height:1.6">${body.replace(/\n/g, '<br/>')}</div>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px">
    <p style="margin:0;color:#94a3b8;font-size:12px">© 2026 ClearOffer · <a href="https://clearoffer.org" style="color:#94a3b8">clearoffer.org</a></p>
  </div>
</div>
</body>
</html>`
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('reports')

  // Reports state
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [commentReports, setCommentReports] = useState([])
  const [commentReportsLoading, setCommentReportsLoading] = useState(true)

  // Email state
  const [recipients, setRecipients] = useState('all') // 'all' | 'single'
  const [singleEmail, setSingleEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const [userList, setUserList] = useState([])
  const [usersLoaded, setUsersLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    if (!ADMIN_EMAILS.includes(user.email)) { navigate('/dashboard'); return }
    fetchReports()
    fetchCommentReports()
  }, [user])

  const fetchReports = async () => {
    setReportsLoading(true)
    const { data } = await supabase
      .from('reports')
      .select(`id, reason, created_at, review_id, reviews(id, role_title, one_line_summary, work_description, internship_year, companies(name))`)
      .order('created_at', { ascending: false })
    setReports(data || [])
    setReportsLoading(false)
  }

  const fetchCommentReports = async () => {
    setCommentReportsLoading(true)
    const { data } = await supabase
      .from('comment_reports')
      .select(`id, created_at, comment_id, review_comments(id, content, is_question, review_id)`)
      .order('created_at', { ascending: false })
    setCommentReports(data || [])
    setCommentReportsLoading(false)
  }

  const deleteComment = async (commentId) => {
    await supabase.from('review_comments').delete().eq('id', commentId)
    setCommentReports(r => r.filter(rep => rep.comment_id !== commentId))
  }

  const dismissCommentReport = async (reportId) => {
    await supabase.from('comment_reports').delete().eq('id', reportId)
    setCommentReports(r => r.filter(rep => rep.id !== reportId))
  }

  const loadUsers = async () => {
    if (usersLoaded) return
    const { data } = await supabase.rpc('get_user_emails')
    setUserList(data || [])
    setUsersLoaded(true)
  }

  const deleteReview = async (reviewId) => {
    const { error } = await supabase.rpc('admin_delete_review', { target_review_id: reviewId })
    if (error) { alert('Delete failed: ' + error.message); return }
    setReports(r => r.filter(rep => rep.review_id !== reviewId))
  }

  const dismissReport = async (reportId) => {
    await supabase.from('reports').delete().eq('id', reportId)
    setReports(r => r.filter(rep => rep.id !== reportId))
  }

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { setSendResult({ error: 'Subject and body are required.' }); return }
    if (recipients === 'single' && !singleEmail.trim()) { setSendResult({ error: 'Enter an email address.' }); return }

    setSending(true)
    setSendResult(null)
    const html = buildHtml(subject, body)

    try {
      if (recipients === 'single') {
        const result = await sendEmail({ to: singleEmail.trim(), subject, html })
        setSendResult({ success: `Sent to ${singleEmail} · ID: ${result.id || 'ok'}` })
      } else {
        await loadUsers()
        const list = userList.length > 0 ? userList : (await supabase.rpc('get_user_emails').then(r => r.data || []))
        let sent = 0
        for (const u of list) {
          try {
            await sendEmail({ to: u.email, toName: u.name, subject, html })
            sent++
          } catch {}
          // Small delay to avoid rate limits
          await new Promise(r => setTimeout(r, 100))
        }
        setSendResult({ success: `Sent to ${sent} of ${list.length} users.` })
      }
      setSubject('')
      setBody('')
      setSingleEmail('')
    } catch (err) {
      setSendResult({ error: err.message })
    } finally {
      setSending(false)
    }
  }

  const uniqueReviews = Object.values(
    reports.reduce((acc, rep) => {
      if (!acc[rep.review_id]) acc[rep.review_id] = { ...rep, count: 0 }
      acc[rep.review_id].count++
      return acc
    }, {})
  ).sort((a, b) => b.count - a.count)

  if (!user || !ADMIN_EMAILS.includes(user.email)) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Flag size={18} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 mb-6">
          <button onClick={() => setTab('reports')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors ${tab === 'reports' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-700'}`}>
            <Flag size={14} />Moderation
            {(uniqueReviews.length + commentReports.length) > 0 && <span className={`text-xs px-1.5 rounded-full ${tab === 'reports' ? 'bg-black/10' : 'bg-red-100 text-red-600'}`}>{uniqueReviews.length + commentReports.length}</span>}
          </button>
          <button onClick={() => { setTab('email'); loadUsers() }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors ${tab === 'email' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-700'}`}>
            <Mail size={14} />Send Email
          </button>
        </div>

        {/* ── REPORTS TAB ── */}
        {tab === 'reports' && (
          reportsLoading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}</div>
          ) : uniqueReviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">No reported reviews</p>
              <p className="text-sm text-slate-400 mt-1">Everything looks clean.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueReviews.map(rep => {
                const review = rep.reviews
                if (!review) return null
                const reportList = reports.filter(r => r.review_id === rep.review_id)
                return (
                  <div key={rep.review_id} className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{review.role_title}</span>
                          {review.internship_year && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{review.internship_year}</span>}
                          <span className="text-xs text-slate-500">@ {review.companies?.name}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <AlertTriangle size={11} />{rep.count} report{rep.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => dismissReport(rep.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl transition-colors">
                          <CheckCircle size={13} />Dismiss
                        </button>
                        <button onClick={() => deleteReview(rep.review_id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-xl transition-colors">
                          <Trash2 size={13} />Delete
                        </button>
                      </div>
                    </div>
                    {review.one_line_summary && <p className="text-sm font-medium text-slate-800 mb-2">"{review.one_line_summary}"</p>}
                    {review.work_description && <p className="text-sm text-slate-600 mb-4 line-clamp-3">{review.work_description}</p>}
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Reasons</p>
                      <div className="flex flex-wrap gap-2">
                        {reportList.map(r => <span key={r.id} className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full">{r.reason}</span>)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── COMMENT REPORTS ── */}
        {tab === 'reports' && !commentReportsLoading && commentReports.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Reported Comments</h2>
            {Object.values(
              commentReports.reduce((acc, rep) => {
                const cid = rep.comment_id
                if (!acc[cid]) acc[cid] = { ...rep, count: 0 }
                acc[cid].count++
                return acc
              }, {})
            ).map(rep => {
              const comment = rep.review_comments
              if (!comment) return null
              return (
                <div key={rep.comment_id} className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                        <AlertTriangle size={11} />{rep.count} report{rep.count !== 1 ? 's' : ''}
                      </span>
                      {comment.is_question && <span className="ml-2 text-xs bg-violet-50 text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full">Question</span>}
                      <p className="text-sm text-slate-700 mt-2">{comment.content}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => dismissCommentReport(rep.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl transition-colors">
                        <CheckCircle size={13} />Dismiss
                      </button>
                      <button onClick={() => deleteComment(rep.comment_id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-xl transition-colors">
                        <Trash2 size={13} />Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── EMAIL TAB ── */}
        {tab === 'email' && (
          <div className="space-y-5">
            {/* Recipients */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-bold text-slate-900 mb-4">Recipients</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => setRecipients('all')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${recipients === 'all' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${recipients === 'all' ? 'bg-amber-500' : 'bg-slate-100'}`}>
                    <Users size={16} className={recipients === 'all' ? 'text-black' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${recipients === 'all' ? 'text-amber-800' : 'text-slate-700'}`}>All users</p>
                    <p className="text-xs text-slate-400">{usersLoaded ? `${userList.length} accounts` : 'All registered'}</p>
                  </div>
                </button>
                <button onClick={() => setRecipients('single')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${recipients === 'single' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${recipients === 'single' ? 'bg-amber-500' : 'bg-slate-100'}`}>
                    <User size={16} className={recipients === 'single' ? 'text-black' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${recipients === 'single' ? 'text-amber-800' : 'text-slate-700'}`}>Single user</p>
                    <p className="text-xs text-slate-400">Specific email</p>
                  </div>
                </button>
              </div>
              {recipients === 'single' && (
                <input type="email" value={singleEmail} onChange={e => setSingleEmail(e.target.value)}
                  placeholder="user@university.edu"
                  className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none" />
              )}
            </div>

            {/* Compose */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-bold text-slate-900 mb-4">Compose</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. New features on ClearOffer"
                    className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Message</label>
                  <textarea value={body} onChange={e => setBody(e.target.value)} rows={8}
                    placeholder="Write your message here..."
                    className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
                </div>
              </div>
            </div>

            {/* Preview */}
            {subject && body && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Preview</p>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-[#08080E] px-5 py-3 flex items-center gap-2">
                    <span className="text-amber-500">✦</span>
                    <span className="text-white font-black text-sm">CLEAROFFER</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black text-slate-900 mb-3">{subject}</h3>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{body}</p>
                  </div>
                </div>
              </div>
            )}

            {sendResult && (
              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${sendResult.error ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                {sendResult.error ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
                {sendResult.error || sendResult.success}
              </div>
            )}

            <button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl text-sm transition-colors">
              {sending
                ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Sending...</>
                : <><Send size={16} />{recipients === 'all' ? 'Send to all users' : 'Send email'}</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
