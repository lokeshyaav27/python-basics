import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'

const Footer: React.FC = () => {
  const { t } = useTranslation()

  return (
    <footer className="bg-[#071b3d] pt-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 text-lg font-extrabold text-white">
              D
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold">{t('common.brand')}</span>
              <span className="block text-[10px] text-slate-300">{t('common.tagline')}</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
            {t('common.footer.aboutText')}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">{t('common.footer.loanProducts')}</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link to={ROUTES.PRODUCTS} className="hover:text-white transition">
                {t('common.nav.products')}
              </Link>
            </li>
            <li>
              <Link to={ROUTES.APPLY_FOR_LOAN} className="hover:text-white transition">
                {t('common.nav.applyNow')}
              </Link>
            </li>
            <li>
              <Link to={ROUTES.PARTNERS} className="hover:text-white transition">
                {t('common.nav.partners')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">{t('common.footer.quickLinks')}</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link to={ROUTES.ABOUT_US} className="hover:text-white transition">
                {t('common.nav.aboutUs')}
              </Link>
            </li>
            <li>
              <Link to={ROUTES.WHY_CHOOSE_US} className="hover:text-white transition">
                {t('common.nav.whyUs')}
              </Link>
            </li>
            <li>
              <Link to={ROUTES.CONTACT_US} className="hover:text-white transition">
                {t('common.nav.contact')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">{t('common.footer.legal')}</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link to={ROUTES.FAQS} className="hover:text-white transition">
                {t('common.nav.faqs')}
              </Link>
            </li>
            <li>
              <Link to={ROUTES.PRIVACY_POLICY} className="hover:text-white transition">
                {t('common.footer.privacy')}
              </Link>
            </li>
            <li>
              <Link to={ROUTES.TERMS_OF_USE} className="hover:text-white transition">
                {t('common.footer.terms')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 text-[11px] text-slate-300 md:flex-row">
          <span>{t('common.footer.copyright')}</span>
          <div className="flex gap-4">
            <Link to={ROUTES.PRIVACY_POLICY} className="hover:underline">
              {t('common.footer.privacy')}
            </Link>
            <Link to={ROUTES.TERMS_OF_USE} className="hover:underline">
              {t('common.footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
