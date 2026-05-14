import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { blogPosts } from '../data/blogPosts'
import { Clock, Tag } from 'lucide-react'

export default function Blog() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Internship Guides</h1>
          <p className="text-slate-500">Practical advice for landing and making the most of your tech internship.</p>
        </div>

        <div className="space-y-5">
          {blogPosts.map(post => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors mb-2">{post.title}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">{post.summary}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 flex-shrink-0">
                  <span className="text-xs text-slate-400">{post.date}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={11} />{post.readTime}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
