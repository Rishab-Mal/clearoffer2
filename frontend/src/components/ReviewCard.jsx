import { Star, ThumbsUp, RotateCcw, MapPin } from 'lucide-react'
import { useState } from 'react'
import api from '../lib/api'

export default function ReviewCard({ review }) {
  const [helpful, setHelpful] = useState(review.helpful_count || 0)
  const [voted, setVoted] = useState(false)

  const handleHelpful = async () => {
    if (voted) return
    try {
      await api.post(`/api/reviews/${review.id}/helpful`)
      setHelpful(h => h + 1)
      setVoted(true)
    } catch {}
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(review.rating || 0))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">{review.role_title}</span>
            {review.internship_year && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{review.internship_year}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {review.show_university && review.university && (
              <span>{review.university}</span>
            )}
            {review.location && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />{review.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {stars.map((filled, i) => (
            <Star key={i} size={13} className={filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'} />
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

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex flex-wrap gap-1.5">
          {review.tech_used?.map(tech => (
            <span key={tech} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs">{tech}</span>
          ))}
        </div>
        <button
          onClick={handleHelpful}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            voted ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ThumbsUp size={13} />
          {helpful > 0 && <span>{helpful}</span>}
          {!voted && <span>Helpful</span>}
        </button>
      </div>
    </div>
  )
}
