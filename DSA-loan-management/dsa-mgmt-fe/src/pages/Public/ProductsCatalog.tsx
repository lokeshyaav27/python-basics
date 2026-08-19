import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services/products'

import { ROUTES } from '../../constants/routes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const ProductsCatalog: React.FC = () => {
  const { data: products = [], isLoading } = useQuery({ queryKey: ['products-catalog-all'], queryFn: fetchProducts })
  const [selectedCategory, setSelectedCategory] = useState('all')

  const productFeaturesMap: Record<string, { rate: string; tenure: string; minIncome: string; highlights: string[] }> = {
    home: {
      rate: '8.35% - 9.75% p.a.',
      tenure: 'Up to 30 Years',
      minIncome: '₹25,000 / month',
      highlights: ['Zero foreclosure charges for floating rates', 'Special discount for female co-applicants', 'Up to 90% property funding'],
    },
    car: {
      rate: '8.75% - 11.50% p.a.',
      tenure: 'Up to 7 Years',
      minIncome: '₹20,000 / month',
      highlights: ['100% on-road financing available', 'Minimal documentation & same-day approval', 'New & pre-owned cars supported'],
    },
    personal: {
      rate: '10.49% - 15.99% p.a.',
      tenure: 'Up to 5 Years',
      minIncome: '₹15,000 / month',
      highlights: ['No collateral or security required', 'Direct disbursal within 24 hours', 'Flexible tenure with minimal paperwork'],
    },
    default: {
      rate: 'From 8.50% p.a.',
      tenure: 'Flexible Tenure',
      minIncome: '₹20,000 / month',
      highlights: ['Customized repayment terms', 'Multiple bank comparison', 'Dedicated loan specialist'],
    },
  }

  const getFeatureDetails = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('home') || n.includes('housing')) return productFeaturesMap.home
    if (n.includes('car') || n.includes('auto') || n.includes('vehicle')) return productFeaturesMap.car
    if (n.includes('personal') || n.includes('instant')) return productFeaturesMap.personal
    return productFeaturesMap.default
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-2">
          <span>✨ Curated Loan Marketplace</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Explore Our Loan Products
        </h1>
        <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
          Compare interest rates, tenure, and eligibility criteria from India's leading banks and financial institutions.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">Loading verified loan products…</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-slate-400">No active products found.</div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => {
            const meta = getFeatureDetails(product.name)
            return (
              <div
                key={product.id}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    {product.image ? (
                      <img
                        src={`${API_BASE_URL}/static/product-images/${product.image}`}
                        alt={product.name}
                        className="h-16 w-16 rounded-2xl object-cover border border-slate-200 bg-slate-50 p-1 group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl text-blue-700">
                        💳
                      </div>
                    )}
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1">
                      {meta.rate}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Key Highlights
                    </span>
                    {meta.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Terms Specs */}
                  <div className="mt-5 rounded-2xl bg-slate-50 p-3.5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Tenure</span>
                      <span className="font-bold text-slate-800">{meta.tenure}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Min. Income</span>
                      <span className="font-bold text-slate-800">{meta.minIncome}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-2">
                  <Link
                    to={`${ROUTES.APPLY_FOR_LOAN}?productId=${product.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition active:scale-[0.98]"
                  >
                    Apply for {product.name} →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default ProductsCatalog
