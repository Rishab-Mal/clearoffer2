import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Star, FileText, Cpu, Mail } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        <h1 className="text-3xl font-black text-slate-900 mb-4">About ClearOffer</h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-10">
          ClearOffer is a student-built platform that makes internship recruiting more transparent. We aggregate real reviews from students who've actually worked there — so you can see inside before you sign.
        </p>

        <div className="space-y-10">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Why we exist</h2>
            <p className="text-slate-600 leading-relaxed">
              Recruiting is broken for students. Company websites are marketing. Glassdoor reviews skew older and professional. LinkedIn tells you nothing about what day-to-day intern life is actually like.
            </p>
            <p className="text-slate-600 leading-relaxed mt-3">
              ClearOffer fills that gap with crowdsourced intern reviews, AI-powered summaries, real interview questions from past interns, and resume scoring against companies you actually care about — all in one place.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">What you can do here</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <Star size={20} className="text-amber-500 mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">Read real reviews</h3>
                <p className="text-sm text-slate-500">Honest takes on work quality, mentorship, compensation, and culture — written by students, for students.</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <Cpu size={20} className="text-amber-500 mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">Prep smarter</h3>
                <p className="text-sm text-slate-500">See actual interview questions past interns were asked, AI-generated study plans, and difficulty breakdowns by company.</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <FileText size={20} className="text-amber-500 mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">Score your resume</h3>
                <p className="text-sm text-slate-500">AI-powered scoring against specific companies and roles, with gaps, strengths, and keywords to add.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Our values</h2>
            <ul className="space-y-3 text-slate-600">
              <li><strong className="text-slate-900">Anonymous by default.</strong> Reviews are anonymous unless you choose otherwise. We want honest takes, not PR-friendly ones.</li>
              <li><strong className="text-slate-900">Student-first.</strong> Everything is built for students navigating recruiting — not for companies, not for recruiters.</li>
              <li><strong className="text-slate-900">Free forever.</strong> Core features will always be free. We're ad-supported, not paywalled.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Contact us</h2>
            <p className="text-slate-600 mb-4">Have a question, found a bug, or want to get involved? We'd love to hear from you.</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 rounded-xl transition-colors"
            >
              <Mail size={16} />Send us a message
            </Link>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  )
}
