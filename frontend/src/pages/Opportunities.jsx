import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { chat, parseJSON } from '../lib/openrouter'
import { useAuth } from '../context/AuthContext'
import {
  Briefcase, Code2, LineChart, Database, DollarSign, Cpu,
  ExternalLink, MapPin, Clock, Search, X, CheckCircle,
  Globe, Upload, FileText, Sparkles, Wand2, Star, Bell, BellOff
} from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const LISTINGS_URL =
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json'

const CATEGORIES = [
  { id: 'swe', label: 'Software Engineering', icon: Code2, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', keywords: ['software', 'engineer', 'swe', 'developer', 'backend', 'frontend', 'full stack', 'fullstack', 'web', 'ios', 'android', 'mobile', 'platform', 'infrastructure', 'devops', 'cloud'] },
  { id: 'pm', label: 'Product Management', icon: LineChart, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', keywords: ['product manager', 'product management', 'apm', 'associate product'] },
  { id: 'data', label: 'Data Science & ML', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', keywords: ['data science', 'machine learning', 'ml', 'artificial intelligence', 'ai', 'data engineer', 'data analyst', 'analytics', 'nlp', 'deep learning', 'research scientist', 'applied scientist'] },
  { id: 'quant', label: 'Quant & Finance', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', keywords: ['quant', 'quantitative', 'trading', 'finance', 'investment', 'risk', 'algorithmic'] },
  { id: 'hardware', label: 'Hardware & Systems', icon: Cpu, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', keywords: ['hardware', 'electrical', 'embedded', 'fpga', 'vlsi', 'chip', 'silicon', 'firmware', 'asic'] },
]

function categorize(title) {
  const t = title.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => t.includes(k))) return cat.id
  }
  return 'swe'
}

function timeAgo(ts) {
  if (!ts) return ''
  const days = Math.floor((Date.now() / 1000 - ts) / 86400)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

// Words too generic to count as meaningful resume matches
const STOPWORDS = new Set([
  'the','and','for','are','with','this','that','have','from','not','but','our',
  'you','all','can','her','was','one','been','has','more','also','into','its',
  'they','had','what','were','will','would','there','their','which','when',
  'intern','internship','summer','experience','role','team','work','working',
  'strong','good','great','new','use','using','used','help','base','based',
  'including','related','across','within','multiple','various','able','ability',
  'preferred','required','plus','year','years'
])

const CANADA_MARKERS = [
  'canada','toronto','vancouver','montreal','ottawa','calgary','edmonton',
  'waterloo','ontario','british columbia','quebec','alberta','manitoba',
  'saskatchewan',', on',' on,','bc,',', bc',', qc',', ab',', mb',', sk',
  'nova scotia','new brunswick',
]

function isCanadaOnly(locations) {
  if (!locations?.length) return false
  return locations.every(loc => CANADA_MARKERS.some(m => loc.toLowerCase().includes(m)))
}

function scoreResume(resumeText, job) {
  const resumeWords = new Set(
    (resumeText.toLowerCase().match(/\b[a-z+#]{2,}\b/g) || []).filter(w => !STOPWORDS.has(w))
  )
  // Extract meaningful terms from job title only (not company name — too noisy)
  const jobTerms = (job.title).toLowerCase().match(/\b[a-z+#]{2,}\b/g) || []
  const meaningful = jobTerms.filter(w => !STOPWORDS.has(w))
  if (meaningful.length === 0) return 0
  const matches = meaningful.filter(w => resumeWords.has(w)).length
  // Require at least 2 real matches to avoid false positives
  if (matches < 2) return 0
  return matches / meaningful.length
}

async function extractPdfText(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(item => item.str).join(' ') + '\n'
  }
  return text.trim()
}

// ── Resume upload panel ───────────────────────────────────────────────────────
function ResumePanel({ resume, onSave }) {
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [text, setText] = useState(resume || '')
  const [fileLoading, setFileLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [saving, setSaving] = useState(false)

  const onDrop = useCallback(async (files) => {
    const file = files[0]; if (!file) return
    setFileLoading(true); setFileName(file.name)
    try {
      const extracted = file.type === 'application/pdf' || file.name.endsWith('.pdf')
        ? await extractPdfText(file)
        : await file.text()
      setText(extracted.slice(0, 8000))
    } catch { setFileName('') }
    finally { setFileLoading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] }, maxFiles: 1,
  })

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    await onSave(text.trim())
    setSaving(false)
    setMode('view')
  }

  if (mode === 'view' && resume) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
            <FileText size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Resume on file</p>
            <p className="text-xs text-green-600">{resume.length.toLocaleString()} chars · Job recommendations are active</p>
          </div>
        </div>
        <button onClick={() => { setMode('edit'); setText(resume) }} className="text-xs font-semibold text-green-700 hover:text-green-900 border border-green-300 hover:border-green-400 px-3 py-1.5 rounded-lg transition-colors">
          Update resume
        </button>
      </div>
    )
  }

  if (mode === 'view' && !resume) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Sparkles size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Add your resume</p>
            <p className="text-xs text-amber-700">Get personalized job recommendations and AI resume tailoring</p>
          </div>
        </div>
        <button onClick={() => setMode('edit')} className="text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 px-4 py-2 rounded-lg transition-colors">
          Add resume
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{resume ? 'Update your resume' : 'Add your resume'}</h3>
        {resume && <button onClick={() => setMode('view')} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>}
      </div>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer mb-3 transition-colors ${isDragActive ? 'border-amber-400 bg-amber-50' : fileName ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-amber-300'}`}>
        <input {...getInputProps()} />
        {fileLoading ? (
          <><div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-1" /><p className="text-sm text-slate-500">Reading PDF...</p></>
        ) : fileName ? (
          <><FileText size={20} className="mx-auto text-green-500 mb-1" /><p className="text-sm font-medium text-green-700">{fileName} · click to replace</p></>
        ) : (
          <><Upload size={20} className="mx-auto text-slate-400 mb-1" /><p className="text-sm text-slate-500">Drop PDF or .txt, or click to upload</p></>
        )}
      </div>
      <p className="text-xs text-slate-400 text-center mb-3">— or paste below —</p>
      <textarea value={text} onChange={e => setText(e.target.value.slice(0, 8000))} rows={6} placeholder="Paste your resume here..." className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none resize-none mb-1" />
      <p className="text-xs text-slate-400 text-right mb-3">{text.length}/8000</p>
      <button onClick={handleSave} disabled={!text.trim() || saving} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-colors">
        {saving ? 'Saving...' : 'Save resume'}
      </button>
    </div>
  )
}

// ── Tailor modal ──────────────────────────────────────────────────────────────
function computeModalScore(resumeText, job) {
  const words = new Set(
    (resumeText.toLowerCase().match(/\b[a-z+#]{2,}\b/g) || []).filter(w => !STOPWORDS.has(w))
  )
  const terms = (job.title).toLowerCase().match(/\b[a-z+#]{2,}\b/g) || []
  const meaningful = terms.filter(w => !STOPWORDS.has(w))
  if (!meaningful.length) return 25
  const matches = meaningful.filter(w => words.has(w)).length
  return Math.min(Math.round((matches / meaningful.length) * 100), 98)
}

function TailorModal({ job, resume, onClose }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const matchScore = computeModalScore(resume, job)

  useEffect(() => {
    const generate = async () => {
      const prompt = `You are a career coach helping a student tailor their resume for an internship.

Job: ${job.title} at ${job.company_name}
${job.locations?.length ? `Location: ${job.locations[0]}` : ''}

Student resume:
---
${resume.slice(0, 4000)}
---

Give specific tailoring advice. Return JSON with:
- summary: 1 honest sentence on overall fit for this specific role
- strengths: array of 2-3 specific strings (what already aligns well with this role)
- improvements: array of 3-4 specific bullet point rewrites or additions for this role
- keywords: array of 6-8 keywords to weave in based on this company and role

Return ONLY valid JSON.`
      try {
        const text = await chat(prompt, 900)
        setResult(parseJSON(text))
      } catch (e) {
        setError('AI generation failed. Check your OpenRouter key.')
      } finally {
        setLoading(false)
      }
    }
    generate()
  }, [])

  const scoreColor = matchScore >= 60 ? 'text-green-600' : matchScore >= 35 ? 'text-amber-600' : 'text-red-500'
  const scoreBg = matchScore >= 60 ? 'bg-green-50 border-green-200' : matchScore >= 35 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{job.company_name}</p>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{job.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-4"><X size={18} /></button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Analyzing your resume against this role...</p>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm text-center py-8">{error}</p>
          ) : result && (
            <div className="space-y-5">
              {/* Score */}
              <div className={`rounded-xl border p-4 flex items-center gap-4 ${scoreBg}`}>
                <p className={`text-4xl font-black ${scoreColor}`}>{matchScore}</p>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Match score</p>
                  <p className="text-sm text-slate-700 mt-0.5">{result.summary}</p>
                </div>
              </div>

              {/* Strengths */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">What's already strong</p>
                <ul className="space-y-1.5">
                  {result.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Suggested improvements</p>
                <ul className="space-y-2">
                  {result.improvements?.map((imp, i) => (
                    <li key={i} className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-slate-800">{imp}</li>
                  ))}
                </ul>
              </div>

              {/* Keywords */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Keywords to include</p>
                <div className="flex flex-wrap gap-2">
                  {result.keywords?.map(k => (
                    <span key={k} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">{k}</span>
                  ))}
                </div>
              </div>

              <a href={job.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-sm transition-colors w-full mt-2">
                Apply now <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Opportunities() {
  const { user } = useAuth()
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeCategory, setActiveCategory] = useState('swe')
  const [query, setQuery] = useState('')
  const [sponsorOnly, setSponsorOnly] = useState(false)
  const [usOnly, setUsOnly] = useState(true)
  const [visibleCount, setVisibleCount] = useState(30)
  const [resume, setResume] = useState('')
  const [resumeLoaded, setResumeLoaded] = useState(false)
  const [tailorJob, setTailorJob] = useState(null)
  const [alertedCompanies, setAlertedCompanies] = useState(new Set())

  // Load listings
  useEffect(() => {
    fetch(LISTINGS_URL)
      .then(r => r.json())
      .then(data => {
        const active = data.filter(d => d.active && d.is_visible)
        const categorized = active.map(d => ({ ...d, category: categorize(d.title) }))
        categorized.sort((a, b) => (b.date_posted || 0) - (a.date_posted || 0))
        setAll(categorized)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // Load stored resume + alert subscriptions
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('resume_text').eq('id', user.id).single()
      .then(({ data }) => { if (data?.resume_text) setResume(data.resume_text) })
      .finally(() => setResumeLoaded(true))
    supabase.from('job_alerts').select('company_name').eq('user_id', user.id)
      .then(({ data }) => setAlertedCompanies(new Set((data || []).map(a => a.company_name))))
  }, [user])

  const toggleAlert = async (companyName) => {
    const alerted = alertedCompanies.has(companyName)
    if (alerted) {
      await supabase.from('job_alerts').delete().eq('user_id', user.id).eq('company_name', companyName)
      setAlertedCompanies(prev => { const s = new Set(prev); s.delete(companyName); return s })
    } else {
      await supabase.from('job_alerts').insert({ user_id: user.id, company_name: companyName })
      setAlertedCompanies(prev => new Set([...prev, companyName]))
    }
  }

  const saveResume = async (text) => {
    await supabase.from('profiles').update({ resume_text: text }).eq('id', user.id)
    setResume(text)
  }

  const categoryCounts = useMemo(() =>
    Object.fromEntries(CATEGORIES.map(c => [c.id, all.filter(r => r.category === c.id).length])),
    [all]
  )

  const filtered = useMemo(() => all.filter(r => {
    if (r.category !== activeCategory) return false
    if (sponsorOnly && r.sponsorship !== 'Offers Sponsorship') return false
    if (usOnly && isCanadaOnly(r.locations)) return false
    if (query) {
      const q = query.toLowerCase()
      return r.company_name?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q) || r.locations?.some(l => l.toLowerCase().includes(q))
    }
    return true
  }), [all, activeCategory, query, sponsorOnly, usOnly])

  // Score + sort jobs by resume match
  const scoredJobs = useMemo(() => {
    if (!resume) return filtered.map(j => ({ ...j, score: 0, recommended: false }))
    return filtered
      .map(j => { const score = scoreResume(resume, j); return { ...j, score, recommended: score >= 0.5 } })
      .sort((a, b) => b.score - a.score)
  }, [filtered, resume])

  const visible = scoredJobs.slice(0, visibleCount)
  const recommendedCount = scoredJobs.filter(j => j.recommended).length
  const activeCat = CATEGORIES.find(c => c.id === activeCategory)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
            <Briefcase size={14} />Summer 2026 Internships
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Internship openings</h1>
          <p className="text-slate-500 text-sm">
            {loading ? 'Loading...' : `${all.length.toLocaleString()} active roles · `}
            {!loading && <a href="https://github.com/SimplifyJobs/Summer2026-Internships" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline font-medium">SimplifyJobs ↗</a>}
            {resume && recommendedCount > 0 && !loading && <span className="ml-2 text-green-600 font-medium">· {recommendedCount} recommended for you</span>}
          </p>
        </div>

        {/* Resume panel */}
        {resumeLoaded && <ResumePanel resume={resume} onSave={saveResume} />}

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const active = activeCategory === cat.id
            return (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setVisibleCount(30) }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${active ? `${cat.bg} ${cat.color} ${cat.border} shadow-sm` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                <Icon size={14} />{cat.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/60' : 'bg-slate-100 text-slate-500'}`}>{(categoryCounts[cat.id] || 0).toLocaleString()}</span>
              </button>
            )
          })}
        </div>

        {/* Search + filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={query} onChange={e => { setQuery(e.target.value); setVisibleCount(30) }}
              placeholder="Search companies, roles, locations..."
              className="w-full bg-white border border-slate-200 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors shadow-sm" />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={15} /></button>}
          </div>
          <button onClick={() => setUsOnly(!usOnly)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm ${usOnly ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            🇺🇸 US only
          </button>
          <button onClick={() => setSponsorOnly(!sponsorOnly)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm ${sponsorOnly ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            <Globe size={15} />Sponsors visa
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          {loading ? '...' : `${scoredJobs.length.toLocaleString()} ${activeCat?.label} role${scoredJobs.length !== 1 ? 's' : ''}`}
          {resume && recommendedCount > 0 && <span className="ml-2 text-green-600">· {recommendedCount} match your resume</span>}
        </p>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : scoredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <p className="font-semibold text-slate-600 mb-1">No roles found</p>
            <p className="text-sm text-slate-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map(role => (
                <RoleCard
                  key={role.id}
                  role={role}
                  cat={activeCat}
                  hasResume={!!resume}
                  onTailor={() => setTailorJob(role)}
                  alerted={alertedCompanies.has(role.company_name)}
                  onToggleAlert={() => toggleAlert(role.company_name)}
                />
              ))}
            </div>
            {scoredJobs.length > visibleCount && (
              <div className="text-center mt-8">
                <button onClick={() => setVisibleCount(v => v + 30)}
                  className="bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-medium px-6 py-3 rounded-xl text-sm transition-colors shadow-sm">
                  Load more ({scoredJobs.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {tailorJob && (
        <TailorModal job={tailorJob} resume={resume} onClose={() => setTailorJob(null)} />
      )}
    </div>
  )
}

function RoleCard({ role, cat, hasResume, onTailor, alerted, onToggleAlert }) {
  const location = role.locations?.length > 1 ? `${role.locations[0]} +${role.locations.length - 1}` : role.locations?.[0]
  const sponsors = role.sponsorship === 'Offers Sponsorship'
  const isRecommended = role.recommended

  return (
    <div className={`bg-white rounded-2xl border transition-all flex flex-col gap-3 p-5 shadow-sm relative ${isRecommended ? 'border-green-300 ring-1 ring-green-200 shadow-green-50' : 'border-slate-200 hover:border-amber-300 hover:shadow-md'}`}>
      {isRecommended && (
        <div className="absolute -top-2.5 left-4">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-green-500 px-2.5 py-0.5 rounded-full shadow-sm">
            <Star size={9} className="fill-white" />Recommended
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mt-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-9 h-9 rounded-lg ${isRecommended ? 'bg-green-100 text-green-700' : cat?.bg || 'bg-slate-100'} flex items-center justify-center flex-shrink-0 text-sm font-black ${!isRecommended ? (cat?.color || 'text-slate-600') : ''}`}>
            {role.company_name?.[0] || '?'}
          </div>
          <span className="font-semibold text-slate-900 text-sm truncate">{role.company_name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={e => { e.preventDefault(); onToggleAlert() }}
            title={alerted ? `Stop alerts for ${role.company_name}` : `Get notified when ${role.company_name} posts new roles`}
            className={`transition-colors ${alerted ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
          >
            {alerted ? <Bell size={14} className="fill-amber-400" /> : <Bell size={14} />}
          </button>
          <a href={role.url || '#'} target={role.url ? '_blank' : undefined} rel="noreferrer" className="text-slate-300 hover:text-amber-500 transition-colors">
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{role.title}</p>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-auto">
        {location && <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} />{location}</span>}
        {role.date_posted && <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={11} />{timeAgo(role.date_posted)}</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        {sponsors ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            <CheckCircle size={10} />Sponsors visa
          </span>
        ) : <span />}

        {hasResume && (
          <button onClick={onTailor}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0">
            <Wand2 size={11} />Tailor resume
          </button>
        )}
      </div>
    </div>
  )
}
