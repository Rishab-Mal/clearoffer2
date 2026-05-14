import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, HelpCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function ReviewComments({ reviewId }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [isQuestion, setIsQuestion] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase
      .from('review_comments')
      .select('id', { count: 'exact', head: true })
      .eq('review_id', reviewId)
      .then(({ count: c }) => setCount(c || 0))
  }, [reviewId])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('review_comments')
      .select('*')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setCount(data?.length || 0)
    setLoading(false)
  }

  const toggle = () => {
    if (!open) load()
    setOpen(o => !o)
  }

  const submit = async () => {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('review_comments')
      .insert({
        review_id: reviewId,
        user_id: user.id,
        author_name: 'Anonymous',
        content: content.trim(),
        is_question: isQuestion,
      })
      .select()
      .single()
    if (!error && data) {
      setComments(prev => [...prev, data])
      setCount(c => c + 1)
      setContent('')
      setIsQuestion(false)
    }
    setSubmitting(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MessageSquare size={13} />
        {count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'Comment or ask a question'}
        {count > 0 && (open ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <p className="text-xs text-slate-400">Loading…</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                  {c.author_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700">{c.author_name}</span>
                    {c.is_question && (
                      <span className="inline-flex items-center gap-0.5 text-xs bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full font-medium">
                        <HelpCircle size={10} />Question
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}

          {!user ? (
            <p className="text-xs text-slate-500">
              <Link to="/auth" className="text-amber-600 hover:text-amber-700 font-semibold">Sign in</Link> to comment or ask a question.
            </p>
          ) : (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                A
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={isQuestion ? 'Ask something about this experience…' : 'Add a comment…'}
                  rows={2}
                  className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none transition-colors resize-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setIsQuestion(false)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${!isQuestion ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      Comment
                    </button>
                    <button
                      onClick={() => setIsQuestion(true)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${isQuestion ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      <HelpCircle size={11} />Question
                    </button>
                  </div>
                  <button
                    onClick={submit}
                    disabled={!content.trim() || submitting}
                    className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Send size={11} />{submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
                <p className="text-xs text-slate-400">⌘ + Enter to post</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
