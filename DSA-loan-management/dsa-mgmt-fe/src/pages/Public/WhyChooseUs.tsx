import React from 'react'

const reasons = [
  {
    title: 'Multiple Trusted Lending Partners',
    description: 'We help you compare offers across leading banks, NBFCs, and housing finance companies to find the best-fitting option for your profile.',
  },
  {
    title: 'Transparent Guidance',
    description: 'Our team simplifies the loan process with clear eligibility checks, documentation guidance, and honest rate comparisons.',
  },
  {
    title: 'Fast Processing',
    description: 'We streamline your application journey so you can move from enquiry to approval with less delay and paperwork.',
  },
  {
    title: 'Customer-first Support',
    description: 'Every customer is supported by experienced advisors who understand the loan journey and provide personalized recommendations.',
  },
]

export default function WhyChooseUs() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-12 text-white shadow-lg md:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Why choose us</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Simple, secure, and smarter loan guidance</h1>
        <p className="mt-4 max-w-2xl text-base text-blue-100 md:text-lg">
          DSA Finance helps borrowers access the right funding without confusion, delays, or hidden surprises.
        </p>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {reasons.map((reason) => (
          <div key={reason.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-xl text-blue-700">✓</div>
            <h2 className="text-xl font-bold text-slate-900">{reason.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{reason.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8">
        <h2 className="text-2xl font-bold text-slate-900">We make borrowing easier</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-3xl font-extrabold text-blue-700">25+</p>
            <p className="mt-2 text-slate-600">Lending partners and financial institutions</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-blue-700">10k+</p>
            <p className="mt-2 text-slate-600">Families and professionals guided to better options</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-blue-700">2 days</p>
            <p className="mt-2 text-slate-600">Average response turnaround for eligible applications</p>
          </div>
        </div>
      </section>
    </main>
  )
}
