import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services/products'

export default function ProductsCatalog() {
  const { data: products = [], isLoading } = useQuery({ queryKey: ['products-all'], queryFn: fetchProducts })

  const fallbackProducts = [
    {
      id: 1,
      name: 'Home Loan',
      description: 'Flexible home loan options with competitive interest rates and quick approval process.',
      image: '/product-home.svg',
    },
    {
      id: 2,
      name: 'Car Loan',
      description: 'Easy financing for your dream vehicle with minimal paperwork and fast processing.',
      image: '/product-car.svg',
    },
    {
      id: 3,
      name: 'Personal Loan',
      description: 'Meet urgent financial needs with quick access to funds and flexible repayment options.',
      image: '/product-personal.svg',
    },
    {
      id: 4,
      name: 'Business Loan',
      description: 'Support working capital and expansion goals with robust repayment structures.',
      image: '/product-home.svg',
    },
    {
      id: 5,
      name: 'Education Loan',
      description: 'Finance higher education with structured repayment options and institutional support.',
      image: '/product-car.svg',
    },
  ]

  const displayProducts = products.length > 0 ? products : fallbackProducts

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Loan products</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Explore loan options</h1>
        </div>
        <Link to="/" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
          ← Back to Home
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-600">Loading products...</div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {displayProducts.map((product: any, idx: number) => (
            <div key={product.id || product.name || idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="bg-slate-50 p-6">
                <img src={product.image || '/product-home.svg'} alt={product.name} className="h-28 w-full object-contain" />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-700">From 8.35% p.a.</span>
                  <Link to="/apply" className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Apply now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
