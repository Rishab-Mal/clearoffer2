import { Link, useNavigate } from 'react-router-dom'
import { Star, MessageSquare, Bookmark, BookmarkCheck } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getCompanyDescription } from '../data/companyDescriptions'

const COMPANY_COLORS = {
  Meta: 'bg-blue-500', Google: 'bg-red-500', Amazon: 'bg-orange-500',
  Apple: 'bg-gray-700', Microsoft: 'bg-blue-600', Netflix: 'bg-red-600',
  Stripe: 'bg-violet-600', Airbnb: 'bg-rose-500', Uber: 'bg-slate-800', Lyft: 'bg-pink-500',
}

export default function CompanyCard({ company, showSave = true }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(company.is_saved || false)
  const bgColor = COMPANY_COLORS[company.name] || 'bg-slate-600'

  const handleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/auth'); return }
    if (saved) {
      await supabase.from('saved_companies')
        .delete()
        .eq('user_id', user.id)
        .eq('company_id', company.id)
    } else {
      await supabase.from('saved_companies')
        .insert({ user_id: user.id, company_id: company.id })
    }
    setSaved(!saved)
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(company.avg_rating || 0))

  return (
    <Link
      to={`/company/${company.id}`}
      className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-amber-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
            {company.name?.[0]}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">{company.name}</h3>
            <p className="text-xs text-slate-500">{company.industry || 'Technology'}</p>
          </div>
        </div>
        {showSave && (
          <button onClick={handleSave} className="text-slate-400 hover:text-amber-500 transition-colors p-1">
            {saved ? <BookmarkCheck size={16} className="text-amber-500" /> : <Bookmark size={16} />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex">
          {stars.map((filled, i) => (
            <Star key={i} size={12} className={filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'} />
          ))}
        </div>
        <span className="text-sm font-semibold text-slate-800">{(company.avg_rating || 0).toFixed(1)}</span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <MessageSquare size={10} />{company.review_count || 0}
        </span>
      </div>

      {company.top_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {company.top_tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{tag}</span>
          ))}
        </div>
      )}

      {(company.ai_overview || getCompanyDescription(company.name)) && (
        <p className="mt-3 text-xs text-slate-500 line-clamp-2">{company.ai_overview || getCompanyDescription(company.name)}</p>
      )}
    </Link>
  )
}
