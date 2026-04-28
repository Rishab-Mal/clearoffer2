import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsValidSession(true)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => navigate('/dashboard'), 2000)
  }

  if (!isValidSession) return (
    <div className="min-h-screen bg-lantern-bg flex items-center justify-center px-4">
      <div className="bg-lantern-card border border-lantern-border rounded-2xl p-8 max-w-md w-full text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-white font-bold text-lg mb-2">Invalid or expired link</h2>
        <p className="text-slate-400 text-sm mb-5">Request a new password reset from the login page.</p>
        <Link to="/auth" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors inline-block">
          Back to login
        </Link>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-lantern-bg flex items-center justify-center px-4">
      <div className="bg-lantern-card border border-lantern-border rounded-2xl p-8 max-w-md w-full text-center">
        <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
        <h2 className="text-white font-bold text-lg mb-2">Password updated</h2>
        <p className="text-slate-400 text-sm">Taking you to your dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-lantern-bg flex items-center justify-center px-4">
      <div className="bg-lantern-card border border-lantern-border rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-amber-500">✦</span>
          <span className="font-black text-white text-lg tracking-tight">LANTERN</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-1">Set new password</h1>
        <p className="text-slate-500 text-sm mb-6">Choose a strong password for your account.</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={15} />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full bg-lantern-bg border border-lantern-border focus:border-amber-500 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 text-sm outline-none transition-colors"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Same password again"
              required
              className="w-full bg-lantern-bg border border-lantern-border focus:border-amber-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm mt-2"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
