import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

const Header: React.FC = () => {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navLinkClass = (path: string) =>
    `relative text-sm font-semibold transition ${
      isActive(path)
        ? 'text-blue-700 after:absolute after:-bottom-5 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-blue-600'
        : 'text-slate-700 hover:text-blue-700'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to={ROUTES.HOME} className="flex items-center gap-3 min-w-0">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 text-lg font-extrabold text-white shadow-sm">
            D
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold text-slate-900">DSA Finance</span>
            <span className="block text-[10px] text-slate-500">Your Trusted Loan Partner</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <Link to={ROUTES.HOME} className={navLinkClass(ROUTES.HOME)}>
            Home
          </Link>
          <Link to={ROUTES.PRODUCTS} className={navLinkClass(ROUTES.PRODUCTS)}>
            Loan Products
          </Link>
          <Link to={ROUTES.WHY_CHOOSE_US} className={navLinkClass(ROUTES.WHY_CHOOSE_US)}>
            Why Choose Us
          </Link>
          <Link to={ROUTES.ABOUT_US} className={navLinkClass(ROUTES.ABOUT_US)}>
            About Us
          </Link>
          <Link to={ROUTES.CONTACT_US} className={navLinkClass(ROUTES.CONTACT_US)}>
            Contact Us
          </Link>
          <Link to={ROUTES.CUSTOMER_LOGIN} className={navLinkClass(ROUTES.CUSTOMER_LOGIN)}>
            Customer Login
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-blue-600 md:flex">
            <span className="text-lg">☎</span>
            <span className="leading-tight">
              <span className="block text-[11px] font-bold text-slate-900">1800-123-4567</span>
              <span className="block text-[9px] text-slate-500">Mon - Sat 9:00 AM - 7:00 PM</span>
            </span>
          </div>

          <Link
            to={ROUTES.APPLY_FOR_LOAN}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            Apply for Loan
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
