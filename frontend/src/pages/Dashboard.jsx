import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import CompanyCard from '../components/CompanyCard'
import ReviewCard from '../components/ReviewCard'
import { TrendingUp, Clock, Sparkles, Search, ArrowRight, X, FileText } from 'lucide-react'

function avg(vals) {
  const f = vals.filter(Boolean)
  return f.length ? Math.round(f.reduce((a, b) => a + b, 0) / f.length * 10) / 10 : null
}

export default function Dashboard() {
  const { user } = useAuth()
  const [trending, setTrending] = useState([])
  const [recent, setRecent] = useState([])
  const [recommended, setRecommended] = useState([])
  const [reviewCount, setReviewCount] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())
  const [dismissedBanner, setDismissedBanner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    Promise.all([
      supabase.from('companies').select('*').gt('review_count', 0).order('review_count', { ascending: false }).limit(6)
        .then(({ data }) => setTrending(data || [])),

      supabase.from('reviews')
        .select('*, companies(name)')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => setRecent(
          (data || []).map(r => ({
            ...r,
            company_name: r.companies?.name,
            university: r.show_university ? r.university : undefined,
            rating: avg([r.rating_work, r.rating_mentorship, r.rating_compensation, r.rating_culture]),
          }))
        )),

      supabase.from('companies').select('*').gt('review_count', 0).order('avg_rating', { ascending: false }).limit(3)
        .then(({ data }) => setRecommended(data || [])),

      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        .then(({ count }) => setReviewCount(count ?? 0)),

      supabase.from('saved_companies').select('company_id').eq('user_id', user.id)
        .then(({ data }) => setSavedIds(new Set((data || []).map(s => s.company_id)))),
    ]).finally(() => setLoading(false))
  }, [user])

  const showBanner = !dismissedBanner && reviewCount === 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {showBanner && reviewCount !== null && (
        <div className="bg-amber-500 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-black flex-shrink-0" />
              <p className="text-black text-sm font-semibold">You're on borrowed time — add your review and give back.</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link to="/submit-review" className="bg-black text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">Write a review</Link>
              <button onClick={() => setDismissedBanner(true)} className="text-black"><X size={16} /></button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Hey {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1">Here's what's new on ClearOffer.</p>
        </div>

        <Link to="/search" className="flex items-center gap-3 bg-white border border-slate-200 hover:border-amber-300 rounded-2xl px-5 py-4 mb-8 transition-colors group">
          <Search size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
          <span className="text-slate-400 text-sm">Search companies, roles, tech stacks...</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={17} className="text-amber-500" />Most reviewed
                </h2>
                <Link to="/search" className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1">See all <ArrowRight size={12} /></Link>
              </div>
              {loading ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
                </div>
              ) : trending.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {trending.slice(0, 4).map(c => <CompanyCard key={c.id} company={{ ...c, is_saved: savedIds.has(c.id) }} />)}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-400 text-sm">No reviews yet — be the first to write one.</p>
                  <Link to="/submit-review" className="inline-block mt-3 text-amber-600 text-sm font-semibold hover:text-amber-700">Write a review →</Link>
                </div>
              )}
            </section>

            <section>
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Clock size={17} className="text-amber-500" />Recently added
              </h2>
              {loading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}</div>
              ) : recent.length > 0 ? (
                <div className="space-y-4">{recent.map(r => <ReviewCard key={r.id} review={r} />)}</div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-400 text-sm">No reviews yet. Start by writing yours.</p>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-500" />Top rated
              </h3>
              {recommended.length > 0 ? (
                <div className="space-y-3">
                  {recommended.map(c => (
                    <Link key={c.id} to={`/company/${c.id}`} className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{c.name[0]}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.review_count} reviews</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No data yet.</p>
              )}
              <p className="text-xs text-slate-400 mt-3">Based on {user?.major} · Class of {user?.grad_year}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-3">Quick actions</h3>
              <div className="space-y-2">
                <Link to="/submit-review" className="flex items-center gap-2 text-sm text-slate-700 hover:text-amber-700 font-medium transition-colors">
                  <FileText size={14} className="text-amber-500" />Write a review
                </Link>
                <Link to="/resume-fit" className="flex items-center gap-2 text-sm text-slate-700 hover:text-amber-700 font-medium transition-colors">
                  <span className="text-amber-500 text-xs">⚡</span>Score my resume
                </Link>
                <Link to="/search" className="flex items-center gap-2 text-sm text-slate-700 hover:text-amber-700 font-medium transition-colors">
                  <Search size={14} className="text-amber-500" />Explore companies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
