import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import CompanyCard from '../components/CompanyCard'
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react'

const ROLES = ['SWE', 'PM', 'Data Science', 'ML / AI', 'Design', 'DevOps', 'Finance', 'Marketing']
const TECH_TAGS = ['Python', 'JavaScript', 'TypeScript', 'React', 'Go', 'Java', 'C++', 'Rust', 'SQL', 'Kubernetes', 'AWS', 'ML/PyTorch']
const SORT_OPTIONS = [
  { value: 'review_count', label: 'Most reviewed' },
  { value: 'avg_rating', label: 'Highest rated' },
  { value: 'created_at', label: 'Most recent' },
]

export default function Search() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [selectedRoles, setSelectedRoles] = useState([])
  const [selectedTech, setSelectedTech] = useState([])
  const [sort, setSort] = useState('review_count')
  const [companies, setCompanies] = useState([])
  const [savedIds, setSavedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('saved_companies').select('company_id').eq('user_id', user.id)
      .then(({ data }) => setSavedIds(new Set((data || []).map(s => s.company_id))))
  }, [user])

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('companies').select('*').order(sort, { ascending: false })
    if (query) q = q.ilike('name', `%${query}%`)
    const { data } = await q.limit(60)
    setCompanies(data || [])
    setLoading(false)
  }, [query, sort])

  useEffect(() => {
    const t = setTimeout(fetchCompanies, 250)
    return () => clearTimeout(t)
  }, [fetchCompanies])

  const filtered = companies.filter(c => {
    if (selectedTech.length > 0 && !selectedTech.some(t => c.top_tags?.includes(t))) return false
    return true
  })

  const toggleRole = (r) => setSelectedRoles(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])
  const toggleTech = (t) => setSelectedTech(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])
  const activeFilterCount = selectedRoles.length + selectedTech.length

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Find your company</h1>
          <p className="text-slate-500">Search across {companies.length}+ companies with intern reviews.</p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <SearchIcon size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies, roles, tech stacks..."
              className="w-full bg-white border border-slate-200 focus:border-amber-400 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors shadow-sm"
            />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={15} /></button>}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-medium transition-colors shadow-sm ${showFilters || activeFilterCount > 0 ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'}`}
          >
            <SlidersHorizontal size={15} />
            Filters{activeFilterCount > 0 && <span className="bg-black text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-700 outline-none shadow-sm">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Role type</h3>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => toggleRole(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedRoles.includes(r) ? 'bg-amber-500 text-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tech stack</h3>
                <div className="flex flex-wrap gap-2">
                  {TECH_TAGS.map(t => (
                    <button key={t} onClick={() => toggleTech(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedTech.includes(t) ? 'bg-amber-500 text-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t}</button>
                  ))}
                </div>
                {activeFilterCount > 0 && <button onClick={() => { setSelectedRoles([]); setSelectedTech([]) }} className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium">Clear filters</button>}
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-500 mb-4">{loading ? 'Searching...' : `${filtered.length} companies`}</p>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(9).fill(0).map((_, i) => <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => <CompanyCard key={c.id} company={{ ...c, is_saved: savedIds.has(c.id) }} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg font-medium mb-2">No companies found</p>
            <p className="text-slate-500 text-sm">Try a different search or adjust your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
