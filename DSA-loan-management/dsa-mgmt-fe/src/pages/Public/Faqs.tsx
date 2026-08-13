import React from 'react'

const faqs = [
  {
    question: 'Do I need to pay any upfront fee?',
    answer: 'No. Our service is designed to help you explore loan options without any upfront payment from most customers. We only support genuine financial product guidance.',
  },
  {
    question: 'Which loans do you support?',
    answer: 'We support home loans, personal loans, car loans, and related financial assistance depending on partner eligibility and customer profile.',
  },
  {
    question: 'How long does the process take?',
    answer: 'The timeline varies by lender and document readiness. In many cases, once your documents are submitted, the process can move quickly with our guidance.',
  },
  {
    question: 'Can I apply for a loan online?',
    answer: 'Yes. You can begin by filling out the inquiry form or reaching out to our team to check eligibility and next steps.',
  },
]

export default function Faqs() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Support</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Frequently asked questions</h1>
      </section>

      <section className="mt-10 space-y-5">
        {faqs.map((item) => (
          <div key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
