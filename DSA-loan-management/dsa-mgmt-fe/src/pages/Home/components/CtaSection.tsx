import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../constants'

export const CtaSection: React.FC = () => {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Secure Your Loan?
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Join over 15,000+ satisfied borrowers who secured the lowest interest rates with DSA Finance.
          </p>
          <div className="pt-4 flex flex-wrap gap-4 justify-center">
            <Link
              to={ROUTES.APPLY_FOR_LOAN}
              className="rounded-2xl bg-white px-8 py-4 text-sm font-bold text-blue-900 shadow-lg hover:bg-blue-50 transition active:scale-95"
            >
              Start Multi-Step Application →
            </Link>
            <Link
              to={ROUTES.CONTACT_US}
              className="rounded-2xl bg-white/10 border border-white/20 px-8 py-4 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Speak with an Advisor
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaSection
