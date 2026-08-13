import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services/products'
import { fetchBanks } from '../../services/banks'

function Hero() {
  return (
    <section style={{ background: 'linear-gradient(110deg, #f7faff, #edf5ff)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">Your Dream. Our Support. Your Loan.</h1>
            <p className="mt-4 text-lg text-slate-600">We help you compare the best loan options from top banks and NBFCs to get the best deal.</p>

            <div className="mt-6 flex gap-3">
              <Link to="/apply" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow">Apply for Loan</Link>
              <Link to="/customer-login" className="inline-flex items-center px-5 py-3 border border-slate-200 rounded-md">Check Eligibility</Link>
            </div>

            <div className="mt-8 flex gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</span>
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">★</span>
                <span>Free Service</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">⚡</span>
                <span>Best Offers</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white/70 p-8 shadow-xl">
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick loan</div>
                    <div className="mt-2 text-2xl font-extrabold text-slate-900">₹ 25 L</div>
                  </div>
                  <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Best Rate</div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-500">Interest</span>
                    <span className="text-sm font-semibold text-slate-900">8.35% p.a.</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-500">Tenure</span>
                    <span className="text-sm font-semibold text-slate-900">Up to 30 yrs</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-500">Processing</span>
                    <span className="text-sm font-semibold text-slate-900">2-3 days</span>
                  </div>
                </div>
              </div>

              <div className="absolute right-6 bottom-6 bg-white rounded-xl shadow-md p-4 w-44">
                <div className="text-sm font-semibold">Quick & Easy</div>
                <div className="text-xs text-slate-500">Minimal documentation, competitive rates</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricsBar() {
  return (
    <div className="bg-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold">25+</div>
          <div className="text-sm">Partner Banks & NBFCs</div>
        </div>
        <div>
          <div className="text-2xl font-bold">10,000+</div>
          <div className="text-sm">Happy Customers</div>
        </div>
        <div>
          <div className="text-2xl font-bold">₹ 2500 Cr+</div>
          <div className="text-sm">Loans Disbursed</div>
        </div>
        <div>
          <div className="text-2xl font-bold">2 Days</div>
          <div className="text-sm">Average Turnaround Time</div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { data: products = [], isLoading: productsLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts })
  const { data: banks = [], isLoading: banksLoading } = useQuery({ queryKey: ['banks'], queryFn: fetchBanks })

  const defaultProducts = [
    { name: 'Home Loan', description: 'Buy your dream home with attractive interest rates and flexible tenure.', image: '/product-home.svg' },
    { name: 'Car Loan', description: 'Get the best car loan offers with quick approval and minimal paperwork.', image: '/product-car.svg' },
    { name: 'Personal Loan', description: 'Meet your personal needs with instant funds and hassle-free process.', image: '/product-personal.svg' },
  ]

  const displayProducts = products.length > 0 ? products : defaultProducts
  const previewBanks = (banks.length > 0 ? banks : [
    { id: 1, name: 'SBI', logo: '/logos/sbi.svg' },
    { id: 2, name: 'HDFC', logo: '/logos/hdfc.svg' },
    { id: 3, name: 'ICICI', logo: '/logos/icici.svg' },
    { id: 4, name: 'PNB', logo: '/logos/pnb.svg' },
    { id: 5, name: 'Bank of Baroda', logo: '/logos/bob.svg' },
    { id: 6, name: 'Axis Bank', logo: '/logos/sbi.svg' },
    { id: 7, name: 'Kotak Mahindra', logo: '/logos/hdfc.svg' }
  ]).slice(0, 5)

  const [productIndex, setProductIndex] = useState(0)
  const visibleProducts = useMemo(() => {
    if (displayProducts.length <= 3) return displayProducts

    return displayProducts.slice(productIndex, productIndex + 3)
  }, [displayProducts, productIndex])

  const goToPreviousProducts = () => {
    setProductIndex((prev) => (prev === 0 ? Math.max(displayProducts.length - 3, 0) : prev - 1))
  }

  const goToNextProducts = () => {
    setProductIndex((prev) => {
      if (displayProducts.length <= 3) return 0
      return prev >= displayProducts.length - 3 ? 0 : prev + 1
    })
  }

  return (
    <div>
      <Hero />
      <MetricsBar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-8 text-center">
          <h2 className="text-3xl font-semibold">Explore Loan Products</h2>
          <p className="mt-2 text-slate-500">Choose from a wide range of loan solutions tailored to your needs</p>
        </section>

        {productsLoading ? (
          <div className="text-center text-slate-600 py-8">Loading products...</div>
        ) : (
          <section>
            <div className="mb-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={goToPreviousProducts}
                className="h-10 w-10 rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
                aria-label="Previous products"
              >
                ←
              </button>
              <button
                type="button"
                onClick={goToNextProducts}
                className="h-10 w-10 rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
                aria-label="Next products"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((item: any, idx: number) => (
                <div key={item.id || item.name || idx} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-slate-50">
                      <img src={item.image || '/product-home.svg'} alt={item.name} className="w-28 h-20 object-contain" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                      <div className="mt-4">
                        <Link to="/apply" className={`inline-flex items-center px-4 py-2 rounded ${idx % 3 === 0 ? 'bg-green-600 text-white' : idx % 3 === 1 ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>Apply Now</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="text-center text-xl font-extrabold tracking-tight text-slate-900 md:text-left md:text-2xl">Our Top Lending Partners</div>
            <Link to="/partners" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              View all partners
            </Link>
          </div>
          {banksLoading ? (
            <div className="text-center text-slate-600">Loading banks...</div>
          ) : (
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {previewBanks.map((bank: any) => (
                <div key={bank.id || bank.name} className="bg-white rounded-lg shadow-sm px-4 py-3 min-w-[120px] flex items-center justify-center">
                  <img src={bank.logo || '/logos/sbi.svg'} alt={bank.name} className="h-8 object-contain" />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
