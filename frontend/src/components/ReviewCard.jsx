import { Star, ThumbsUp, ThumbsDown, RotateCcw, MapPin } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ReviewCard({ review }) {
  const [helpful, setHelpful] = useState(review.helpful_count || 0)
  const [dislikes, setDislikes] = useState(review.dislike_count || 0)
  const [vote, setVote] = useState(null) // null | 'like' | 'dislike'

  // Load persisted vote on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('review_votes')
        .select('vote')
        .eq('user_id', user.id)
        .eq('review_id', review.id)
        .single()
        .then(({ data }) => { if (data) setVote(data.vote) })
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

  const handleLike = async () => {
    if (vote === 'like') {
      setHelpful(h => h - 1)
      setVote(null)
      persistVote(null)
      supabase.rpc('decrement_helpful', { review_id: review.id })
    } else {
      if (vote === 'dislike') {
        setDislikes(d => d - 1)
        supabase.rpc('decrement_dislike', { review_id: review.id })
      }
      setHelpful(h => h + 1)
      setVote('like')
      persistVote('like')
      supabase.rpc('increment_helpful', { review_id: review.id })
    }
  }

  const handleDislike = async () => {
    if (vote === 'dislike') {
      setDislikes(d => d - 1)
      setVote(null)
      persistVote(null)
      supabase.rpc('decrement_dislike', { review_id: review.id })
    } else {
      if (vote === 'like') {
        setHelpful(h => h - 1)
        supabase.rpc('decrement_helpful', { review_id: review.id })
      }
      setDislikes(d => d + 1)
      setVote('dislike')
      persistVote('dislike')
      supabase.rpc('increment_dislike', { review_id: review.id })
    }
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              vote === 'like' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ThumbsUp size={13} className={vote === 'like' ? 'fill-amber-400' : ''} />
            {helpful > 0 && <span>{helpful}</span>}
          </button>
          <button
            onClick={handleDislike}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              vote === 'dislike' ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ThumbsDown size={13} className={vote === 'dislike' ? 'fill-red-400' : ''} />
            {dislikes > 0 && <span>{dislikes}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
