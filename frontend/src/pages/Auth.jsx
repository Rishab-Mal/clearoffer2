import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'

const UNIVERSITIES = [
  'MIT', 'Stanford University', 'Harvard University', 'Carnegie Mellon University',
  'University of California, Berkeley', 'Caltech', 'Princeton University', 'Columbia University',
  'Cornell University', 'University of Michigan', 'University of Illinois Urbana-Champaign',
  'Georgia Institute of Technology', 'University of Texas at Austin', 'University of Washington',
  'Purdue University', 'Ohio State University', 'Penn State University', 'UCLA',
  'UC San Diego', 'UC Davis', 'University of Wisconsin-Madison', 'University of Minnesota',
  'Northwestern University', 'Yale University', 'Duke University', 'Rice University',
  'Vanderbilt University', 'University of Southern California', 'New York University',
  'Boston University', 'Northeastern University', 'University of Virginia',
  'University of North Carolina', 'University of Florida', 'Florida State University',
  'Texas A&M University', 'Arizona State University', 'University of Arizona',
  'University of Colorado Boulder', 'University of Maryland', 'Virginia Tech',
  'University of Pittsburgh', 'Case Western Reserve University', 'Tufts University',
  'Rensselaer Polytechnic Institute', 'Rochester Institute of Technology',
  'Worcester Polytechnic Institute', 'Rutgers University', 'Stony Brook University',
  'University at Buffalo', 'Indiana University', 'Michigan State University',
  'Iowa State University', 'University of Notre Dame', 'Wake Forest University',
  'Other',
]

const MAJORS = [
  'Computer Science', 'Electrical Engineering', 'Computer Engineering',
  'Software Engineering', 'Data Science', 'Mechanical Engineering',
  'Chemical Engineering', 'Civil Engineering', 'Biomedical Engineering',
  'Information Systems', 'Mathematics', 'Statistics', 'Physics',
  'Business Administration', 'Finance', 'Economics', 'Marketing',
  'Design / HCI', 'Cognitive Science', 'Other',
]

const YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]

// Trie for fast prefix search
class TrieNode {
  constructor() { this.children = {}; this.words = [] }
}
class Trie {
  constructor() { this.root = new TrieNode() }
  insert(word) {
    const key = word.toLowerCase()
    for (let i = 0; i < key.length; i++) {
      let node = this.root
      for (const ch of key.slice(i)) {
        if (!node.children[ch]) node.children[ch] = new TrieNode()
        node = node.children[ch]
        if (!node.words.includes(word)) node.words.push(word)
      }
    }
  }
  search(query) {
    if (!query) return []
    let node = this.root
    for (const ch of query.toLowerCase()) {
      if (!node.children[ch]) return []
      node = node.children[ch]
    }
    return node.words.slice(0, 8)
  }
}
const universityTrie = new Trie()
UNIVERSITIES.forEach(u => universityTrie.insert(u))

function validateEdu(email) {
  return email.trim().toLowerCase().endsWith('.edu')
}

