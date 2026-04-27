import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Cpu, Calendar, BookOpen, MessageSquare, ArrowLeft, Clock } from 'lucide-react'
import api from '../lib/api'

const MOCK_PREP = {
  company_name: 'Stripe',
  topics: [
    { name: 'System Design', count: 89 },
    { name: 'Dynamic Programming', count: 72 },
    { name: 'Graphs', count: 65 },
    { name: 'Behavioral', count: 61 },
    { name: 'Arrays/Strings', count: 58 },
    { name: 'Trees', count: 43 },
    { name: 'Sorting', count: 28 },
    { name: 'Database Design', count: 22 },
  ],
  difficulty_distribution: { 'Easy': 5, 'Medium': 25, 'Hard': 52, 'Very Hard': 18 },
  timeline: { apply: 0, oa: 7, phone_screen: 18, final: 28, offer: 32 },
  study_plan: `**Week 1–2: Foundation**
  Focus on arrays, strings, and basic graph traversal. Do 2–3 medium Leetcode problems per day. Review time/space complexity analysis.

  **Week 3–4: Core Patterns**
  Deep-dive on dynamic programming (classic DP: coin change, LIS, edit distance) and more complex graph problems (Dijkstra, topological sort). Stripe interviews heavily favor DP and graphs.

  **Week 5: System Design**
  Spend most of your prep here for Stripe. Study distributed systems fundamentals, payment processing architecture, API design, and idempotency. Read Stripe's engineering blog.

  **Week 6: Behavioral + Mock Interviews**
  Prepare 6–8 STAR stories covering leadership, conflict, failure, and impact. Do 2–3 mock interviews. Review your weakest areas.`,
  tips: [
    "Think out loud — Stripe interviewers value your reasoning process over just getting to an answer.",
    "For system design, always start with requirements clarification and back-of-envelope math.",
    "Be ready to discuss trade-offs in your solutions — there's almost always a follow-up about alternatives.",
    "The behavioral round is real — they care a lot about written communication and independent thinking.",
  ],
  reported_questions: [
    "Design a payment processing system that guarantees exactly-once delivery",
    "Find all connected components in an undirected graph",
    "Classic DP: minimum cost to reach the end of an array",
    "Given a stream of events, detect duplicates within a time window",
  ],
}

const DIFF_COLORS = { 'Easy': '#22C55E', 'Medium': '#F59E0B', 'Hard': '#EF4444', 'Very Hard': '#7C3AED' }

export default function InterviewPrep() {
  const { id } = useParams()
  const [prep, setPrep] = useState(MOCK_PREP)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/api/ai/interview-prep/${id}`).then(r => setPrep(r.data)).catch(() => {})
  }, [id])

  const timelineSteps = [
    { label: 'Apply', day: prep.timeline.apply },
    { label: 'OA', day: prep.timeline.oa },
    { label: 'Phone Screen', day: prep.timeline.phone_screen },
    { label: 'Final Rounds', day: prep.timeline.final },
    { label: 'Offer', day: prep.timeline.offer },
  ]

  const diffData = Object.entries(prep.difficulty_distribution).map(([k, v]) => ({ name: k, value: v }))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link to={`/company/${id}`} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-4">
            <ArrowLeft size={14} />Back to {prep.company_name}
          </Link>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <Cpu size={12} />AI-generated · Updated weekly
          </div>
          <h1 className="text-2xl font-black text-slate-900">Interview Prep: {prep.company_name}</h1>
          <p className="text-slate-500 mt-1">Built from {prep.topics.reduce((a, b) => a + b.count, 0)}+ reported interview experiences.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Topic breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2">
            <h2 className="font-bold text-slate-900 mb-4">Most common topics</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={prep.topics} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: '#F8FAFC', fontSize: 12 }}
                  cursor={{ fill: '#F1F5F9' }}
                  formatter={(v) => [`${v} reports`, 'Frequency']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {prep.topics.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#F59E0B' : i < 3 ? '#FCD34D' : '#E2E8F0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Difficulty distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-bold text-slate-900 mb-4">Reported difficulty</h2>
            <div className="space-y-3">
              {diffData.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600 w-20 flex-shrink-0">{d.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div
                      className="rounded-full h-3 transition-all"
                      style={{ width: `${d.value}%`, backgroundColor: DIFF_COLORS[d.name] }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-10 text-right">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Process timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-5">
              <Clock size={16} className="text-amber-500" />Process timeline
            </h2>
            <div className="relative">
              <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200" />
              <div className="relative flex justify-between">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center ${
                      i === timelineSteps.length - 1 ? 'bg-amber-500 border-amber-500' : 'bg-white border-amber-500'
                    }`}>
                      {i === timelineSteps.length - 1 && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">{step.label}</p>
                      <p className="text-xs text-slate-400">Day {step.day}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Study plan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Cpu size={14} className="text-amber-600" />
            </div>
            <h2 className="font-bold text-slate-900">Your AI study plan</h2>
          </div>
          <div className="space-y-3">
            {prep.study_plan.trim().split('\n\n').map((block, i) => {
              const [header, ...rest] = block.split('\n')
              return (
                <div key={i} className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-900 text-sm mb-1">
                    {header.replace(/\*\*/g, '')}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{rest.join(' ').trim()}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reported questions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-slate-500" />Reported question types
          </h2>
          <p className="text-xs text-slate-400 mb-4">Anonymized problem patterns from reviewer submissions — not exact questions.</p>
          <div className="space-y-2">
            {prep.reported_questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                <span className="text-amber-500 font-bold text-sm flex-shrink-0 mt-0.5">Q{i + 1}</span>
                <p className="text-sm text-slate-700">{q}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
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
      </div>
    </div>
  )
}
