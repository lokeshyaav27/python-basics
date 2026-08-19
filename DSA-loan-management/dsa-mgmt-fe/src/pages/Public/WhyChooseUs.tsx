import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

const reasons = [
  {
    icon: '⚡',
    title: 'Multi-Bank Algorithmic Match',
    description:
      'We instantly analyze your credit and financial profile across 25+ partner banks to find you the absolute lowest interest rate without impacting your CIBIL score.',
  },
  {
    icon: '🔒',
    title: 'Zero Hidden Charges',
    description:
      'Our digital platform and expert advisory services are completely free for borrowers. No commission markups, no surprise processing deductions.',
  },
  {
    icon: '⏱️',
    title: '48-Hour Approvals',
    description:
      'Direct digital API integrations and prioritized DSA processing channels cut down traditional approval times from 3 weeks to under 48 hours.',
  },
  {
    icon: '👨‍💼',
    title: 'Dedicated Loan Specialist',
    description:
      'From documentation pickup to final disbursement check handover, your assigned DSA loan officer manages every bank query end-to-end.',
  },
]

const comparisonData = [
  { feature: 'Bank Comparison', dsa: '25+ Banks & NBFCs in 1 Click', direct: 'Must visit each bank individually' },
  { feature: 'Interest Rate Negotiation', dsa: 'Corporate bulk volume discount', direct: 'Standard rack interest rates' },
  { feature: 'Doorstep / Digital Process', dsa: '100% Digital with home pickup', direct: 'Multiple physical branch queues' },
  { feature: 'CIBIL Impact on Inquiries', dsa: 'Single soft pre-qualification', direct: 'Hard inquiries per application' },
  { feature: 'Turnaround Time', dsa: '24 - 48 Hours', direct: '15 - 30 Working Days' },
  { feature: 'Consultation Fee', dsa: 'Free (₹0)', direct: 'Branch processing charges apply' },
]

const WhyChooseUs: React.FC = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Hero Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 px-8 py-14 text-white shadow-2xl text-center md:text-left relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-200 border border-white/15">
            🏆 The Smarter Way to Borrow
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Why Borrowers Choose DSA Finance
          </h1>
          <p className="text-base text-blue-100/80 leading-relaxed max-w-2xl">
            We combine cutting-edge loan matching technology with high-touch advisory to secure you the best loan rates with maximum peace of mind.
          </p>
        </div>
      </section>

      {/* 4 Key Pillars */}
      <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason) => (
          <div
            key={reason.title}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-xl hover:border-blue-400 transition"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              {reason.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{reason.title}</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">{reason.description}</p>
          </div>
        ))}
      </section>

      {/* Comparison Matrix Table */}
      <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How We Compare
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            See the clear advantage of applying through DSA Finance vs. visiting individual branch counters.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="py-4 px-5 font-bold">Feature / Parameter</th>
                <th className="py-4 px-5 font-bold text-blue-700 bg-blue-50/70 rounded-t-xl">
                  🚀 DSA Finance Platform
                </th>
                <th className="py-4 px-5 font-bold text-slate-400">Direct Bank Counter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-5 font-semibold text-slate-800">{row.feature}</td>
                  <td className="py-4 px-5 font-bold text-emerald-700 bg-blue-50/30">
                    ✓ {row.dsa}
                  </td>
                  <td className="py-4 px-5 text-slate-500">{row.direct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mt-14 text-center">
        <Link
          to={ROUTES.APPLY_FOR_LOAN}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition active:scale-95"
        >
          Apply for Loan Today →
        </Link>
      </div>
    </main>
  )
}

export default WhyChooseUs
