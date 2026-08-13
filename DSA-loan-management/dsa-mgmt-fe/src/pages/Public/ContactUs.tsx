import React from 'react'

export default function ContactUs() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <section className="rounded-3xl bg-blue-50 px-8 py-12 md:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Contact us</p>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 md:text-5xl">Speak to our loan experts</h1>
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Call us</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">1800-123-4567</p>
          <p className="mt-2 text-slate-600">Mon - Sat, 9:00 AM - 7:00 PM</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Email</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">support@dsafinance.com</p>
          <p className="mt-2 text-slate-600">We usually respond within 24 hours.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Office</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">DSA Finance</p>
          <p className="mt-2 text-slate-600">12 Finance Avenue, New Delhi, India</p>
        </div>
      </section>
    </main>
  )
}
