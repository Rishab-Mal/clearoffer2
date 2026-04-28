import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { Check, ChevronLeft, ChevronRight, Star, ArrowLeft } from 'lucide-react'

const COMPANIES = ['Stripe', 'Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Airbnb',
  'Uber', 'Lyft', 'Figma', 'Notion', 'Linear', 'Vercel', 'Snowflake', 'Databricks', 'Coinbase',
  'OpenAI', 'Anthropic', 'Palantir', 'Roblox', 'Discord', 'Twitch', 'Spotify', 'Other']

const TECH_OPTIONS = ['Python', 'JavaScript', 'TypeScript', 'React', 'Go', 'Java', 'C++', 'Rust',
  'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Kubernetes', 'Docker', 'AWS', 'GCP', 'Figma', 'ML/PyTorch']

const INTERVIEW_TOPICS = ['Arrays/Strings', 'Linked Lists', 'Trees/Graphs', 'Dynamic Programming',
  'Sorting/Searching', 'System Design', 'Behavioral/LP', 'Object-Oriented Design', 'Database Design',
  'Probability/Stats', 'ML Fundamentals', 'Domain-specific']

const steps = ['Basics', 'The Work', 'Interview', 'Final take']

function ProgressBar({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < current ? 'bg-amber-500 text-black' : i === current ? 'bg-amber-500 text-black ring-4 ring-amber-500/20' : 'bg-slate-200 text-slate-500'}`}>
            {i < current ? <Check size={13} /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i === current ? 'text-amber-600' : 'text-slate-400'}`}>{s}</span>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 w-8 ${i < current ? 'bg-amber-500' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  )
}

