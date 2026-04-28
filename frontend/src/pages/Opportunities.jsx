import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../lib/api'
import { Briefcase, Code2, LineChart, Database, DollarSign, Cpu, ExternalLink, MapPin, Building2 } from 'lucide-react'

const SECTIONS = [
  { id: 'software', label: 'Software Engineering', icon: Code2, accent: 'text-sky-600', bg: 'bg-sky-50', ring: 'ring-sky-100' },
  { id: 'product', label: 'Product Management', icon: LineChart, accent: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-100' },
  { id: 'ai_ml_data', label: 'Data Science & Machine Learning', icon: Database, accent: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
  { id: 'quant', label: 'Quantitative Finance', icon: DollarSign, accent: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-100' },
  { id: 'hardware', label: 'Hardware Engineering', icon: Cpu, accent: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-100' },
]

export default function Opportunities() {
  const [roles, setRoles] = useState([])
  const [buckets, setBuckets] = useState({})
  const [cap, setCap] = useState(20)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)

  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/api/opportunities', {
          params: {
            bucket: activeSection,
            limit: 100,
            offset: 0,
            sort: 'newest',
          },
        })
        setRoles(data?.items || [])
        setBuckets(data?.buckets || {})
        setCap(data?.cap || 20)
      } catch {
        setRoles([])
        setBuckets({})
        setCap(20)
      } finally {
        setLoading(false)
      }
    }
    fetchOpportunities()
  }, [activeSection])

  const totalCount = Object.values(buckets).reduce((sum, count) => sum + count, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
            <Briefcase size={14} />
            Opportunities
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Internship openings</h1>
          <p className="text-slate-500">
            {loading ? 'Loading roles...' : `${totalCount} live role${totalCount === 1 ? '' : 's'} across ${SECTIONS.length} disciplines. Up to ${cap} per tab.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-4">
          {SECTIONS.map(s => {
            const Icon = s.icon
            const count = buckets[s.id] || 0
            const active = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon size={14} />
                {s.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-md text-xs font-semibold ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="space-y-10">
          {SECTIONS.filter(s => s.id === activeSection).map(section => (
            <SectionBlock
              key={section.id}
              section={section}
              roles={roles}
              cap={cap}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionBlock({ section, roles, cap, loading }) {
  const Icon = section.icon
  return (
    <section id={section.id}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${section.bg} ${section.accent} flex items-center justify-center ring-1 ${section.ring}`}>
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{section.label}</h2>
          <p className="text-xs text-slate-500">
            {loading ? 'Loading...' : `${roles.length} / ${cap} open role${roles.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <EmptyState label={section.label} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, i) => <RoleCard key={role.id || i} role={role} />)}
        </div>
      )}
    </section>
  )
}

function RoleCard({ role }) {
  const primaryLocation = role.locations?.[0]
  const primaryTerm = role.terms?.[0]

  return (
    <a
      href={role.url || '#'}
      target={role.url ? '_blank' : undefined}
      rel="noreferrer"
      className="group bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Building2 size={14} className="text-slate-400" />
          {role.company_name || 'Company'}
        </div>
        <ExternalLink size={14} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2">{role.title || 'Role title'}</h3>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {primaryLocation && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {primaryLocation}
          </span>
        )}
        {primaryTerm && <span>{primaryTerm}</span>}
      </div>
    </a>
  )
}

function EmptyState({ label }) {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-12 text-center">
      <p className="text-sm font-medium text-slate-500 mb-1">No {label.toLowerCase()} roles yet</p>
      <p className="text-xs text-slate-400">New openings will appear here as they're posted.</p>
    </div>
  )
}
