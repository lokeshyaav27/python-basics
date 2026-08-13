import React from 'react'

export default function AboutUs() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 px-8 py-12 text-white shadow-lg md:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">About us</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Helping people find the right loan with confidence</h1>
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Our story</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            DSA Finance was created to make the loan journey simple, transparent, and less stressful for customers. We work with multiple banks, NBFCs, and lending partners to help people compare their options without confusion.
          </p>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Whether someone is buying a home, financing a vehicle, or meeting a personal financial need, we guide them toward suitable loan products and support them through each stage of the process.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">What we do</h2>
          <ul className="mt-4 space-y-4 text-slate-600">
            <li>• Compare loan options across multiple lending institutions</li>
            <li>• Match customers with products based on eligibility and goals</li>
            <li>• Simplify the application and document flow</li>
            <li>• Offer transparent guidance from enquiry to approval</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
