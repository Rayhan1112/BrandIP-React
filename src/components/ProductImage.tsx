import { useState } from 'react';
import { getProductImageUrl, type ProductFlat, type ProductWithImageUrl } from '../services/phpApiService';

type ProductImageSource = ProductFlat | ProductWithImageUrl | { image_path?: string | null };

export interface ProductImageProps {
  /** Product with image_path or image_url (preferred). */
  product?: ProductImageSource;
  /** Or pass the full image URL directly. */
  imageUrl?: string;
  alt: string;
  className?: string;
  /** Placeholder when no image or on error (default: "No image" text). */
  placeholder?: React.ReactNode;
}

/**
 * Resolve URL from product: use first image (index 0) when product has image_urls, otherwise image_url or image_path.
 */
function otherwiseLoadFromProduct(product: ProductImageSource | undefined): string | undefined {
  if (!product) return undefined;
  if (product && 'image_urls' in product && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    return product.image_urls[0];
  }
  if (product && 'image_url' in product && product.image_url) return product.image_url;
  const fromPath = getProductImageUrl(product);
  return fromPath || undefined;
}

/**
 * Renders a product image with fallback. Uses first image (index 0) when loading from product.
 * Shows placeholder when image_url/product is empty or on load/error.
 */
export function ProductImage({ product, imageUrl, alt, className = '', placeholder }: ProductImageProps) {
  const url = imageUrl ?? otherwiseLoadFromProduct(product);
  const [error, setError] = useState(false);
  const showPlaceholder = !url || error;

  const placeholderContent = placeholder ?? 'No image';

  if (showPlaceholder) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-300 text-[#555555] text-sm ${className}`}
        aria-hidden
      >
        {placeholderContent}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
