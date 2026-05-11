import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Cpu, BookOpen, BarChart3, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const startedRef = useRef(false)
  const elRef = useRef(null)

  useEffect(() => {
    if (target === null) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          const startTime = performance.now()
          const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.5 }
    )
    if (elRef.current) observer.observe(elRef.current)
    return () => observer.disconnect()
  }, [target, duration])

  return [count, elRef]
}

export default function Landing() {
  const [reviewCount, setReviewCount] = useState(null)

  useEffect(() => {
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', true)
      .then(({ count }) => setReviewCount(count ?? 0))
  }, [])

  const [count, counterRef] = useCountUp(reviewCount)

  return (
    <div className="bg-lantern-bg min-h-screen text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-xl">✦</span>
          <span className="font-black text-white text-lg tracking-tight">CLEAROFFER</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth?mode=login" className="text-sm text-slate-400 hover:text-white transition-colors font-medium px-3 py-2">
            Log in
          </Link>
          <Link
            to="/auth"
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-28">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-amber-400 text-xs font-semibold tracking-wide uppercase">Now in beta</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-6 max-w-4xl">
          See inside<br />
          <span className="text-gradient">before you sign.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed mb-10">
          Real internship reviews from students who've been there.
          AI-powered summaries so you stop guessing and start deciding.
        </p>

        <Link
          to="/auth"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5"
        >
          Sign up free
          <ArrowRight size={20} />
        </Link>

        <p className="mt-4 text-slate-600 text-sm">Students only · Free forever</p>
      </section>

      {/* Feature Trio */}
      <section className="bg-lantern-card border-y border-lantern-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-12">What ClearOffer gives you</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Cpu className="text-amber-500" size={24} />}
              title="AI Summaries"
              desc="Synthesized from hundreds of real reviews. What's the internship actually like? One read, full picture."
            />
            <FeatureCard
              icon={<BookOpen className="text-amber-500" size={24} />}
              title="Interview Intel"
              desc="Real questions, timelines, and difficulty ratings pulled from people who went through the process."
            />
            <FeatureCard
              icon={<BarChart3 className="text-amber-500" size={24} />}
              title="Resume Fit Scorer"
              desc="Paste your resume and target company. AI scores your match based on what past interns actually had."
            />
          </div>
        </div>
      </section>


      {/* Review Counter */}
      <section ref={counterRef} className="bg-lantern-card border-y border-lantern-border py-20 px-6 text-center">
        {reviewCount === null ? (
          <div className="w-16 h-12 bg-lantern-border rounded-xl mx-auto mb-3 animate-pulse" />
        ) : reviewCount === 0 ? (
          <p className="text-2xl font-bold text-slate-500">Be the first to submit a review.</p>
        ) : (
          <>
            <p className="text-6xl md:text-7xl font-black text-white mb-3 tabular-nums">
              {count.toLocaleString()}
            </p>
            <p className="text-slate-400 text-lg">reviews submitted and counting</p>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-amber-500">✦</span>
          <span className="font-black text-slate-500 text-sm tracking-tight">CLEAROFFER</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <a href="#" className="hover:text-slate-400 transition-colors">About</a>
          <a href="mailto:hello@clearoffer.org" className="hover:text-slate-400 transition-colors">Contact</a>
        </div>
        <p className="text-slate-700 text-xs">© 2026 ClearOffer</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-lantern-bg border border-lantern-border rounded-2xl p-6">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}
