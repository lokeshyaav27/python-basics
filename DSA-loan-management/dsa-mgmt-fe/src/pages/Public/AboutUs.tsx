import React from 'react'
import { Link } from 'react-router-dom'

export default function AboutUs() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-8 py-14 text-white shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold text-blue-300 border border-blue-400/20">
            🏢 About DSA Finance
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Democratizing Access to Transparent Credit
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            We are on a mission to simplify borrowing by connecting Indian consumers with top financial institutions through technology, transparency, and personal advisory.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700 mb-6">
            🎯
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
            To eliminate the complexity, rate opacity, and delays from retail borrowing. We empower applicants with unbiased rate comparisons, doorstep document processing, and dedicated loan specialists.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700 mb-6">
            🌟
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
            To become India’s most trusted and technologically advanced Direct Selling Agent (DSA) network, delivering fair interest rates and rapid approvals to over 100,000+ families nationwide.
          </p>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="mt-12 rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h3 className="text-2xl font-extrabold">Our Journey in Numbers</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-400">15,000+</span>
            <span className="text-xs text-slate-400 block mt-1">Happy Borrowers</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">₹500 Cr+</span>
            <span className="text-xs text-slate-400 block mt-1">Disbursed Value</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">25+</span>
            <span className="text-xs text-slate-400 block mt-1">Banking Partners</span>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-400">50+</span>
            <span className="text-xs text-slate-400 block mt-1">Certified Advisors</span>
          </div>
        </div>
      </section>

      <div className="mt-14 text-center">
        <Link
          to="/apply-for-loan"
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition"
        >
          Check Your Loan Eligibility →
        </Link>
      </div>
    </main>
  )
}
