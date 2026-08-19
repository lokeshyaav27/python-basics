import React, { useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services/products'
import { fetchBanks } from '../../services/banks'
import { ROUTES } from '../../constants/routes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// ── Interactive EMI Calculator Component ─────────────────────────────────────
const EmiCalculator: React.FC = () => {
  const [amount, setAmount] = useState<number>(2500000)
  const [rate, setRate] = useState<number>(8.5)
  const [tenureYears, setTenureYears] = useState<number>(15)

  const { monthlyEmi, totalInterest, totalPayment } = useMemo(() => {
    const monthlyRate = rate / 12 / 100
    const totalMonths = tenureYears * 12
    if (monthlyRate === 0) {
      const emi = amount / totalMonths
      return { monthlyEmi: Math.round(emi), totalInterest: 0, totalPayment: amount }
    }
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    const totalPay = emi * totalMonths
    const interest = totalPay - amount
    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(interest),
      totalPayment: Math.round(totalPay),
    }
  }, [amount, rate, tenureYears])

  const principalRatio = Math.round((amount / (totalPayment || 1)) * 100)
  const interestRatio = 100 - principalRatio

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 lg:p-10 shadow-2xl shadow-blue-900/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            📊 Interactive Tool
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">Loan EMI Calculator</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs">
          Plan your monthly budget with our real-time loan interest estimator.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 items-center">
        {/* Sliders Area (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Loan Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Loan Amount</label>
              <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                ₹ {amount.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={100000}
              max={10000000}
              step={50000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>₹1 Lakh</span>
              <span>₹50 Lakh</span>
              <span>₹1 Crore</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Interest Rate (% p.a.)</label>
              <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                {rate.toFixed(1)} %
              </span>
            </div>
            <input
              type="range"
              min={7.5}
              max={18.0}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>7.5%</span>
              <span>12.5%</span>
              <span>18.0%</span>
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Tenure (Years)</label>
              <span className="text-base font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                {tenureYears} Years ({tenureYears * 12} Months)
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>1 Year</span>
              <span>15 Years</span>
              <span>30 Years</span>
            </div>
          </div>
        </div>

        {/* Results Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-6 text-white shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-300 font-bold">Estimated Monthly EMI</span>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
              ₹ {monthlyEmi.toLocaleString('en-IN')}
              <span className="text-xs font-medium text-slate-300"> / month</span>
            </div>

            <div className="mt-6 space-y-3 pt-5 border-t border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Loan Amount</span>
                <span className="font-bold text-white">₹ {amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Interest Payable</span>
                <span className="font-bold text-amber-300">₹ {totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-white/10">
                <span className="text-slate-200">Total Repayment</span>
                <span className="text-white">₹ {totalPayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Split Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Principal: {principalRatio}%</span>
                <span>Interest: {interestRatio}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-amber-400 overflow-hidden flex">
                <div style={{ width: `${principalRatio}%` }} className="bg-blue-500 h-full" />
              </div>
            </div>
          </div>

          <Link
            to="/apply-for-loan"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/40 hover:bg-blue-500 transition active:scale-95"
          >
            Apply with These Terms →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Product Carousel Component ────────────────────────────────────────────────
const ProductCarousel: React.FC<{ products: any[] }> = ({ products }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 360
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => scroll('left')}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition active:scale-95"
          aria-label="Previous Products"
        >
          ←
        </button>
        <button
          onClick={() => scroll('right')}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition active:scale-95"
          aria-label="Next Products"
        >
          →
        </button>
      </div>

      {/* Horizontal Scrolling Track */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth no-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product: any) => (
          <div
            key={product.id}
            className="w-[310px] sm:w-[360px] shrink-0 snap-start rounded-3xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-2xl hover:border-blue-400 transition duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                {product.image ? (
                  <img
                    src={`${API_BASE_URL}/static/product-images/${product.image}`}
                    alt={product.name}
                    className="h-16 w-16 rounded-2xl object-cover border border-slate-100 bg-slate-50 p-1 group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-blue-700">
                    🏦
                  </div>
                )}
                <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1">
                  Fast Processing
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3">
                {product.description}
              </p>

              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Interest</span>
                  <span className="font-bold text-slate-800">From 8.35% p.a.</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Max Tenure</span>
                  <span className="font-bold text-slate-800">Up to 30 Yrs</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Link
                to={`${ROUTES.APPLY_FOR_LOAN}?productId=${product.id}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm active:scale-[0.98]"
              >
                Apply for {product.name} →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const Home: React.FC = () => {
  const { data: products = [] } = useQuery({ queryKey: ['products-home'], queryFn: fetchProducts })
  const { data: banks = [] } = useQuery({ queryKey: ['banks-home'], queryFn: fetchBanks })

  // Display only top 5 partner banks on Home page
  const partnerBanks = banks.slice(0, 5)

  return (
    <div className="bg-slate-50">
      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Glow ambient backgrounds */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Instant Pre-Approvals & Best Rate Match</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Your Dream. Our Support.{' '}
                <span className="bg-gradient-to-r from-blue-200 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                  Your Best Loan.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-blue-100/80 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Compare and secure tailored Home, Car, and Personal loans from over 25+ top partner banks and NBFCs with zero branch visits and maximum savings.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link
                  to="/apply-for-loan"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-7 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/30 hover:bg-blue-400 transition active:scale-95"
                >
                  <span>⚡ Apply for Loan Now</span>
                </Link>
                <Link
                  to="/customer-login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-7 py-4 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition"
                >
                  Track Existing Application
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-base">✓</span>
                  <span>100% Free Consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-base">✓</span>
                  <span>No Upfront Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-base">✓</span>
                  <span>End-to-End DSA Support</span>
                </div>
              </div>
            </div>

            {/* Right Card / Visual Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
                      🏆
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Premier Lending Partner</h4>
                      <p className="text-[11px] text-blue-200">Verified Banks & Direct Integration</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 font-bold">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
                    <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Home Loans</span>
                    <span className="text-lg font-extrabold text-white">From 8.35%</span>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5">
                    <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Personal Loans</span>
                    <span className="text-lg font-extrabold text-white">From 10.49%</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-blue-100 block">Typical Disbursal Time</span>
                    <span className="text-sm font-extrabold text-white">24 - 48 Hours</span>
                  </div>
                  <Link
                    to="/products"
                    className="rounded-lg bg-white px-3 py-1.5 font-bold text-blue-900 hover:bg-blue-50 transition"
                  >
                    View Rates →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS COUNTER BAR ───────────────────────────────────────── */}
      <section className="-mt-10 relative z-10 mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-3xl bg-white p-6 shadow-xl border border-slate-200/80">
          <div className="text-center p-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">₹500 Cr+</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Loans Disbursed</div>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">25+</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Partner Banks & NBFCs</div>
          </div>
          <div className="text-center p-2 sm:border-l border-slate-100">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">99.4%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Customer Approval Rate</div>
          </div>
          <div className="text-center p-2 border-l border-slate-100">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">4.9 ★</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Over 15,000+ Reviews</div>
          </div>
        </div>
      </section>

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
            to="/products"
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
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100">
              Simple 4-Step Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              How DSA Loan Processing Works
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              From online application to direct bank disbursement, we streamline every step.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Select Product',
                desc: 'Pick your loan type and compare terms tailored to your borrowing limit.',
                icon: '🏷️',
              },
              {
                step: '02',
                title: 'Submit Details',
                desc: 'Enter your basic contact and financial details in under 2 minutes.',
                icon: '📝',
              },
              {
                step: '03',
                title: 'Advisor Matching',
                desc: 'A dedicated DSA loan officer matches your profile with top partner banks.',
                icon: '🤝',
              },
              {
                step: '04',
                title: 'Approval & Payout',
                desc: 'Get your loan forwarded to bank and funds directly credited into your account.',
                icon: '🎉',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-3xl border border-slate-200 bg-slate-50/70 p-6 text-center hover:bg-white hover:shadow-lg transition"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-md shadow-blue-600/30 mb-4">
                  {item.icon}
                </div>
                <span className="text-xs font-mono font-bold text-blue-600">STEP {item.step}</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">{item.title}</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR PARTNERS (5 BANKS + SEE ALL BUTTON) ───────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100">
              Institutional Tie-ups
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Our Banking Partners
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top financial institutions offering verified rates and fast processing through our DSA network.
            </p>
          </div>

          <Link
            to="/partners"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95 shrink-0"
          >
            See All Partners →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {partnerBanks.map((bank: any) => {
            const categoryTag = bank.isNationalize
              ? 'PSU Bank'
              : bank.isPrivate
              ? 'Private Bank'
              : bank.isNbfc
              ? 'NBFC'
              : 'Bank'

            return (
              <div
                key={bank.id}
                className="group rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xs hover:border-blue-400 hover:shadow-xl transition duration-200 flex flex-col items-center justify-between"
              >
                <div className="flex h-20 w-full items-center justify-center rounded-2xl bg-slate-50 p-3 mb-3 border border-slate-100 group-hover:bg-blue-50/50 transition">
                  {bank.logo ? (
                    <img
                      src={`${API_BASE_URL}/static/bank-logo-images/${bank.logo}`}
                      alt={bank.name}
                      className="max-h-12 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-3xl">🏦</span>
                  )}
                </div>

                <div className="w-full">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition">
                    {bank.name}
                  </h4>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-slate-400">
                    {categoryTag}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FINAL HIGH-IMPACT CALL TO ACTION ─────────────────────────── */}
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
    </div>
  )
}

export default Home
