import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CompanyCard from '../components/CompanyCard'
import { Search as SearchIcon, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import api from '../lib/api'

const ROLES = ['SWE', 'PM', 'Data Science', 'ML / AI', 'Design', 'DevOps', 'Finance', 'Marketing']
const TECH_TAGS = ['Python', 'JavaScript', 'TypeScript', 'React', 'Go', 'Java', 'C++', 'Rust', 'SQL', 'Kubernetes', 'AWS', 'ML/PyTorch']
const SORT_OPTIONS = [
  { value: 'most_reviewed', label: 'Most reviewed' },
  { value: 'highest_rated', label: 'Highest rated' },
  { value: 'most_recent', label: 'Most recent' },
  { value: 'best_new_grads', label: 'Best for new grads' },
]

const MOCK_COMPANIES = [
  { id: 1, name: 'Stripe', industry: 'Fintech', avg_rating: 4.7, review_count: 312, top_tags: ['Go', 'Ruby', 'TypeScript'], ai_teaser: 'Small teams, real ownership. Interns ship to production regularly.' },
  { id: 2, name: 'Google', industry: 'Technology', avg_rating: 4.5, review_count: 1204, top_tags: ['Python', 'C++', 'Go'], ai_teaser: 'World-class engineers, but teams vary wildly. Pick your host carefully.' },
  { id: 3, name: 'Meta', industry: 'Technology', avg_rating: 4.2, review_count: 847, top_tags: ['React', 'Python', 'Hack'], ai_teaser: 'Fast-paced and performance-driven. Strong comp, meaningful projects.' },
  { id: 4, name: 'Amazon', industry: 'Technology', avg_rating: 3.8, review_count: 2103, top_tags: ['Java', 'AWS', 'Python'], ai_teaser: 'LP-heavy culture. Experience varies significantly by team and manager.' },
  { id: 5, name: 'Microsoft', industry: 'Technology', avg_rating: 4.3, review_count: 1580, top_tags: ['C#', 'TypeScript', 'Azure'], ai_teaser: 'Great WLB. Large teams but strong mentorship and clear project scope.' },
  { id: 6, name: 'Airbnb', industry: 'Travel/Tech', avg_rating: 4.4, review_count: 193, top_tags: ['Ruby', 'React', 'Kotlin'], ai_teaser: 'Beautiful culture. Lots of eng autonomy. Post-layoffs, leaner but focused.' },
  { id: 7, name: 'Figma', industry: 'Design Tools', avg_rating: 4.8, review_count: 88, top_tags: ['C++', 'TypeScript', 'WebGL'], ai_teaser: 'Tiny intern class, huge impact. Very selective but worth it.' },
  { id: 8, name: 'Netflix', industry: 'Streaming', avg_rating: 4.6, review_count: 241, top_tags: ['Java', 'Python', 'Spark'], ai_teaser: 'Freedom and responsibility taken seriously. High bar, minimal process.' },
  { id: 9, name: 'Uber', industry: 'Mobility', avg_rating: 4.0, review_count: 389, top_tags: ['Go', 'Python', 'Kafka'], ai_teaser: 'Technical depth is real. Distributed systems everywhere.' },
  { id: 10, name: 'Lyft', industry: 'Mobility', avg_rating: 3.9, review_count: 156, top_tags: ['Python', 'React', 'Kotlin'], ai_teaser: 'Smaller than Uber, more cohesive culture. Good for PMs and engineers alike.' },
  { id: 11, name: 'Snowflake', industry: 'Data/Cloud', avg_rating: 4.5, review_count: 134, top_tags: ['C++', 'Java', 'Python'], ai_teaser: 'Exceptional for data infra roles. Fast-growing, very technical.' },
  { id: 12, name: 'Databricks', industry: 'Data/AI', avg_rating: 4.6, review_count: 97, top_tags: ['Scala', 'Python', 'Spark'], ai_teaser: 'Startup energy with strong infra. Interns own real projects end to end.' },
]

function DifficultySlider({ value, onChange }) {
  const labels = ['Any', 'Easy', 'Medium', 'Hard', 'Very Hard']
  return (
    <div>
      <input
        type="range" min={0} max={4} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-amber-500 h-1.5 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  )
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedRoles, setSelectedRoles] = useState([])
  const [selectedTech, setSelectedTech] = useState([])
  const [difficulty, setDifficulty] = useState(0)
  const [sort, setSort] = useState('most_reviewed')
  const [companies, setCompanies] = useState(MOCK_COMPANIES)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const params = { q: query, roles: selectedRoles, tech: selectedTech, difficulty, sort }
      const res = await api.get('/api/companies/search', { params })
      setCompanies(res.data)
    } catch {
      // keep mock data on error
    } finally {
      setLoading(false)
    }
  }, [query, selectedRoles, selectedTech, difficulty, sort])

  useEffect(() => {
    const t = setTimeout(fetchCompanies, 300)
    return () => clearTimeout(t)
  }, [fetchCompanies])

  const toggleRole = (r) => setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  const toggleTech = (t) => setSelectedTech(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const activeFilterCount = selectedRoles.length + selectedTech.length + (difficulty > 0 ? 1 : 0)

  const filtered = companies.filter(c => {
    if (!query) return true
    return c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.industry?.toLowerCase().includes(query.toLowerCase()) ||
      c.top_tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Find your company</h1>
          <p className="text-slate-500">Search and filter across {companies.length}+ companies with intern reviews.</p>
        </div>

        {/* Search + filter bar */}
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
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={15} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-medium transition-colors shadow-sm ${
              showFilters || activeFilterCount > 0
                ? 'bg-amber-500 border-amber-500 text-black'
                : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters{activeFilterCount > 0 && <span className="bg-black text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-700 outline-none shadow-sm"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Role type</h3>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      onClick={() => toggleRole(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedRoles.includes(r)
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tech stack</h3>
                <div className="flex flex-wrap gap-2">
                  {TECH_TAGS.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleTech(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedTech.includes(t)
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Interview difficulty
                </h3>
                <DifficultySlider value={difficulty} onChange={setDifficulty} />
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setSelectedRoles([]); setSelectedTech([]); setDifficulty(0) }}
                    className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {loading ? 'Searching...' : `${filtered.length} companies`}
          </p>
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedRoles.map(r => (
                <span key={r} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  {r} <button onClick={() => toggleRole(r)}><X size={10} /></button>
                </span>
              ))}
              {selectedTech.map(t => (
                <span key={t} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {t} <button onClick={() => toggleTech(t)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Company grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => <CompanyCard key={c.id} company={c} />)}
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
