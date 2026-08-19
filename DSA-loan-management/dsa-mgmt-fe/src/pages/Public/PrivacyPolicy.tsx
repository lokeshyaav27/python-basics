import React from 'react'

const PrivacyPolicy: React.FC = () => {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Privacy</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900">Privacy Policy</h1>
      </section>

      <section className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
        <p>
          DSA Finance values your trust and handles your personal information with care. We collect data only when necessary for loan assistance, eligibility checks, and service communication.
        </p>
        <p>
          The information we may collect includes name, phone number, email, income details, and other relevant financial information required to help you explore suitable loan options.
        </p>
        <p>
          We use this information to contact you, evaluate your application, match you to relevant partner institutions, and improve the quality of our support services. Your information is not sold or rented to third parties for unrelated marketing purposes.
        </p>
        <p>
          We apply reasonable security safeguards to protect the information in our systems. However, no digital platform can guarantee complete security, so we encourage users to avoid sharing sensitive personal credentials through unsecured channels.
        </p>
        <p>
          You may request access, correction, or deletion of your personal data by contacting our support team. We may retain certain records as required by law or for internal operational needs.
        </p>
      </section>
    </main>
  )
}

export default PrivacyPolicy