function UniversitySearch({ value, onChange }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(!!value)

  const handleInput = (e) => {
    const q = e.target.value
    setQuery(q)
    setConfirmed(false)
    onChange('')
    setSuggestions(q.length >= 1 ? universityTrie.search(q) : [])
    setOpen(true)
  }

  const select = (uni) => {
    setQuery(uni)
    onChange(uni)
    setSuggestions([])
    setOpen(false)
    setConfirmed(true)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => { if (suggestions.length) setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search your university..."
        autoComplete="off"
        className={`w-full bg-lantern-bg border rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-colors ${confirmed ? 'border-amber-500' : 'border-lantern-border focus:border-amber-500'}`}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-lantern-card border border-lantern-border rounded-xl overflow-hidden shadow-xl">
          {suggestions.map(u => (
            <li
              key={u}
              onMouseDown={() => select(u)}
              className="px-4 py-2.5 text-sm text-slate-300 hover:bg-amber-500 hover:text-black cursor-pointer transition-colors"
            >
              {u}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'login' ? 'login' : 'signup')
  const [screen, setScreen] = useState('form') // 'form' | 'verify' | 'forgot' | 'forgot-sent'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)

  const { login, signup, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/dashboard') }, [user])

  const [form, setForm] = useState({
    email: '', password: '', name: '',
    university: '', grad_year: '', major: '',
  })

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (k === 'email') setEmailTouched(false)
    setError('')
  }

  const eduError = emailTouched && form.email && !validateEdu(form.email)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateEdu(form.email)) {
      setError('Please use a .edu email address.')
      setEmailTouched(true)
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        navigate('/dashboard')
      } else {
        await signup(form)
        setScreen('verify')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (screen === 'verify') return <VerifyScreen email={form.email} onResend={() => {}} />
  if (screen === 'forgot') return <ForgotScreen onBack={() => setScreen('form')} onSent={() => setScreen('forgot-sent')} />
  if (screen === 'forgot-sent') return <ForgotSentScreen onBack={() => setScreen('form')} />

  return (
    <div className="min-h-screen bg-lantern-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-amber-500">✦</span>
          <span className="font-black text-white text-lg tracking-tight">CLEAROFFER</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-lantern-card border border-lantern-border rounded-2xl p-8">
            <h1 className="text-2xl font-black text-white mb-1">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              {mode === 'signup'
                ? 'Join thousands of students getting the real scoop on internships.'
                : 'Log in to your ClearOffer account.'}
            </p>

            {/* Mode toggle */}
            <div className="flex bg-lantern-bg border border-lantern-border rounded-xl p-1 mb-6">
              {['signup', 'login'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError('') }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    mode === m ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'signup' ? 'Sign up' : 'Log in'}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  University email (.edu)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@university.edu"
                  required
                  className={`w-full bg-lantern-bg border rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-colors ${
                    eduError
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-lantern-border focus:border-amber-500'
                  }`}
                />
                {eduError && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={11} />
                    ClearOffer is only available to students with .edu emails.
                  </p>
                )}
              </div>

              {/* Sign up fields */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Your name"
                      required
                      className="w-full bg-lantern-bg border border-lantern-border focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">University</label>
                    <UniversitySearch value={form.university} onChange={v => { setForm(f => ({ ...f, university: v })); setError('') }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Grad year</label>
                      <select
                        value={form.grad_year}
                        onChange={set('grad_year')}
                        required
                        className="w-full bg-lantern-bg border border-lantern-border focus:border-amber-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors appearance-none"
                      >
                        <option value="" disabled>Year</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Major</label>
                      <select
                        value={form.major}
                        onChange={set('major')}
                        required
                        className="w-full bg-lantern-bg border border-lantern-border focus:border-amber-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors appearance-none"
                      >
                        <option value="" disabled>Major</option>
                        {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setScreen('forgot')} className="text-xs text-amber-500 hover:text-amber-400 font-medium">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                    required
                    minLength={mode === 'signup' ? 8 : undefined}
                    className="w-full bg-lantern-bg border border-lantern-border focus:border-amber-500 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 text-sm outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-colors text-sm mt-2"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'signup' ? 'Create account' : 'Log in'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-slate-600 text-xs">
                {mode === 'signup'
                  ? 'By signing up you agree to our Terms and Privacy Policy.'
                  : <span>Don't have an account?{' '}
                      <button onClick={() => setMode('signup')} className="text-amber-500 hover:text-amber-400 font-medium">
                        Sign up
                      </button>
                    </span>
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ForgotScreen({ onBack, onSent }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    onSent()
  }

  return (
    <div className="min-h-screen bg-lantern-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-lantern-card border border-lantern-border rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-amber-500">✦</span>
          <span className="font-black text-white text-lg tracking-tight">CLEAROFFER</span>
        </div>
        <h2 className="text-2xl font-black text-white mb-1">Reset password</h2>
        <p className="text-slate-500 text-sm mb-6">Enter your .edu email and we'll send a reset link.</p>
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={15} />{error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@university.edu"
            required
            className="w-full bg-lantern-bg border border-lantern-border focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <button onClick={onBack} className="mt-4 flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
          <ArrowLeft size={14} />Back to login
        </button>
      </div>
    </div>
  )
}

function ForgotSentScreen({ onBack }) {
  return (
    <div className="min-h-screen bg-lantern-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-lantern-card border border-lantern-border rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
          <Mail className="text-amber-500" size={28} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Check your inbox</h2>
        <p className="text-slate-400 text-sm mb-6">We sent a reset link to your email. Click it to set a new password.</p>
        <button onClick={onBack} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mx-auto">
          <ArrowLeft size={14} />Back to login
        </button>
      </div>
    </div>
  )
}

function VerifyScreen({ email, onResend }) {
  const [resent, setResent] = useState(false)
  const handleResend = () => { onResend(); setResent(true) }

  return (
    <div className="min-h-screen bg-lantern-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-lantern-card border border-lantern-border rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
          <Mail className="text-amber-500" size={28} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Check your inbox</h2>
        <p className="text-slate-400 text-sm mb-6">
          We sent a verification link to <span className="text-white font-medium">{email}</span>.
          Click the link to activate your account.
        </p>
        <div className="bg-lantern-bg border border-lantern-border rounded-xl p-4 mb-6">
          <p className="text-xs text-slate-500">Didn't get it? Check your spam folder or</p>
          {resent ? (
            <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-sm font-medium">
              <CheckCircle size={14} />Resent!
            </div>
          ) : (
            <button onClick={handleResend} className="mt-2 text-amber-500 hover:text-amber-400 text-sm font-semibold transition-colors">
              Resend verification email
            </button>
          )}
        </div>
        <Link to="/" className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
          <ArrowLeft size={14} />Back to home
        </Link>
      </div>
    </div>
  )
}
