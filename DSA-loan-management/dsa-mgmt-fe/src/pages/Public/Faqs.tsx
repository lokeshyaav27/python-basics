import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const allFaqs = [
  {
    category: 'General & Fees',
    question: 'Is using DSA Finance completely free for applicants?',
    answer: 'Yes! Our digital loan matching platform, rate comparison, and dedicated advisor services are 100% free of charge for borrowers. We earn directly from institutional partner referral commissions upon successful disbursement without adding any surcharge to your loan terms.',
  },
  {
    category: 'General & Fees',
    question: 'Will checking my loan eligibility impact my CIBIL credit score?',
    answer: 'No. Our initial online assessment uses a soft pre-qualification check that does not leave an inquiry footprint on your credit report. Only when you formally consent to submit with a specific chosen bank will a formal credit check occur.',
  },
  {
    category: 'Documentation & Approval',
    question: 'What basic documents are required to apply?',
    answer: 'Standard documentation includes: (1) Identity Proof (PAN / Aadhaar), (2) Address Proof, (3) Income Proof (Last 3 months salary slips or 2 years ITR for self-employed), and (4) Last 6 months bank account statements. For property loans, property title copies are also required.',
  },
  {
    category: 'Documentation & Approval',
    question: 'How fast can I get loan approval and disbursement?',
    answer: 'Personal loans can be approved and disbursed within 24 to 48 hours. Home loans and Car loans typically take 3 to 5 working days depending on property legal verification and valuation readiness.',
  },
  {
    category: 'Eligibility & Rates',
    question: 'Can I apply if I have a low CIBIL credit score?',
    answer: 'While top tier rates require a score of 750+, we partner with several NBFCs and specialized lenders who accommodate applicants with credit scores between 650 and 749 with adjusted loan-to-value or co-applicant backing.',
  },
  {
    category: 'Eligibility & Rates',
    question: 'Can female co-applicants get an interest rate discount on Home Loans?',
    answer: 'Yes! Most PSU and private banks offer a 0.05% to 0.10% interest rate concession when a female is either the sole applicant or a primary co-applicant/property co-owner.',
  },
]

import { ROUTES } from '../../constants/routes'

const Faqs: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = ['All', 'General & Fees', 'Documentation & Approval', 'Eligibility & Rates']

  const filteredFaqs = allFaqs.filter((f) => {
    const matchesCat = activeCategory === 'All' || f.category === activeCategory
    const matchesSearch =
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-2">
          💡 Common Questions
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-500">
          Everything you need to know about loan eligibility, interest rates, documentation, and the DSA process.
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-4 mb-10">
        <div className="relative max-w-xl mx-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords (e.g. CIBIL, documents, fees, speed)..."
            className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition"
          />
          <span className="absolute left-4 top-3.5 text-slate-400 text-base">🔍</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3.5">
        {filteredFaqs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No matching questions found.</div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:bg-slate-50/50 transition"
                >
                  <span className="text-sm sm:text-base pr-4">{faq.question}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 text-sm font-bold shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="mt-14 rounded-3xl bg-blue-50 border border-blue-200/80 p-8 text-center space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Still have questions?</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Our loan advisors are available Monday to Saturday to answer all your queries with zero obligations.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to={ROUTES.CONTACT_US}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
          >
            Contact Advisor →
          </Link>
        </div>
      </div>
    </main>
  )
}

export default Faqs
