import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-400">© 2026 ClearOffer. Not affiliated with any company listed.</p>
        <div className="flex items-center gap-5">
          <Link to="/blog" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Guides</Link>
          <Link to="/about" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">About</Link>
          <Link to="/privacy" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Privacy</Link>
          <Link to="/terms" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Terms</Link>
          <Link to="/contact" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
