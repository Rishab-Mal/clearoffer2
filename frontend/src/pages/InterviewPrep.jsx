import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { chat, parseJSON } from '../lib/openrouter'
import Navbar from '../components/Navbar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Cpu, BookOpen, MessageSquare, ArrowLeft, Clock } from 'lucide-react'

const DIFF_COLORS = { Easy: '#22C55E', Medium: '#F59E0B', Hard: '#EF4444', 'Very Hard': '#7C3AED' }

export default function InterviewPrep() {
  const { id } = useParams()
  const [prep, setPrep] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('companies').select('*').eq('id', id).single().then(async ({ data: company }) => {
      if (!company) { setLoading(false); return }

      const { data: reviews } = await supabase
        .from('reviews')
        .select('interview_topics, interview_difficulty, days_to_offer, interview_rounds, specific_questions, role_title, internship_year')
        .eq('company_id', id)
        .eq('is_approved', true)

      const topicCounts = {}
      const diffDist = { Easy: 0, Medium: 0, Hard: 0, 'Very Hard': 0 }
      const daysList = []

      for (const r of reviews || []) {
        for (const t of r.interview_topics || []) topicCounts[t] = (topicCounts[t] || 0) + 1
        if (r.interview_difficulty) {
          const label = { 1: 'Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Very Hard' }[r.interview_difficulty] || 'Medium'
          diffDist[label]++
        }
        if (r.days_to_offer) daysList.push(r.days_to_offer)
      }

      const topics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))

      const total = Object.values(diffDist).reduce((a, b) => a + b, 0) || 1
      const avgDays = daysList.length ? Math.round(daysList.reduce((a, b) => a + b) / daysList.length) : null

      let study_plan = null
      let tips = []

      if (topics.length > 0) {
        try {
          const topList = topics.slice(0, 6).map(t => t.name).join(', ')
          const prompt = `Generate a 4-week interview prep plan for a student interviewing at ${company.name}.
Most common topics reported by past interns: ${topList}.

Return JSON with:
- study_plan: multi-paragraph string (use **Week N:** headers)
- tips: array of 3-4 specific interview tips for ${company.name}

Return ONLY valid JSON.`
          const parsed = parseJSON(await chat(prompt, 600))
          study_plan = parsed.study_plan || null
          tips = parsed.tips || []
        } catch {}
      }

      const questions = (reviews || [])
        .filter(r => r.specific_questions?.trim())
        .map(r => ({
          text: r.specific_questions.trim(),
          role_title: r.role_title,
          year: r.internship_year,
          topics: r.interview_topics || [],
        }))

      setPrep({
        company_name: company.name,
        topics,
        difficulty_distribution: Object.fromEntries(
          Object.entries(diffDist).map(([k, v]) => [k, Math.round(v / total * 100)])
        ),
        avg_days: avgDays,
        study_plan,
        tips,
        questions,
        review_count: (reviews || []).length,
      })
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!prep) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Company not found.</p>
        <Link to="/search" className="mt-4 inline-block text-amber-600 hover:text-amber-700 text-sm font-medium">← Back to search</Link>
      </div>
    </div>
  )

  const noReviews = prep.review_count === 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link to={`/company/${id}`} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-4">
            <ArrowLeft size={14} />Back to {prep.company_name}
          </Link>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <Cpu size={12} />AI-generated from real reviews
          </div>
          <h1 className="text-2xl font-black text-slate-900">Interview Prep: {prep.company_name}</h1>
          <p className="text-slate-500 mt-1">
            {noReviews
              ? 'No interview data yet — be the first to submit a review.'
              : `Built from ${prep.review_count} reported interview experience${prep.review_count !== 1 ? 's' : ''}.`
            }
          </p>
        </div>

        {noReviews ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">No interview data yet</h2>
            <p className="text-slate-500 text-sm mb-6">Be the first to share your interview experience at {prep.company_name}.</p>
            <Link to="/submit-review" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors inline-block">
              Write a review
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {prep.topics.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="font-bold text-slate-900 mb-4">Most common topics</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={prep.topics} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#F8FAFC', fontSize: 12 }} cursor={{ fill: '#F1F5F9' }} formatter={v => [`${v} reports`, 'Frequency']} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {prep.topics.map((_, i) => <Cell key={i} fill={i === 0 ? '#F59E0B' : i < 3 ? '#FCD34D' : '#E2E8F0'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="font-bold text-slate-900 mb-4">Reported difficulty</h2>
                <div className="space-y-3">
                  {Object.entries(prep.difficulty_distribution).map(([label, pct]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-600 w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3">
                        <div className="rounded-full h-3 transition-all" style={{ width: `${pct}%`, backgroundColor: DIFF_COLORS[label] }} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-10 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {prep.avg_days && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <Clock size={24} className="text-amber-500 mb-2" />
                  <p className="text-4xl font-black text-slate-900">{prep.avg_days}</p>
                  <p className="text-slate-500 text-sm mt-1">avg days from apply to offer</p>
                </div>
              )}
            </div>

            {prep.questions.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"><BookOpen size={14} className="text-slate-600" /></div>
                  <h2 className="font-bold text-slate-900">What past interns were actually asked</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">{prep.questions.length} {prep.questions.length === 1 ? 'report' : 'reports'}</span>
                </div>
                <div className="space-y-4">
                  {prep.questions.map((q, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-slate-700">{q.role_title}</span>
                        {q.year && <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{q.year}</span>}
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{q.text}</p>
                      {q.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {q.topics.map(t => (
                            <span key={t} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prep.study_plan && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><Cpu size={14} className="text-amber-600" /></div>
                  <h2 className="font-bold text-slate-900">Your AI study plan</h2>
                </div>
                <div className="space-y-3">
                  {prep.study_plan.trim().split('\n\n').map((block, i) => {
                    const [header, ...rest] = block.split('\n')
                    return (
                      <div key={i} className="bg-slate-50 rounded-xl p-4">
                        <p className="font-semibold text-slate-900 text-sm mb-1">{header.replace(/\*\*/g, '')}</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{rest.join(' ').trim()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {prep.tips.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-amber-600" />Tips from past interns
                </h2>
                <div className="space-y-3">
                  {prep.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-amber-500 flex-shrink-0 mt-0.5">💡</span>
                      <p className="text-sm text-slate-700 italic">"{tip}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
