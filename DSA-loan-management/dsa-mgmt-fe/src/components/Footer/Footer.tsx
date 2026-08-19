import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#071b3d] pt-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 text-lg font-extrabold text-white">
              D
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold">DSA Finance</span>
              <span className="block text-[10px] text-slate-300">Your Trusted Loan Partner</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
            Helping customers compare and access suitable loan options from leading banks and NBFCs.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Loan Products</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link to={ROUTES.PRODUCTS} className="hover:text-white transition">
                Home Loan
              </Link>
            </li>
            <li>
              <Link to={ROUTES.PRODUCTS} className="hover:text-white transition">
                Car Loan
              </Link>
            </li>
            <li>
              <Link to={ROUTES.PRODUCTS} className="hover:text-white transition">
                Personal Loan
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Company</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link to={ROUTES.ABOUT_US} className="hover:text-white transition">
                About Us
              </Link>
            </li>
            <li>
              <Link to={ROUTES.WHY_CHOOSE_US} className="hover:text-white transition">
                Why Choose Us
              </Link>
            </li>
            <li>
              <Link to={ROUTES.CONTACT_US} className="hover:text-white transition">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Support</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link to={ROUTES.FAQS} className="hover:text-white transition">
                FAQs
              </Link>
            </li>
            <li>
              <Link to={ROUTES.PRIVACY_POLICY} className="hover:text-white transition">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to={ROUTES.TERMS_OF_USE} className="hover:text-white transition">
                Terms of Use
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 text-[11px] text-slate-300 md:flex-row">
          <span>© 2026 DSA Finance. All rights reserved.</span>
          <span>Privacy Policy · Terms of Use</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
