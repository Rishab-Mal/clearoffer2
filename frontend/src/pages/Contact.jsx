import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Contact us</h1>
        <p className="text-slate-500 mb-8">Have a question or found an issue? Send us a message and we'll get back to you.</p>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 mb-1">Message sent!</h2>
            <p className="text-slate-500 text-sm">We'll get back to you at {form.email}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Your name"
                className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your email <span className="text-red-400">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@email.com"
                required
                className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message <span className="text-red-400">*</span></label>
              <textarea
                value={form.message}
                onChange={set('message')}
                placeholder="What's on your mind?"
                required
                rows={5}
                className="w-full border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  )
}
