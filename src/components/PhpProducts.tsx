import { useState, useEffect } from 'react';
import { fetchProductsFromPhp, type ProductWithImageUrl } from '../services/phpApiService';
import { ProductImage } from './ProductImage';

function displayPrice(p: ProductWithImageUrl): { value: number; isSpecial: boolean } | null {
  const special = p.special_price != null && p.special_price > 0;
  const value = special ? Number(p.special_price) : (p.price != null ? Number(p.price) : null);
  if (value == null || Number.isNaN(value)) return null;
  return { value, isSpecial: !!special };
}

export function PhpProducts() {
  const [products, setProducts] = useState<ProductWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProductsFromPhp()
      .then((data) => {
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
          setProducts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-10 text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-brandip-accent border-t-transparent" />
        <p className="mt-4 text-[#555555]">Loading products from database…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-10 text-center">
        <p className="text-red-600 font-medium">Error loading products</p>
        <p className="mt-2 text-[#555555] text-sm">{error}</p>
        <p className="mt-2 text-[#555555] text-sm">
          For local DB: set VITE_PHP_API_BASE_URL=http://localhost:8080 and run the php-api-example server. For remote, the server must expose GET /api/products and allow CORS (or use the dev proxy).
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-10 text-center">
        <p className="text-[#555555]">No products found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-6">
        Products (product_flat)
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {products.map((p) => {
          const name = p.name ?? p.sku ?? `Product #${p.id}`;
          const desc = p.short_description ?? p.description ?? null;
          const priceInfo = displayPrice(p);
          return (
            <article
              key={p.id}
              className="bg-gray-100 rounded-xl overflow-hidden hover:ring-2 hover:ring-brandip-accent transition-all"
            >
              <div className="aspect-video bg-gray-200 overflow-hidden">
                <ProductImage
                  product={p}
                  alt={name}
                  className="w-full h-full object-cover"
                  placeholder="No image"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[#1A1A1A] text-lg truncate" title={name}>
                    {name}
                  </h3>
                  {p.featured && (
                    <span className="text-xs px-2 py-0.5 rounded bg-brandip-accent text-white">Featured</span>
                  )}
                  {p.status === false && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-400 text-white">Inactive</span>
                  )}
                </div>
                {p.sku && (
                  <p className="text-[#555555] text-xs mt-1">SKU: {p.sku}</p>
                )}
                {desc && (
                  <p className="text-[#555555] text-sm mt-2 line-clamp-2">{desc}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {priceInfo && (
                    <>
                      {priceInfo.isSpecial && p.price != null && (
                        <span className="text-gray-400 text-sm line-through">${Number(p.price).toFixed(2)}</span>
                      )}
                      <span className={`font-semibold ${priceInfo.isSpecial ? 'text-brandip-accent' : 'text-[#1A1A1A]'}`}>
                        ${priceInfo.value.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
