import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import CompanyCard from '../components/CompanyCard'
import ReviewCard from '../components/ReviewCard'
import { TrendingUp, Clock, Sparkles, Search, ArrowRight, X, FileText } from 'lucide-react'
import api from '../lib/api'

const MOCK_TRENDING = [
  { id: 1, name: 'Stripe', industry: 'Fintech', avg_rating: 4.7, review_count: 312, top_tags: ['Go', 'Ruby', 'Distributed Systems'] },
  { id: 2, name: 'Google', industry: 'Technology', avg_rating: 4.5, review_count: 1204, top_tags: ['Python', 'C++', 'Kubernetes'] },
  { id: 3, name: 'Meta', industry: 'Technology', avg_rating: 4.2, review_count: 847, top_tags: ['React', 'Python', 'Hack'] },
  { id: 4, name: 'Airbnb', industry: 'Travel/Tech', avg_rating: 4.4, review_count: 193, top_tags: ['Ruby', 'React', 'Kotlin'] },
  { id: 5, name: 'Figma', industry: 'Design Tools', avg_rating: 4.8, review_count: 88, top_tags: ['C++', 'TypeScript', 'WebGL'] },
]

const MOCK_RECENT = [
  {
    id: 1, role_title: 'SWE Intern', company_name: 'Stripe', internship_year: '2024',
    one_line_summary: 'Best summer of my life. Real ownership, shipped to millions of users.',
    rating: 5, would_return: true, tech_used: ['Go', 'Ruby'], helpful_count: 47, university: 'MIT', show_university: true,
  },
  {
    id: 2, role_title: 'PM Intern', company_name: 'Google', internship_year: '2024',
    one_line_summary: 'Great learning experience but the bureaucracy is real. Slow to ship.',
    rating: 4, would_return: true, tech_used: ['Figma', 'SQL'], helpful_count: 31, university: 'Stanford', show_university: true,
  },
  {
    id: 3, role_title: 'Data Science Intern', company_name: 'Netflix', internship_year: '2023',
    one_line_summary: 'High expectations, zero hand-holding. Loved every minute.',
    rating: 5, would_return: true, tech_used: ['Python', 'Spark', 'SQL'], helpful_count: 28,
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [trending, setTrending] = useState(MOCK_TRENDING)
  const [recent, setRecent] = useState(MOCK_RECENT)
  const [recommended, setRecommended] = useState([])
  const [dismissedBanner, setDismissedBanner] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    api.get('/api/companies/trending').then(r => setTrending(r.data)).catch(() => {})
    api.get('/api/reviews/recent').then(r => setRecent(r.data)).catch(() => {})
    api.get('/api/companies/recommended').then(r => setRecommended(r.data)).catch(() => {})
    api.get('/api/users/me/reviews').then(r => setReviewCount(r.data.length)).catch(() => {})
  }, [])

  const showBanner = !dismissedBanner && reviewCount === 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {showBanner && (
        <div className="bg-amber-500 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-black flex-shrink-0" />
              <p className="text-black text-sm font-semibold">
                You're on borrowed time — add your review and give back to the community.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                to="/submit-review"
                className="bg-black text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Write a review
              </Link>
              <button onClick={() => setDismissedBanner(true)} className="text-black hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Hey {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's new on Lantern.</p>
        </div>

        {/* Search bar */}
        <Link
          to="/search"
          className="flex items-center gap-3 bg-white border border-slate-200 hover:border-amber-300 rounded-2xl px-5 py-4 mb-8 transition-colors group"
        >
          <Search size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
          <span className="text-slate-400 text-sm">Search companies, roles, tech stacks...</span>
          <span className="ml-auto text-xs text-slate-300 bg-slate-100 px-2 py-1 rounded-md">⌘K</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main feed */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trending */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={17} className="text-amber-500" />
                  Trending this week
                </h2>
                <Link to="/search" className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1">
                  See all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {trending.slice(0, 4).map(c => <CompanyCard key={c.id} company={c} />)}
              </div>
            </section>

            {/* Recent reviews */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={17} className="text-amber-500" />
                  Recently added
                </h2>
              </div>
              <div className="space-y-4">
                {recent.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommended for you */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-500" />
                Recommended for you
              </h3>
              {recommended.length > 0 ? (
                <div className="space-y-3">
                  {recommended.slice(0, 3).map(c => (
                    <Link key={c.id} to={`/company/${c.id}`} className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.review_count} reviews</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {MOCK_TRENDING.slice(0, 3).map(c => (
                    <Link key={c.id} to={`/company/${c.id}`} className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-2 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.review_count} reviews</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-3">Based on {user?.major} · Class of {user?.grad_year}</p>
            </div>

            {/* Quick actions */}
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
