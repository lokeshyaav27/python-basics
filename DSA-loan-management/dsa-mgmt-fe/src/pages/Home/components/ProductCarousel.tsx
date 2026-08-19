import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, API_BASE_URL } from '../../../constants'

interface ProductCarouselProps {
  products: any[]
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
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

export default ProductCarousel
