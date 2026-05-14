import { useParams, Link, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getPostBySlug, blogPosts } from '../data/blogPosts'
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react'

function renderBlock(block, i) {
  switch (block.type) {
    case 'h2':
      return <h2 key={i} className="text-xl font-bold text-slate-900 mt-8 mb-3">{block.text}</h2>
    case 'p':
      return <p key={i} className="text-slate-700 leading-relaxed">{block.text}</p>
    case 'ul':
      return (
        <ul key={i} className="space-y-2 my-2">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-slate-700">
              <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">•</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )
    default:
      return null
  }
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)

  if (!post) return <Navigate to="/blog" replace />

  const currentIndex = blogPosts.findIndex(p => p.slug === slug)
  const prev = currentIndex > 0 ? blogPosts[currentIndex - 1] : null
  const next = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
          <ArrowLeft size={14} />All guides
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-3">{post.title}</h1>

          <div className="flex items-center gap-4 text-xs text-slate-400 mb-8 pb-8 border-b border-slate-100">
            <span>{post.date}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{post.readTime}</span>
          </div>

          <div className="space-y-4">
            {post.content.map((block, i) => renderBlock(block, i))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {prev ? (
            <Link to={`/blog/${prev.slug}`} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-300 transition-colors group">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><ArrowLeft size={11} />Previous</p>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-amber-700 transition-colors line-clamp-2">{prev.title}</p>
            </Link>
          ) : <div />}
          {next ? (
            <Link to={`/blog/${next.slug}`} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-300 transition-colors group text-right">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1 justify-end">Next<ArrowRight size={11} /></p>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-amber-700 transition-colors line-clamp-2">{next.title}</p>
            </Link>
          ) : <div />}
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="font-bold text-slate-900 mb-1">See what interns actually experienced</p>
          <p className="text-slate-500 text-sm mb-4">Real reviews from students who interned at these companies.</p>
          <Link to="/search" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
            Browse companies
          </Link>
        </div>

      </div>
      <Footer />
    </div>
  )
}
