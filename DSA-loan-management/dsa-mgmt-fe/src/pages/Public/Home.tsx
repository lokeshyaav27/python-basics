import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services/products'

function Hero() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">Your Dream. Our Support. Your Loan.</h1>
            <p className="mt-4 text-lg text-slate-600">We help you compare the best loan options from top banks and NBFCs to get the best deal.</p>

            <div className="mt-6 flex gap-3">
              <Link to="/apply" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow">Apply for Loan</Link>
              <Link to="/customer/loans" className="inline-flex items-center px-5 py-3 border border-slate-200 rounded-md">Check Eligibility</Link>
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
            <img src="/hero-placeholder.svg" alt="home" className="w-full max-w-lg rounded-lg shadow-xl" />

            <div className="absolute right-6 bottom-6 bg-white rounded-xl shadow-md p-4 w-44">
              <div className="text-sm font-semibold">Quick & Easy</div>
              <div className="text-xs text-slate-500">Minimal documentation, competitive rates</div>
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
  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts })

  // map product names to available data, with fallbacks
  const findByName = (keyword: string) => products.find((p: any) => new RegExp(keyword, 'i').test(p.name || ''))

  const home = findByName('home') || { name: 'Home Loan', description: 'Buy your dream home with attractive interest rates and flexible tenure.', image: '/product-home.svg' }
  const car = findByName('car') || { name: 'Car Loan', description: 'Get the best car loan offers with quick approval and minimal paperwork.', image: '/product-car.svg' }
  const personal = findByName('personal') || { name: 'Personal Loan', description: 'Meet your personal needs with instant funds and hassle-free process.', image: '/product-personal.svg' }

  return (
    <div>
      <Hero />
      <MetricsBar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="text-center mb-8">
          <h2 className="text-3xl font-semibold">Explore Loan Products</h2>
          <p className="text-slate-500 mt-2">Choose from a wide range of loan solutions tailored to your needs</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[home, car, personal].map((item: any, idx: number) => (
            <div key={idx} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-slate-50">
                  <img src={item.image} alt={item.name} className="w-28 h-20 object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                  <div className="mt-4">
                    <Link to="/apply" className={`inline-flex items-center px-4 py-2 rounded ${idx===0? 'bg-green-600 text-white' : idx===1 ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>Apply Now</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <div className="text-center text-slate-600 mb-4">Our Top Lending Partners</div>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <img src="/logos/sbi.svg" alt="SBI" className="h-8" />
            <img src="/logos/hdfc.svg" alt="HDFC" className="h-8" />
            <img src="/logos/icici.svg" alt="ICICI" className="h-8" />
            <img src="/logos/pnb.svg" alt="PNB" className="h-8" />
            <img src="/logos/bob.svg" alt="Bank of Baroda" className="h-8" />
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-600">© DSA Finance — Demo</div>
      </footer>
    </div>
  )
}
