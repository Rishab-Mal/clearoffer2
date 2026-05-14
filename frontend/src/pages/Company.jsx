import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import AdUnit from '../components/AdUnit'
import Footer from '../components/Footer'
import { Star, AlertTriangle, Clock, Layers, RotateCcw, Cpu, BookOpen, ArrowRight, FileText, LogIn } from 'lucide-react'

function RatingBar({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className="bg-amber-500 rounded-full h-2 transition-all" style={{ width: `${((value || 0) / 5) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-6 text-right">{(value || 0).toFixed(1)}</span>
    </div>
  )
}

function StatCard({ icon, label, value, unit }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-black text-slate-900">{value ?? '—'}{unit ? <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span> : ''}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}

export default function Company() {
  const { id } = useParams()
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('companies').select('*').eq('id', id).single()
        .then(({ data }) => setCompany(data)),
      supabase.from('reviews')
        .select('*')
        .eq('company_id', id)
        .eq('is_approved', true)
        .order('helpful_count', { ascending: false })
        .limit(30)
        .then(({ data }) => setReviews(
          (data || []).map(r => ({
            ...r,
            rating: avg([r.rating_work, r.rating_mentorship, r.rating_compensation, r.rating_culture]),
          }))
        )),
    ]).finally(() => setLoading(false))
  }, [id, user])

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!company) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Company not found.</p></div>

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(company.avg_rating || 0))
  const topicsFromReviews = reviews.flatMap(r => r.interview_topics || [])
  const topicCounts = topicsFromReviews.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {})
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
              {company.name?.[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{company.name}</h1>
                  <p className="text-slate-500">{company.industry}</p>
                </div>
                <Link to="/submit-review" className="hidden sm:flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-colors flex-shrink-0">
                  <FileText size={14} />Write a review
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex">{stars.map((f, i) => <Star key={i} size={16} className={f ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />)}</div>
                  <span className="text-lg font-black text-slate-900">{(company.avg_rating || 0).toFixed(1)}</span>
                  <span className="text-slate-500 text-sm">({company.review_count} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 text-green-600">
                  <RotateCcw size={15} />
                  <span className="text-sm font-semibold">{company.return_offer_rate?.toFixed(0) || 0}% return offer rate</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 max-w-md">
                <RatingBar label="Work quality" value={company.rating_work} />
                <RatingBar label="Mentorship" value={company.rating_mentorship} />
                <RatingBar label="Compensation" value={company.rating_compensation} />
                <RatingBar label="Culture" value={company.rating_culture} />
              </div>
            </div>
          </div>

          <div className="flex gap-1 mt-6 border-b border-slate-200 -mb-px">
            {['overview', 'reviews', 'interview'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {tab === 'interview' ? 'Interview prep' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {company.ai_overview && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><Cpu size={14} className="text-amber-600" /></div>
                  <h2 className="font-bold text-slate-900">AI Overview</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">from {company.review_count} reviews</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{company.ai_overview}</p>
              </div>
            )}

            {company.top_tags?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4"><Layers size={16} className="text-slate-500" /><h2 className="font-bold text-slate-900">Tech stack (from interns)</h2></div>
                <div className="flex flex-wrap gap-2">
                  {company.top_tags.map(tech => <span key={tech} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">{tech}</span>)}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Recent reviews</h2>
                <button onClick={() => setActiveTab('reviews')} className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">See all <ArrowRight size={14} /></button>
              </div>
              <div className="space-y-4">{reviews.slice(0, 2).map(r => <ReviewCard key={r.id} review={r} />)}</div>
            </div>

            <AdUnit slot="3791428174" format="auto" />

            {!user && (
              <div className="bg-slate-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">See all {company.review_count} reviews + score your resume</p>
                  <p className="text-slate-400 text-sm mt-1">Free account. Takes 30 seconds.</p>
                </div>
                <Link to="/auth" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap flex-shrink-0">
                  <LogIn size={15} />Sign up free
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{reviews.length} reviews</h2>
            </div>
            {reviews.flatMap((r, i) => {
              const els = [<ReviewCard key={r.id} review={r} />]
              if ((i + 1) % 3 === 0) els.push(<AdUnit key={`ad-${i}`} slot="6452973851" format="auto" />)
              return els
            })}
            {!user && reviews.length > 0 && (
              <div className="bg-slate-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 mt-2">
                <div className="flex-1">
                  <p className="font-bold text-white">Want to write a review or score your resume?</p>
                  <p className="text-slate-400 text-sm mt-1">Free account — takes 30 seconds.</p>
                </div>
                <Link to="/auth" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap flex-shrink-0">
                  <LogIn size={15} />Sign up free
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'interview' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard icon={<Clock size={18} className="text-amber-500" />} label="Avg rounds" value={Math.round(reviews.filter(r => r.interview_rounds).reduce((a, r) => a + r.interview_rounds, 0) / (reviews.filter(r => r.interview_rounds).length || 1))} unit="rounds" />
              <StatCard icon={<Star size={18} className="text-amber-500" />} label="Difficulty" value={['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][Math.round(reviews.filter(r => r.interview_difficulty).reduce((a, r) => a + r.interview_difficulty, 0) / (reviews.filter(r => r.interview_difficulty).length || 1))] || 'Medium'} />
              <StatCard icon={<RotateCcw size={18} className="text-amber-500" />} label="Apply to offer" value={Math.round(reviews.filter(r => r.days_to_offer).reduce((a, r) => a + r.days_to_offer, 0) / (reviews.filter(r => r.days_to_offer).length || 1)) || '—'} unit="days" />
            </div>

            {sortedTopics.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4"><BookOpen size={16} className="text-slate-500" /><h2 className="font-bold text-slate-900">Common topics</h2></div>
                <div className="flex flex-wrap gap-2">
                  {sortedTopics.map(([topic]) => <span key={topic} className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm font-medium">{topic}</span>)}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
              <h2 className="font-bold text-slate-900 mb-2">Want a personalized study plan?</h2>
              <p className="text-slate-600 text-sm mb-4">ClearOffer AI generates a week-by-week plan based on what past interns at {company.name} actually reported.</p>
              <Link to={`/interview-prep/${id}`} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
                <Cpu size={14} />Get my study plan <ArrowRight size={14} />
              </Link>
            </div>

            <AdUnit slot="3791428174" format="auto" />
          </div>
        )}
      </div>

      <Footer />

      <div className="fixed bottom-6 right-6">
        <Link to="/submit-review" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:-translate-y-0.5">
          <FileText size={16} />Write a review
        </Link>
      </div>
    </div>
  )
}

function avg(vals) {
  const f = vals.filter(Boolean)
  return f.length ? Math.round(f.reduce((a, b) => a + b, 0) / f.length * 10) / 10 : null
}
