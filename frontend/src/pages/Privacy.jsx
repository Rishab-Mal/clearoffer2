import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

import Footer from '../components/Footer'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Who we are</h2>
            <p>ClearOffer ("we", "us", "our") operates clearoffer.org, a platform that aggregates real internship reviews from students. You can contact us at <Link to="/contact" className="text-amber-600 hover:underline">our contact form</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Information we collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Account information:</strong> email address, name, university, graduation year, and major when you create an account.</li>
              <li><strong>Reviews:</strong> internship experience content, ratings, tech stack, and interview information you voluntarily submit.</li>
              <li><strong>Saved companies:</strong> companies you bookmark for later reference.</li>
              <li><strong>Resume text:</strong> if you optionally upload or paste your resume for AI scoring. This is stored on your profile and can be deleted at any time.</li>
              <li><strong>Usage data:</strong> pages visited, interactions, and browser/device information collected automatically via Vercel Analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. How we use your information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and improve the ClearOffer service.</li>
              <li>To send email verification and account-related emails via Resend.</li>
              <li>To generate AI-powered resume scores and interview prep plans.</li>
              <li>To display relevant advertising via Google AdSense.</li>
              <li>To send occasional product updates (you can opt out at any time).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Cookies and advertising</h2>
            <p className="mb-3">We use cookies and similar technologies for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Authentication:</strong> Supabase uses cookies to keep you logged in.</li>
              <li><strong>Advertising:</strong> We use Google AdSense to display ads. Google and its partners may use cookies to serve ads based on your prior visits to this site and other sites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Google Ad Settings</a> or <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">aboutads.info</a>.</li>
              <li><strong>Analytics:</strong> Vercel Analytics collects anonymized usage data to help us understand how the site is used.</li>
            </ul>
            <p className="mt-3">You can decline non-essential cookies using the banner shown on your first visit, or by clearing your browser cookies at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Third-party services</h2>
            <p className="mb-2">We share data with the following third parties solely to operate the service:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Supabase</strong> — database and authentication hosting</li>
              <li><strong>Vercel</strong> — website hosting and analytics</li>
              <li><strong>Google AdSense</strong> — advertising</li>
              <li><strong>OpenRouter / Anthropic</strong> — AI features (resume scoring, interview prep)</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to any third party.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Data retention</h2>
            <p>We retain your account data for as long as your account is active. Reviews you submit are kept even if you delete your account (they are anonymized — your name and user ID are removed). You can delete your account and all associated personal data from the Settings tab on your profile page.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Your rights</h2>
            <p>Depending on your location, you may have rights to access, correct, or delete your personal data. To exercise these rights, email us at <Link to="/contact" className="text-amber-600 hover:underline">our contact form</Link>. EU/EEA users have additional rights under GDPR, including the right to data portability and to lodge a complaint with your local supervisory authority.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Children's privacy</h2>
            <p>ClearOffer is intended for users who are 13 years of age or older. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Changes to this policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. Continued use of the site after changes constitutes acceptance of the new policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Contact</h2>
            <p>Questions or concerns? Email us at <Link to="/contact" className="text-amber-600 hover:underline">our contact form</Link>.</p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  )
}
