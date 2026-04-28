import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { Flag, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'

const ADMIN_EMAILS = ['malhotra.r@ufl.edu']

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionDone, setActionDone] = useState({})

  useEffect(() => {
    if (!user) return
    if (!ADMIN_EMAILS.includes(user.email)) { navigate('/dashboard'); return }
    fetchReports()
  }, [user])

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select(`
        id, reason, created_at,
        review_id,
        reviews (
          id, role_title, one_line_summary, work_description,
          internship_year, is_approved,
          companies (name)
        )
      `)
      .order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
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
          <div>
            <h1 className="text-2xl font-black text-slate-900">Moderation</h1>
            <p className="text-slate-500 text-sm">{uniqueReviews.length} reported review{uniqueReviews.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
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
                        {review.internship_year && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{review.internship_year}</span>
                        )}
                        <span className="text-xs text-slate-500">@ {review.companies?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <AlertTriangle size={11} />{rep.count} report{rep.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => dismissReport(rep.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl transition-colors"
                      >
                        <CheckCircle size={13} />Dismiss
                      </button>
                      <button
                        onClick={() => deleteReview(rep.review_id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-xl transition-colors"
                      >
                        <Trash2 size={13} />Delete review
                      </button>
                    </div>
                  </div>

                  {review.one_line_summary && (
                    <p className="text-sm font-medium text-slate-800 mb-2">"{review.one_line_summary}"</p>
                  )}
                  {review.work_description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">{review.work_description}</p>
                  )}

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Report reasons</p>
                    <div className="flex flex-wrap gap-2">
                      {reportList.map(r => (
                        <span key={r.id} className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full">{r.reason}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
