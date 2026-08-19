import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import { changeLanguage } from '../../i18n'

const Header: React.FC = () => {
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const isActive = (path: string) => location.pathname === path

  const navLinkClass = (path: string) =>
    `relative text-sm font-semibold transition ${
      isActive(path)
        ? 'text-blue-700 after:absolute after:-bottom-5 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-blue-600'
        : 'text-slate-700 hover:text-blue-700'
    }`

  const currentLang = i18n.language || 'en'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to={ROUTES.HOME} className="flex items-center gap-3 min-w-0">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 text-lg font-extrabold text-white shadow-sm">
            D
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold text-slate-900">{t('common.brand')}</span>
            <span className="block text-[10px] text-slate-500">{t('common.tagline')}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:gap-8 lg:flex">
          <Link to={ROUTES.HOME} className={navLinkClass(ROUTES.HOME)}>
            {t('common.nav.home')}
          </Link>
          <Link to={ROUTES.PRODUCTS} className={navLinkClass(ROUTES.PRODUCTS)}>
            {t('common.nav.products')}
          </Link>
          <Link to={ROUTES.WHY_CHOOSE_US} className={navLinkClass(ROUTES.WHY_CHOOSE_US)}>
            {t('common.nav.whyUs')}
          </Link>
          <Link to={ROUTES.ABOUT_US} className={navLinkClass(ROUTES.ABOUT_US)}>
            {t('common.nav.aboutUs')}
          </Link>
          <Link to={ROUTES.CONTACT_US} className={navLinkClass(ROUTES.CONTACT_US)}>
            {t('common.nav.contact')}
          </Link>
          <Link to={ROUTES.CUSTOMER_LOGIN} className={navLinkClass(ROUTES.CUSTOMER_LOGIN)}>
            {t('common.nav.customerPortal')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => changeLanguage('en')}
              className={`rounded-md px-2.5 py-1 transition ${
                currentLang.startsWith('en')
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('hi')}
              className={`rounded-md px-2.5 py-1 transition ${
                currentLang.startsWith('hi')
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>

          <Link
            to={ROUTES.APPLY_FOR_LOAN}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            {t('common.nav.applyNow')}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
