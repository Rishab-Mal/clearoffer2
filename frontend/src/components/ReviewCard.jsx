import { Star, ThumbsUp, ThumbsDown, RotateCcw, MapPin, Flag, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const REPORT_REASONS = [
  'Inappropriate language',
  'Fake or misleading review',
  'Contains personal information',
  'Spam',
  'Other',
]

export default function ReviewCard({ review }) {
  const [helpful, setHelpful] = useState(Math.max(0, review.helpful_count || 0))
  const [dislikes, setDislikes] = useState(Math.max(0, review.dislike_count || 0))
  const [vote, setVote] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reported, setReported] = useState(false)
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('review_votes').select('vote').eq('user_id', user.id).eq('review_id', review.id).single()
        .then(({ data }) => { if (data) setVote(data.vote) })
      supabase.from('reports').select('id').eq('reporter_id', user.id).eq('review_id', review.id).single()
        .then(({ data }) => { if (data) setReported(true) })
    })
  }, [review.id])

  const persistVote = async (newVote) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (newVote) {
      await supabase.from('review_votes').upsert({ user_id: user.id, review_id: review.id, vote: newVote })
    } else {
      await supabase.from('review_votes').delete().eq('user_id', user.id).eq('review_id', review.id)
    }
  }

  const applyVote = (newVote) => {
    const oldVote = vote
    // Update local state
    if (oldVote === 'like') setHelpful(h => Math.max(0, h - 1))
    if (oldVote === 'dislike') setDislikes(d => Math.max(0, d - 1))
    if (newVote === 'like') setHelpful(h => h + 1)
    if (newVote === 'dislike') setDislikes(d => d + 1)
    setVote(newVote)
    persistVote(newVote)
    // Single RPC handles all count updates atomically
    supabase.rpc('update_vote', {
      p_review_id: review.id,
      p_old_vote: oldVote,
      p_new_vote: newVote,
    }).then(({ error }) => { if (error) console.error('update_vote failed:', error.message) })
  }

  const handleLike = () => applyVote(vote === 'like' ? null : 'like')
  const handleDislike = () => applyVote(vote === 'dislike' ? null : 'dislike')

  const handleReport = async () => {
    if (!reportReason) return
    setReporting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('reports').upsert({ review_id: review.id, reporter_id: user.id, reason: reportReason })
      setReported(true)
    }
    setShowReport(false)
    setReporting(false)
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(review.rating || 0))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">{review.role_title}</span>
            {review.internship_year && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{review.internship_year}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {review.show_university && review.university && <span>{review.university}</span>}
            {review.location && (
              <span className="flex items-center gap-1"><MapPin size={10} />{review.location}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {stars.map((filled, i) => (
            <Star key={i} size={18} className={filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'} />
          ))}
        </div>
      </div>

      {review.one_line_summary && (
        <p className="font-medium text-slate-800 mb-3">"{review.one_line_summary}"</p>
      )}
      {review.work_description && (
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{review.work_description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {review.interview_experience && (
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Interview</p>
            <p className="text-sm text-slate-700">{review.interview_experience}</p>
          </div>
        )}
        {review.would_return !== undefined && (
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
            <RotateCcw size={14} className={review.would_return ? 'text-green-500' : 'text-red-400'} />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Return offer</p>
              <p className={`text-sm font-medium ${review.would_return ? 'text-green-600' : 'text-red-500'}`}>
                {review.would_return ? 'Would return' : 'Would not return'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex flex-wrap gap-1.5">
          {review.tech_used?.map(tech => (
            <span key={tech} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs">{tech}</span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${vote === 'like' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <ThumbsUp size={15} className={vote === 'like' ? 'fill-amber-400' : ''} />
            <span>{helpful}</span>
          </button>
          <button onClick={handleDislike} className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${vote === 'dislike' ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}`}>
            <ThumbsDown size={15} className={vote === 'dislike' ? 'fill-red-400' : ''} />
            <span>{dislikes}</span>
          </button>
          <button
            onClick={() => !reported && setShowReport(true)}
            className={`flex items-center gap-1 text-xs transition-colors ${reported ? 'text-slate-300 cursor-default' : 'text-slate-400 hover:text-red-400'}`}
            title={reported ? 'Already reported' : 'Report this review'}
          >
            <Flag size={12} />
            <span>{reported ? 'Reported' : 'Report'}</span>
          </button>
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Report review</h3>
              <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Why are you reporting this review?</p>
            <div className="space-y-2 mb-5">
              {REPORT_REASONS.map(r => (
                <label key={r} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reportReason === r}
                    onChange={() => setReportReason(r)}
                    className="accent-amber-500"
                  />
                  <span className={`text-sm ${reportReason === r ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>{r}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleReport}
              disabled={!reportReason || reporting}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {reporting ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
