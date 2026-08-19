import React from 'react'

const STEPS = [
  {
    step: '01',
    title: 'Select Product',
    desc: 'Pick your loan type and compare terms tailored to your borrowing limit.',
    icon: '🏷️',
  },
  {
    step: '02',
    title: 'Submit Details',
    desc: 'Enter your basic contact and financial details in under 2 minutes.',
    icon: '📝',
  },
  {
    step: '03',
    title: 'Advisor Matching',
    desc: 'A dedicated DSA loan officer matches your profile with top partner banks.',
    icon: '🤝',
  },
  {
    step: '04',
    title: 'Approval & Payout',
    desc: 'Get your loan forwarded to bank and funds directly credited into your account.',
    icon: '🎉',
  },
]

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100">
            Simple 4-Step Journey
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            How DSA Loan Processing Works
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            From online application to direct bank disbursement, we streamline every step.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="relative rounded-3xl border border-slate-200 bg-slate-50/70 p-6 text-center hover:bg-white hover:shadow-lg transition"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-md shadow-blue-600/30 mb-4">
                {item.icon}
              </div>
              <span className="text-xs font-mono font-bold text-blue-600">STEP {item.step}</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">{item.title}</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