function RatingSlider({ label, name, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} type="button" onClick={() => onChange(name, v)} className="transition-transform hover:scale-110">
              <Star size={18} className={v <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SubmitReview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  const [form, setForm] = useState({
    company: '', role_title: '', team: '', internship_year: new Date().getFullYear(),
    duration_months: 3, location_type: 'onsite', location: '',
    rating_work: 0, rating_mentorship: 0, rating_compensation: 0, rating_culture: 0,
    work_description: '', tech_used: [],
    interview_rounds: 2, interview_topics: [], interview_difficulty: 3,
    days_to_offer: '', specific_questions: '',
    would_return: null, would_recommend: null,
    one_line_summary: '', anonymous: true, show_university: false,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setE = (k) => (e) => set(k, e.target.value)
  const toggleTech = (t) => set('tech_used', form.tech_used.includes(t) ? form.tech_used.filter(x => x !== t) : [...form.tech_used, t])
  const toggleTopic = (t) => set('interview_topics', form.interview_topics.includes(t) ? form.interview_topics.filter(x => x !== t) : [...form.interview_topics, t])

  const validateStep = () => {
    const e = {}
    if (step === 0) { if (!form.company) e.company = 'Required'; if (!form.role_title) e.role_title = 'Required' }
    if (step === 1) { if (form.work_description.length < 100) e.work_description = 'Minimum 100 characters'; if (!form.rating_work) e.rating_work = 'Required' }
    if (step === 3) { if (!form.one_line_summary) e.one_line_summary = 'Required'; if (form.would_return === null) e.would_return = 'Required' }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const avgParts = [form.rating_work, form.rating_mentorship, form.rating_compensation, form.rating_culture].filter(Boolean)
      const rating = avgParts.length ? avgParts.reduce((a, b) => a + b, 0) / avgParts.length : null

      let { data: company } = await supabase.from('companies').select('id').ilike('name', form.company).single()
      if (!company) {
        const { data: newCompany } = await supabase.from('companies').insert({ name: form.company }).select().single()
        company = newCompany
      }

      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        company_id: company.id,
        role_title: form.role_title,
        team: form.team || null,
        internship_year: Number(form.internship_year),
        duration_months: Number(form.duration_months),
        location_type: form.location_type,
        location: form.location || null,
        rating,
        rating_work: form.rating_work || null,
        rating_mentorship: form.rating_mentorship || null,
        rating_compensation: form.rating_compensation || null,
        rating_culture: form.rating_culture || null,
        work_description: form.work_description,
        one_line_summary: form.one_line_summary,
        tech_used: form.tech_used,
        interview_rounds: Number(form.interview_rounds) || null,
        interview_topics: form.interview_topics,
        interview_difficulty: Number(form.interview_difficulty) || null,
        days_to_offer: form.days_to_offer ? Number(form.days_to_offer) : null,
        specific_questions: form.specific_questions || null,
        would_return: form.would_return,
        would_recommend: form.would_recommend,
        anonymous: form.anonymous,
        show_university: form.show_university,
        is_approved: true,
      })

      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (submitted) return <SuccessScreen />

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-4"><ArrowLeft size={14} />Back to dashboard</Link>
          <h1 className="text-2xl font-black text-slate-900">Write a review</h1>
          <p className="text-slate-500 text-sm mt-1">5–7 minutes · Anonymous by default · Helps hundreds of students</p>
        </div>

        <ProgressBar current={step} />

        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Step 1: The basics</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company *</label>
                <select value={form.company} onChange={setE('company')} className={`w-full border rounded-xl px-4 py-3 text-sm outline-none ${errors.company ? 'border-red-400' : 'border-slate-200 focus:border-amber-400'}`}>
                  <option value="">Select company</option>
                  {COMPANIES.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role title *</label>
                <input value={form.role_title} onChange={setE('role_title')} placeholder="e.g. Software Engineer Intern" className={`w-full border rounded-xl px-4 py-3 text-sm outline-none ${errors.role_title ? 'border-red-400' : 'border-slate-200 focus:border-amber-400'}`} />
                {errors.role_title && <p className="text-xs text-red-500 mt-1">{errors.role_title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Team / org</label>
                  <input value={form.team} onChange={setE('team')} placeholder="e.g. Billing, Ads" className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Internship year</label>
                  <select value={form.internship_year} onChange={setE('internship_year')} className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none">
                    {[2022, 2023, 2024, 2025].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (months)</label>
                  <select value={form.duration_months} onChange={setE('duration_months')} className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none">
                    {[2, 3, 4, 5, 6].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location type</label>
                  <select value={form.location_type} onChange={setE('location_type')} className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none">
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>
              {form.location_type !== 'remote' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                  <input value={form.location} onChange={setE('location')} placeholder="e.g. San Francisco, CA" className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Step 2: The work</h2>
              <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                <RatingSlider label="Work quality" name="rating_work" value={form.rating_work} onChange={set} />
                <RatingSlider label="Mentorship" name="rating_mentorship" value={form.rating_mentorship} onChange={set} />
                <RatingSlider label="Compensation" name="rating_compensation" value={form.rating_compensation} onChange={set} />
                <RatingSlider label="Culture" name="rating_culture" value={form.rating_culture} onChange={set} />
                {errors.rating_work && <p className="text-xs text-red-500">Please rate at least one category.</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Describe your day-to-day work *
                  <span className="text-slate-400 font-normal ml-1">({form.work_description.length}/100+ chars)</span>
                </label>
                <textarea value={form.work_description} onChange={setE('work_description')} rows={5} placeholder="What did you actually work on? Who was your manager like?" className={`w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none ${errors.work_description ? 'border-red-400' : 'border-slate-200 focus:border-amber-400'}`} />
                {errors.work_description && <p className="text-xs text-red-500 mt-1">{errors.work_description}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tech you used</label>
                <div className="flex flex-wrap gap-2">
                  {TECH_OPTIONS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTech(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.tech_used.includes(t) ? 'bg-amber-500 text-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Step 3: Interview experience</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">How many rounds?</label>
                  <select value={form.interview_rounds} onChange={setE('interview_rounds')} className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none">
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Days from apply to offer</label>
                  <input type="number" min="1" max="365" value={form.days_to_offer} onChange={setE('days_to_offer')} placeholder="e.g. 30" className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Difficulty <span className="text-slate-400 font-normal ml-2">{['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][form.interview_difficulty]}</span>
                </label>
                <input type="range" min={1} max={5} value={form.interview_difficulty} onChange={e => set('interview_difficulty', Number(e.target.value))} className="w-full accent-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Topics that came up</label>
                <div className="flex flex-wrap gap-2">
                  {INTERVIEW_TOPICS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTopic(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.interview_topics.includes(t) ? 'bg-amber-500 text-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Any questions you remember? (optional)</label>
                <textarea value={form.specific_questions} onChange={setE('specific_questions')} rows={3} placeholder="Specific questions or problem types." className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Step 4: Final take</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Would you return? *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button" onClick={() => set('would_return', v)} className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${form.would_return === v ? (v ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-400 text-red-600') : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {v ? "Yes, I'd return" : "No, I wouldn't"}
                    </button>
                  ))}
                </div>
                {errors.would_return && <p className="text-xs text-red-500 mt-1">Please answer this</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">One-line summary * <span className="font-normal text-slate-400">(shown on cards)</span></label>
                <input value={form.one_line_summary} onChange={setE('one_line_summary')} placeholder="e.g. Best summer of my life. Real ownership, shipped to millions." maxLength={120} className={`w-full border rounded-xl px-4 py-3 text-sm outline-none ${errors.one_line_summary ? 'border-red-400' : 'border-slate-200 focus:border-amber-400'}`} />
                {errors.one_line_summary && <p className="text-xs text-red-500 mt-1">Required</p>}
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.anonymous} onChange={e => set('anonymous', e.target.checked)} className="accent-amber-500 w-4 h-4" />
                  <div><p className="text-sm font-semibold text-slate-700">Submit anonymously</p><p className="text-xs text-slate-500">Your name will never be shown</p></div>
                </label>
                {!form.anonymous && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.show_university} onChange={e => set('show_university', e.target.checked)} className="accent-amber-500 w-4 h-4" />
                    <div><p className="text-sm font-semibold text-slate-700">Show my university</p><p className="text-xs text-slate-500">Helps others weigh your experience</p></div>
                  </label>
                )}
              </div>
            </div>
          )}

          {submitError && <div className="mt-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{submitError}</div>}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button onClick={back} disabled={step === 0} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />Back
            </button>
            {step < 3 ? (
              <button onClick={next} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl transition-colors">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-sm px-6 py-2.5 rounded-xl transition-colors">
                {submitting ? 'Submitting...' : <><Check size={16} />Submit review</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Review submitted!</h2>
        <p className="text-slate-500 mb-6">Your review helps hundreds of students make better decisions.</p>
        <div className="flex flex-col gap-3">
          <Link to="/search" className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-sm transition-colors">Explore companies</Link>
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-700 text-sm font-medium">Back to dashboard</Link>
        </div>
      </div>
    </div>
  )
}
