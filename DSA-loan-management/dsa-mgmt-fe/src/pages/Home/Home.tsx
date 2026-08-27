import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services/products'
import { fetchBanks } from '../../services/banks'
import { ROUTES } from '../../constants'
import {
  HeroSection,
  MetricsBar,
  EmiCalculator,
  ProductCarousel,
  HowItWorksSection,
  BankingPartnersSection,
  CtaSection,
} from './components'

const Home: React.FC = () => {
  const { data: products = [] } = useQuery({ queryKey: ['products-home'], queryFn: () => fetchProducts() })
  const { data: banks = [] } = useQuery({ queryKey: ['banks-home'], queryFn: () => fetchBanks() })

  return (
    <div className="bg-slate-50">
      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── METRICS COUNTER BAR ───────────────────────────────────────── */}
      <MetricsBar />

      {/* ── LOAN PRODUCTS CAROUSEL / SLIDER ───────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100">
              Loan Marketplace
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Explore Our Loan Products
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Swipe or use controls to view our curated loan categories.
            </p>
          </div>
          <Link
            to={ROUTES.PRODUCTS}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            View All Products Catalog →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Loading loan offerings…</div>
        ) : (
          <ProductCarousel products={products} />
        )}
      </section>

      {/* ── EMI CALCULATOR SECTION ───────────────────────────────────── */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EmiCalculator />
      </section>

      {/* ── HOW IT WORKS (4 STEPS) ────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── OUR PARTNERS (5 BANKS + SEE ALL BUTTON) ───────────────────── */}
      <BankingPartnersSection banks={banks} />

      {/* ── FINAL HIGH-IMPACT CALL TO ACTION ─────────────────────────── */}
      <CtaSection />
    </div>
  )
}

export default Home
