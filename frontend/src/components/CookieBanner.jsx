import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 px-4 py-4 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie size={18} className="text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-sm text-slate-300 flex-1">
          We use cookies to serve ads and improve your experience. Google AdSense may use cookies to personalize ads based on your browsing. See our{' '}
          <Link to="/privacy" className="text-amber-400 hover:text-amber-300 underline" onClick={accept}>Privacy Policy</Link>.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
