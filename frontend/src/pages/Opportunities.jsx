import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import {
  Briefcase, Code2, LineChart, Database, DollarSign, Cpu,
  ExternalLink, MapPin, Building2, Search, X, SlidersHorizontal,
  Globe, CheckCircle, Clock
} from 'lucide-react'

const LISTINGS_URL =
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json'

const CATEGORIES = [
  {
    id: 'swe',
    label: 'Software Engineering',
    icon: Code2,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    keywords: ['software', 'engineer', 'swe', 'developer', 'backend', 'frontend', 'full stack', 'fullstack', 'web', 'ios', 'android', 'mobile', 'platform', 'infrastructure', 'devops', 'reliability', 'cloud'],
  },
  {
    id: 'pm',
    label: 'Product Management',
    icon: LineChart,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    keywords: ['product manager', 'product management', 'pm intern', 'associate product', 'apm'],
  },
  {
    id: 'data',
    label: 'Data Science & ML',
    icon: Database,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    keywords: ['data science', 'machine learning', 'ml', 'artificial intelligence', 'ai', 'data engineer', 'data analyst', 'analytics', 'nlp', 'deep learning', 'research scientist', 'applied scientist'],
  },
  {
    id: 'quant',
    label: 'Quant & Finance',
    icon: DollarSign,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    keywords: ['quant', 'quantitative', 'trading', 'finance', 'investment', 'risk', 'algorithmic', 'financial engineer'],
  },
  {
    id: 'hardware',
    label: 'Hardware & Systems',
    icon: Cpu,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    keywords: ['hardware', 'electrical', 'embedded', 'fpga', 'vlsi', 'chip', 'silicon', 'firmware', 'asic', 'rf', 'signal processing'],
  },
]

function categorize(title) {
  const t = title.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => t.includes(k))) return cat.id
  }
  return 'swe' // default
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

export default function Opportunities() {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeCategory, setActiveCategory] = useState('swe')
  const [query, setQuery] = useState('')
  const [sponsorOnly, setSponsorOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(30)

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

  const categoryCounts = useMemo(() => {
    return Object.fromEntries(CATEGORIES.map(c => [c.id, all.filter(r => r.category === c.id).length]))
  }, [all])

  const filtered = useMemo(() => {
    return all.filter(r => {
      if (r.category !== activeCategory) return false
      if (sponsorOnly && r.sponsorship !== 'Offers Sponsorship') return false
      if (query) {
        const q = query.toLowerCase()
        return r.company_name?.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.locations?.some(l => l.toLowerCase().includes(q))
      }
      return true
    })
  }, [all, activeCategory, query, sponsorOnly])

  const visible = filtered.slice(0, visibleCount)
  const activeCat = CATEGORIES.find(c => c.id === activeCategory)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
            <Briefcase size={14} />Summer 2026 Internships
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Internship openings</h1>
          <p className="text-slate-500 text-sm">
            {loading ? 'Loading from SimplifyJobs...' : error ? 'Could not load listings.' : `${all.length.toLocaleString()} active roles · powered by `}
            {!loading && !error && (
              <a href="https://github.com/SimplifyJobs/Summer2026-Internships" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline font-medium">SimplifyJobs ↗</a>
            )}
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const active = activeCategory === cat.id
            const count = categoryCounts[cat.id] || 0
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setVisibleCount(30) }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  active
                    ? `${cat.bg} ${cat.color} ${cat.border} shadow-sm`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon size={14} />
                {cat.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/60' : 'bg-slate-100 text-slate-500'}`}>
                  {count.toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search + filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setVisibleCount(30) }}
              placeholder="Search companies, roles, locations..."
              className="w-full bg-white border border-slate-200 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors shadow-sm"
            />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={15} /></button>}
          </div>
          <button
            onClick={() => setSponsorOnly(!sponsorOnly)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm ${
              sponsorOnly ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Globe size={15} />
            Sponsors visa
          </button>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {loading ? '...' : `${filtered.length.toLocaleString()} ${activeCat?.label} role${filtered.length !== 1 ? 's' : ''}`}
            {query && <span className="ml-1">for "<span className="font-medium text-slate-700">{query}</span>"</span>}
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="font-semibold text-slate-600 mb-1">Could not load listings</p>
            <p className="text-sm text-slate-400">Check your internet connection and try refreshing.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <p className="font-semibold text-slate-600 mb-1">No roles found</p>
            <p className="text-sm text-slate-400">Try adjusting your search or removing filters.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map(role => <RoleCard key={role.id} role={role} cat={activeCat} />)}
            </div>
            {filtered.length > visibleCount && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount(v => v + 30)}
                  className="bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-medium px-6 py-3 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Load more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function RoleCard({ role, cat }) {
  const locations = role.locations || []
  const location = locations.length > 1 ? `${locations[0]} +${locations.length - 1}` : locations[0]
  const sponsors = role.sponsorship === 'Offers Sponsorship'

  return (
    <a
      href={role.url || '#'}
      target={role.url ? '_blank' : undefined}
      rel="noreferrer"
      className="group bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md rounded-2xl p-5 transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-9 h-9 rounded-lg ${cat?.bg || 'bg-slate-100'} flex items-center justify-center flex-shrink-0 text-sm font-black ${cat?.color || 'text-slate-600'}`}>
            {role.company_name?.[0] || '?'}
          </div>
          <span className="font-semibold text-slate-900 text-sm truncate">{role.company_name}</span>
        </div>
        <ExternalLink size={14} className="text-slate-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{role.title}</p>

      <div className="flex flex-wrap gap-2 mt-auto">
        {location && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={11} />{location}
          </span>
        )}
        {role.date_posted && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={11} />{timeAgo(role.date_posted)}
          </span>
        )}
      </div>

      {sponsors && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full w-fit">
          <CheckCircle size={10} />Sponsors visa
        </span>
      )}
    </a>
  )
}
