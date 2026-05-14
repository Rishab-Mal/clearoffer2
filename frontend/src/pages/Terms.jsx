import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptance of terms</h2>
            <p>By accessing or using ClearOffer ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Eligibility</h2>
            <p>You must be at least 13 years old to use ClearOffer. By creating an account, you represent that you meet this requirement. The Service is intended for current and former students researching internship opportunities.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. User accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use at <Link to="/contact" className="text-amber-600 hover:underline">our contact form</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. User-generated content</h2>
            <p className="mb-3">When you submit a review or any other content, you agree that:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Your review reflects your genuine, first-hand experience.</li>
              <li>You will not post false, misleading, defamatory, or fabricated information.</li>
              <li>You will not include personal information about other individuals (colleagues, managers, etc.) that could identify them.</li>
              <li>You will not post content that is harassing, discriminatory, or violates any applicable law.</li>
              <li>You grant ClearOffer a non-exclusive, royalty-free, perpetual license to display and use your submitted content on the platform.</li>
            </ul>
            <p className="mt-3">We reserve the right to remove any content that violates these terms without prior notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Prohibited conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Scrape, crawl, or otherwise extract data from the Service without written permission.</li>
              <li>Use the Service for any commercial purpose without our consent.</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
              <li>Post spam, advertising, or promotional material.</li>
              <li>Impersonate any person or entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Intellectual property</h2>
            <p>All content, design, and functionality of ClearOffer (excluding user-submitted reviews) is owned by ClearOffer and protected by applicable intellectual property laws. You may not copy or reproduce any part of the Service without our written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Disclaimer of warranties</h2>
            <p>The Service is provided "as is" without warranties of any kind. Reviews and ratings on ClearOffer reflect the opinions of individual users and do not represent the views of ClearOffer. We do not verify the accuracy of any review. ClearOffer is not affiliated with, endorsed by, or sponsored by any company listed on the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Limitation of liability</h2>
            <p>To the fullest extent permitted by law, ClearOffer shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including reliance on any review or content posted by users.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time from your profile settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Changes to terms</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance. Material changes will be communicated to registered users by email.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Contact</h2>
            <p>Questions about these Terms? Email <Link to="/contact" className="text-amber-600 hover:underline">our contact form</Link>.</p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  )
}
