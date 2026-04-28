import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../lib/supabase'
import { chat, parseJSON } from '../lib/openrouter'
import Navbar from '../components/Navbar'
import { Upload, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const ROLES = ['Software Engineer Intern', 'PM Intern', 'Data Science Intern', 'ML Engineer Intern',
  'Design Intern', 'DevOps/Infrastructure Intern', 'Finance Intern', 'Research Intern']

function ScoreRing({ score, size = 120, strokeWidth = 10 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
        fill={color} fontSize={size/4} fontWeight="900" fontFamily="Inter, sans-serif">
        {score}
      </text>
    </svg>
  )
}

function ScoreRow({ label, score }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`${color} rounded-full h-2 transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold text-slate-800 w-8 text-right">{score}</span>
    </div>
  )
}

export default function ResumeFit() {
  const [resumeText, setResumeText] = useState('')
  const [companies, setCompanies] = useState([])
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [companiesLoaded, setCompaniesLoaded] = useState(false)

  const loadCompanies = async () => {
    if (companiesLoaded) return
    const { data } = await supabase.from('companies').select('id, name').order('name')
    setCompanies(data || [])
    setCompaniesLoaded(true)
  }

  const onDrop = useCallback(files => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setResumeText(e.target.result)
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !company || !role) {
      setError('Please add your resume, pick a company, and select a role.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data: companyData } = await supabase.from('companies').select('ai_overview').eq('name', company).single()
      const context = companyData?.ai_overview ? `Company context: ${companyData.ai_overview}\n\n` : ''
      const prompt = `You are an expert resume reviewer for tech internships.

${context}A student is applying for a ${role} position at ${company}.

Resume:
---
${resumeText.slice(0, 4000)}
---

Return a JSON object with exactly:
- overall_score: int 0-100
- skills_score: int 0-100
- experience_score: int 0-100
- project_score: int 0-100
- strengths: array of 2-4 specific strength strings
- gaps: array of 2-4 specific gap strings
- suggestions: array of 3-5 actionable suggestion strings

Be honest and specific. Return ONLY valid JSON.`

      const text = await chat(prompt, 1024)
      setResult(parseJSON(text))
    } catch (err) {
      setError(err.message || 'AI analysis failed. Check your OpenRouter API key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <Zap size={12} />AI-powered
          </div>
          <h1 className="text-2xl font-black text-slate-900">Resume Fit Scorer</h1>
          <p className="text-slate-500 mt-1">See how your resume stacks up against what past interns at your target company actually had.</p>
        </div>

        {!result ? (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-bold text-slate-900 mb-4">Your resume</h2>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${isDragActive ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-300'}`}
              >
                <input {...getInputProps()} />
                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-600">Drop your resume here, or click to upload</p>
                <p className="text-xs text-slate-400 mt-1">.txt or .pdf · 5000 char max</p>
              </div>
              <p className="text-xs text-slate-500 text-center mb-3">— or paste it below —</p>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value.slice(0, 5000))}
                rows={8}
                placeholder="Paste your resume as plain text here..."
                className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none resize-none"
              />
              <p className="text-xs text-slate-400 text-right mt-1">{resumeText.length}/5000</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-bold text-slate-900 mb-4">Target role</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Company</label>
                  <select
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    onFocus={loadCompanies}
                    className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none appearance-none"
                  >
                    <option value="">Select company</option>
                    {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role type</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none appearance-none"
                  >
                    <option value="">Select role</option>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                <AlertCircle size={15} />{error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-colors text-sm"
            >
              {loading ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Analyzing...</> : <><Zap size={16} />Score my resume</>}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="flex flex-col items-center">
                  <ScoreRing score={result.overall_score} />
                  <p className="text-xs text-slate-500 mt-2 font-medium">Overall match</p>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <ScoreRow label="Skills match" score={result.skills_score} />
                  <ScoreRow label="Experience level" score={result.experience_score} />
                  <ScoreRow label="Project relevance" score={result.project_score} />
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3"><CheckCircle size={16} />What's working</h3>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700"><span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3"><XCircle size={16} />What's missing</h3>
              <ul className="space-y-2">
                {result.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700"><span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{g}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-3">Action items</h3>
              <ol className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-slate-700">{s}</p>
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full border border-slate-200 hover:border-amber-300 text-slate-600 hover:text-slate-900 font-medium py-3 rounded-2xl text-sm transition-colors"
            >
              Try a different resume or company
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
