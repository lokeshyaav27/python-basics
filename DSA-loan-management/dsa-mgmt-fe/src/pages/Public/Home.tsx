import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services/products'
import ProductSlider from '../../shared/ProductSlider'

function Hero() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900">Your Dream. Our Support. Your Loan.</h1>
            <p className="mt-4 text-lg text-slate-600">We help you compare the best loan options from top banks and NBFCs and get the best deal.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/apply" className="inline-flex items-center px-5 py-3 bg-blue-600 text-white rounded-md">Apply for Loan</Link>
              <Link to="/customer/loans" className="inline-flex items-center px-4 py-3 border rounded-md">Check Eligibility</Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img src="/hero-placeholder.png" alt="home" className="w-full max-w-md rounded-lg shadow" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts })

  const homeProducts = products.filter((p: any) => /home/i.test(p.name || ''))
  const carProducts = products.filter((p: any) => /car/i.test(p.name || ''))
  const personalProducts = products.filter((p: any) => /personal/i.test(p.name || ''))

  return (
    <div>
      <Hero />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section>
          <h3 className="text-2xl font-semibold mb-4">Explore Loan Products</h3>
          {isLoading ? (
            <div>Loading products...</div>
          ) : (
            <div className="space-y-8">
              <div>
                <h4 className="font-bold mb-2">Home Loan</h4>
                <ProductSlider items={homeProducts} />
              </div>
              <div>
                <h4 className="font-bold mb-2">Car Loan</h4>
                <ProductSlider items={carProducts} />
              </div>
              <div>
                <h4 className="font-bold mb-2">Personal Loan</h4>
                <ProductSlider items={personalProducts} />
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-600">© DSA Finance — Demo</div>
      </footer>
    </div>
  )
}
