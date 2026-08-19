import React from 'react'
import { useTranslation } from 'react-i18next'

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation()

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">{t('common.footer.legal')}</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900">{t('legal.privacy.title')}</h1>
        <p className="mt-2 text-xs text-slate-400">{t('legal.privacy.lastUpdated')}</p>
      </section>

      <section className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
        <p>{t('legal.privacy.intro')}</p>
        <h2 className="text-lg font-bold text-slate-800 mt-6">{t('legal.privacy.section1Title')}</h2>
        <p>{t('legal.privacy.section1Text')}</p>
        <h2 className="text-lg font-bold text-slate-800 mt-6">{t('legal.privacy.section2Title')}</h2>
        <p>{t('legal.privacy.section2Text')}</p>
      </section>
    </main>
  )
}

export default PrivacyPolicy
