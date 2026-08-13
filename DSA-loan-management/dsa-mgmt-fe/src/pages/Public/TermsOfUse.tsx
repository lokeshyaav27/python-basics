import React from 'react'

export default function TermsOfUse() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Legal</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900">Terms of Use</h1>
      </section>

      <section className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
        <p>
          By using DSA Finance services, you agree to provide accurate information and use the platform only for lawful purposes. Any misuse, fraudulent activity, or unauthorized access is strictly prohibited.
        </p>
        <p>
          DSA Finance acts as an information and assistance platform connecting users with lending partners. We do not guarantee approval, approval rates, or final loan terms, which remain subject to lender review and policy.
        </p>
        <p>
          We may update this website, services, and policy information from time to time. Continued use of the platform after updates indicates your acceptance of the revised terms.
        </p>
        <p>
          The content on this website is provided for general informational purposes only and should not be treated as financial, legal, or professional advice. For personal guidance, please consult the relevant lending institution or a qualified advisor.
        </p>
      </section>
    </main>
  )
}
