import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import { Star, AlertTriangle, Clock, Layers, RotateCcw, Cpu, BookOpen, ArrowRight, FileText } from 'lucide-react'
import api from '../lib/api'

const MOCK_COMPANY = {
  id: 1, name: 'Stripe', industry: 'Fintech', avg_rating: 4.7, review_count: 312,
  ratings: { work_quality: 4.8, mentorship: 4.6, compensation: 4.9, culture: 4.5 },
  return_offer_rate: 72,
  ai_overview: "Stripe internships are defined by real ownership and fast feedback loops. Interns are embedded in product teams from day one and are expected to ship production code within the first few weeks. The culture is intensely written-first and thoughtful — meetings are rare, async is the default. Compensation is top-of-market and the technical bar is genuinely high.",
  red_flags: ['Some teams have limited onboarding docs', 'Promotion process can feel opaque'],
  interview_intel: {
    avg_rounds: 4,
    topics: ['System design', 'Behavioral (LP-style)', 'Coding (medium-hard LC)', 'Domain-specific'],
    reported_difficulty: 'Hard',
    avg_days_to_offer: 32,
  },
  tech_stack: ['Go', 'Ruby', 'TypeScript', 'React', 'MySQL', 'Kafka', 'Kubernetes'],
  top_tags: ['Go', 'Ruby', 'TypeScript'],
}

const MOCK_REVIEWS = [
  {
    id: 1, role_title: 'SWE Intern', internship_year: '2024', rating: 5,
    one_line_summary: 'Best summer of my life. Real ownership, shipped to millions of users.',
    work_description: 'I was on the Billing team building infrastructure for Stripe Tax. From week 2 I was writing Go code that processed billions of dollars in payments. My manager was incredible — checked in daily but never micromanaged.',
    interview_experience: '4 rounds: OA (medium Leetcode), technical screen, system design, behavioral. Took ~5 weeks total.',
    would_return: true, tech_used: ['Go', 'MySQL', 'Ruby'], helpful_count: 47,
    university: 'MIT', show_university: true, location: 'San Francisco, CA',
  },
  {
    id: 2, role_title: 'SWE Intern', internship_year: '2023', rating: 5,
    one_line_summary: 'Incredible team, mentorship, and technical challenge. Return-offered.',
    work_description: 'Built a new onboarding flow for Stripe Checkout. The project had clear success metrics from day one and I presented results to the VP of Engineering at the end of the summer.',
    interview_experience: 'Fairly standard — OA then 2 technical rounds then final. All LC-style with some behavioral.',
    would_return: true, tech_used: ['TypeScript', 'React', 'Ruby'], helpful_count: 31,
    university: 'Stanford University', show_university: true, location: 'Seattle, WA',
  },
  {
    id: 3, role_title: 'PM Intern', internship_year: '2024', rating: 4,
    one_line_summary: 'Great exposure, high ownership. Writing culture is real.',
    work_description: 'Worked on the Revenue Recognition product. Had to write a 15-page PRD in my first month. Intense but I learned more about product thinking than any class ever taught me.',
    interview_experience: 'Case study + product sense + behavioral. No technical screen for PM but they do test analytical skills.',
    would_return: true, tech_used: ['Figma', 'SQL', 'Python'], helpful_count: 22,
    show_university: false, location: 'Remote',
  },
]

function RatingBar({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className="bg-amber-500 rounded-full h-2 transition-all" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-6 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

export default function Company() {
  const { id } = useParams()
  const [company, setCompany] = useState(MOCK_COMPANY)
  const [reviews, setReviews] = useState(MOCK_REVIEWS)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    api.get(`/api/companies/${id}`).then(r => setCompany(r.data)).catch(() => {})
    api.get(`/api/companies/${id}/reviews`).then(r => setReviews(r.data)).catch(() => {})
  }, [id])

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(company.avg_rating))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Company header */}
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
                <Link
                  to="/submit-review"
                  className="hidden sm:flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
                >
                  <FileText size={14} />Write a review
                </Link>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {stars.map((f, i) => (
                      <Star key={i} size={16} className={f ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
                    ))}
                  </div>
                  <span className="text-lg font-black text-slate-900">{company.avg_rating.toFixed(1)}</span>
                  <span className="text-slate-500 text-sm">({company.review_count} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 text-green-600">
                  <RotateCcw size={15} />
                  <span className="text-sm font-semibold">{company.return_offer_rate}% return offer rate</span>
                </div>
              </div>

              {/* Rating breakdown */}
              <div className="mt-4 grid grid-cols-2 gap-2 max-w-md">
                <RatingBar label="Work quality" value={company.ratings?.work_quality || 0} />
                <RatingBar label="Mentorship" value={company.ratings?.mentorship || 0} />
                <RatingBar label="Compensation" value={company.ratings?.compensation || 0} />
                <RatingBar label="Culture" value={company.ratings?.culture || 0} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-slate-200 -mb-px">
            {['overview', 'reviews', 'interview'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'interview' ? 'Interview prep' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Cpu size={14} className="text-amber-600" />
                </div>
                <h2 className="font-bold text-slate-900">AI Overview</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Generated from {company.review_count} reviews</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{company.ai_overview}</p>
            </div>

            {/* Red flags */}
            {company.red_flags?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-500" />
                  <h2 className="font-bold text-red-800">Red flags from reviewers</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.red_flags.map(flag => (
                    <span key={flag} className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full">
                      <AlertTriangle size={10} />{flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tech stack */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={16} className="text-slate-500" />
                <h2 className="font-bold text-slate-900">Tech stack (from interns)</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {company.tech_stack?.map(tech => (
                  <span key={tech} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">Aggregated from intern reviews — not the job posting.</p>
            </div>

            {/* Recent reviews preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Recent reviews</h2>
                <button onClick={() => setActiveTab('reviews')} className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
                  See all <ArrowRight size={14} />
                </button>
              </div>
              <div className="space-y-4">
                {reviews.slice(0, 2).map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{reviews.length} reviews</h2>
              <select className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>Most helpful</option>
                <option>Most recent</option>
                <option>Highest rated</option>
              </select>
            </div>
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}

        {activeTab === 'interview' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard icon={<Clock size={18} className="text-amber-500" />} label="Avg rounds" value={company.interview_intel?.avg_rounds} unit="rounds" />
              <StatCard icon={<Star size={18} className="text-amber-500" />} label="Difficulty" value={company.interview_intel?.reported_difficulty} />
              <StatCard icon={<RotateCcw size={18} className="text-amber-500" />} label="Apply to offer" value={company.interview_intel?.avg_days_to_offer} unit="days" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-slate-500" />
                <h2 className="font-bold text-slate-900">Common topics</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {company.interview_intel?.topics?.map(topic => (
                  <span key={topic} className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
              <h2 className="font-bold text-slate-900 mb-2">Want a personalized study plan?</h2>
              <p className="text-slate-600 text-sm mb-4">
                Lantern's AI generates a week-by-week study plan based on what past interns at {company.name} actually reported.
              </p>
              <Link
                to={`/interview-prep/${id}`}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <Cpu size={14} />Get my study plan <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-6 right-6">
        <Link
          to="/submit-review"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:-translate-y-0.5"
        >
          <FileText size={16} />Write a review
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-black text-slate-900">{value}{unit ? <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span> : ''}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}
