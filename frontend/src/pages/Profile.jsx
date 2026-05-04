import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { Star, Bookmark, Settings, Trash2, Edit3, Shield, ChevronRight, Award } from 'lucide-react'
import { Link } from 'react-router-dom'

const TIERS = [
  { name: 'Lurker', min: 0, max: 9, color: 'text-slate-500', bg: 'bg-slate-100' },
  { name: 'Contributor', min: 10, max: 29, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Insider', min: 30, max: 79, color: 'text-violet-600', bg: 'bg-violet-100' },
  { name: 'Legend', min: 80, max: Infinity, color: 'text-amber-600', bg: 'bg-amber-100' },
]
const getTier = (score) => TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0]

export default function Profile() {
  const { user, logout, updateUser } = useAuth()
  const [tab, setTab] = useState('reviews')
  const [reviews, setReviews] = useState([])
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingSettings, setEditingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ name: user?.name || '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const score = reviews.length * 10
  const tier = getTier(score)
  const nextTier = TIERS[TIERS.indexOf(tier) + 1]
  const progressToNext = nextTier ? ((score - tier.min) / (nextTier.min - tier.min)) * 100 : 100

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('reviews').select('*, companies(name)').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setReviews((data || []).map(r => ({ ...r, company_name: r.companies?.name })))),
      supabase.from('saved_companies').select('*, companies(*)').eq('user_id', user.id)
        .then(({ data }) => setSaved((data || []).map(s => s.companies).filter(Boolean))),
    ]).finally(() => setLoading(false))
  }, [user])

  const handleDeleteReview = async (id) => {
    await supabase.from('reviews').delete().eq('id', id)
    setReviews(rs => rs.filter(r => r.id !== id))
  }

  const handleUnsave = async (companyId) => {
    await supabase.from('saved_companies').delete().eq('user_id', user.id).eq('company_id', companyId)
    setSaved(s => s.filter(c => c.id !== companyId))
  }

  const handleSaveSettings = async () => {
    await updateUser(settingsForm)
    setEditingSettings(false)
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black text-xl flex-shrink-0">{initials}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900">{user?.name}</h1>
                  <p className="text-slate-500 text-sm">{user?.university} · {user?.major} · Class of {user?.grad_year}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${tier.bg} ${tier.color}`}>
                  <Award size={14} />{tier.name}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-500">Contribution score: {score} pts</span>
                  {nextTier && <span className="text-xs text-slate-400">{nextTier.min - score} pts to {nextTier.name}</span>}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(progressToNext, 100)}%` }} />
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-slate-700"><span className="font-bold">{reviews.length}</span> review{reviews.length !== 1 ? 's' : ''}</span>
                  <span className="text-slate-700"><span className="font-bold">{saved.length}</span> saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 mb-6">
          {[{ id: 'reviews', label: 'My Reviews', icon: <Star size={14} />, count: reviews.length }, { id: 'saved', label: 'Saved', icon: <Bookmark size={14} />, count: saved.length }, { id: 'settings', label: 'Settings', icon: <Settings size={14} /> }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors ${tab === t.id ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
              {t.count !== undefined && <span className={`text-xs rounded-full px-1.5 ${tab === t.id ? 'bg-black/10' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'reviews' && (
          <div className="space-y-4">
            {loading ? <div className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" /> :
              reviews.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                  <Star size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-600 mb-1">No reviews yet</p>
                  <p className="text-sm text-slate-400 mb-5">Share your experience and help others.</p>
                  <Link to="/submit-review" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">Write your first review</Link>
                </div>
              ) : reviews.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{r.company_name} · {r.role_title}</p>
                      <p className="text-sm text-slate-500">{r.internship_year}</p>
                      {r.one_line_summary && <p className="text-sm text-slate-600 mt-2 italic">"{r.one_line_summary}"</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleDeleteReview(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'saved' && (
          <div className="space-y-3">
            {loading ? <div className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" /> :
              saved.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                  <Bookmark size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-600 mb-1">No saved companies</p>
                  <Link to="/search" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors mt-5 inline-block">Browse companies</Link>
                </div>
              ) : saved.map(c => (
                <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white font-bold flex-shrink-0">{c.name[0]}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.review_count} reviews · ★ {c.avg_rating?.toFixed(1)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/company/${c.id}`} className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">View <ChevronRight size={12} /></Link>
                    <button onClick={() => handleUnsave(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900">Account information</h2>
                <button onClick={() => setEditingSettings(!editingSettings)} className="text-sm font-medium text-amber-600 hover:text-amber-700">{editingSettings ? 'Cancel' : 'Edit'}</button>
              </div>
              {editingSettings ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full name</label>
                    <input value={settingsForm.name} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none" />
                  </div>
                  <button onClick={handleSaveSettings} className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">Save changes</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[['Name', user?.name], ['Email', user?.email], ['University', user?.university], ['Grad year', user?.grad_year], ['Major', user?.major]].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-sm font-medium text-slate-900">{val || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h2 className="font-bold text-red-800 flex items-center gap-2 mb-2"><Shield size={16} />Danger zone</h2>
              <p className="text-sm text-red-700 mb-4">Your reviews stay but your personal info is removed.</p>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="text-sm font-semibold text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 px-4 py-2 rounded-xl transition-colors">Delete my account</button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-red-700">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-3">
                    <button onClick={async () => {
                      try {
                        const { data: { session } } = await supabase.auth.getSession()
                        const res = await fetch('/api/delete-account', {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${session.access_token}` },
                        })
                        const data = await res.json()
                        if (!res.ok) { alert('Failed to delete: ' + data.error); return }
                        await logout()
                      } catch (err) { alert('Error: ' + err.message) }
                    }} className="bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">Yes, delete</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-600 text-sm font-medium">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
