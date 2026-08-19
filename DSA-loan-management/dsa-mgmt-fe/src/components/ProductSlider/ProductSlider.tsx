import React, { useRef } from 'react'

interface ProductCardProps {
  item: any
}

const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  return (
    <div className="w-64 flex-shrink-0 bg-white border rounded-lg p-4 shadow-sm mr-4">
      <div className="h-36 bg-gray-100 rounded mb-3 flex items-center justify-center text-sm text-slate-500">
        {item.image ? <img src={item.image} alt={item.name} className="h-full" /> : 'Image'}
      </div>
      <h5 className="font-semibold">{item.name}</h5>
      <p className="text-sm text-slate-600 mt-1">{item.description?.slice(0, 80)}</p>
    </div>
  )
}

export interface ProductSliderProps {
  items?: any[]
}

const ProductSlider: React.FC<ProductSliderProps> = ({ items = [] }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  const scroll = (dir: 'left' | 'right') => {
    const el = ref.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  if (!items || items.length === 0) return <div className="text-sm text-slate-500">No products</div>

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-2"
        aria-label="Scroll Left"
      >
        ◀
      </button>
      <div ref={ref} className="flex overflow-x-auto no-scrollbar py-2 px-8">
        {items.map((it) => (
          <ProductCard key={it.id} item={it} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-2"
        aria-label="Scroll Right"
      >
        ▶
      </button>
    </div>
  )
}

export default ProductSlider
