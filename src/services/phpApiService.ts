/**
 * Service to fetch products from the PHP/Laravel API (domain products).
 * API returns products with image_path (e.g. "product/example-com/logo.png"); we build full image URLs via getProductImageUrl / image_url.
 */

const DEFAULT_IMAGE_BASE_URL = 'https://brandip-domains.s3.us-east-2.amazonaws.com';

/** Image base URL for product images (env: VITE_IMAGE_BASE_URL or VITE_CLOUDFRONT_URL, else default S3). */
export function getImageBaseUrl(): string {
  const url =
    import.meta.env.VITE_IMAGE_BASE_URL ||
    import.meta.env.VITE_CLOUDFRONT_URL ||
    DEFAULT_IMAGE_BASE_URL;
  return typeof url === 'string' ? url.replace(/\/$/, '') : DEFAULT_IMAGE_BASE_URL;
}

/**
 * Build full image URL from a single path. No double slashes.
 * Returns '' if path is null/empty. Leaves absolute URLs (http/https) as-is.
 */
function pathToFullUrl(path: string | null | undefined): string {
  if (!path || typeof path !== 'string' || !path.trim()) return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = getImageBaseUrl();
  const pathPart = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return base ? `${base}/${pathPart}` : '';
}

/**
 * Build full image URL from product's image_path. No double slashes.
 */
export function getProductImageUrl(product: { image_path?: string | null }): string {
  return pathToFullUrl(product.image_path);
}

/** Image object from details API (product_images). */
export interface ProductImageFromApi {
  path: string;
  id?: number | null;
  position?: number | null;
}

/**
 * Build full URL for each image path. No double slashes. Skips empty paths.
 */
export function buildGalleryImageUrls(images: ProductImageFromApi[] | null | undefined): string[] {
  if (!Array.isArray(images) || images.length === 0) return [];
  const base = getImageBaseUrl();
  const urls: string[] = [];
  for (const img of images) {
    const path = img?.path;
    if (!path || typeof path !== 'string' || !path.trim()) continue;
    const trimmed = path.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      urls.push(trimmed);
    } else {
      const pathPart = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
      if (base) urls.push(`${base}/${pathPart}`);
    }
  }
  return urls;
}

/** Matches product_flat / Laravel API response (domain product). */
export interface ProductFlat {
  id: number;
  sku: string | null;
  type: string | null;
  product_number: string | null;
  name: string | null;
  short_description: string | null;
  description: string | null;
  url_key: string | null;
  new: boolean | null;
  featured: boolean | null;
  status: boolean | null;
  meta_title: string | null;
  meta_keywords: string | null;
  meta_description: string | null;
  price: number | null;
  special_price: number | null;
  special_price_from: string | null;
  special_price_to: string | null;
  weight: number | null;
  created_at: string | null;
  locale: string | null;
  channel: string | null;
  attribute_family_id: number | null;
  product_id: number;
  updated_at: string | null;
  parent_id: number | null;
  visible_individually: boolean | null;
  /** From API (e.g. "product/example-com/logo.png"); use image_url for full URL. */
  image_path?: string | null;
}

/** Product with derived image_url (full URL) for UI. */
export interface ProductWithImageUrl extends ProductFlat {
  image_url: string;
  /** Full URLs for gallery (from API images[]). Empty if not from details endpoint. */
  image_urls?: string[];
}

/** Map API products to include derived image_url for UI. */
export function mapProductsWithImageUrl(products: ProductFlat[]): ProductWithImageUrl[] {
  return products.map((p) => ({
    ...p,
    image_url: getProductImageUrl(p),
  }));
}

/** DomainListing shape for homepage DomainCard (id, displayName, price, logoImage, coverImage). */
export interface DomainListingFromProduct {
  id: string;
  displayName: string;
  price?: string;
  coverImage?: string;
  logoImage?: string;
  logoType?: 'default';
}

/** Map a product to DomainListing for use in DomainCard. Uses last image as main (matches Laravel base image). */
export function productToDomainListing(p: ProductWithImageUrl): DomainListingFromProduct {
  const displayName = p.name ?? p.sku ?? p.url_key ?? `Product ${p.id}`;
  const priceVal = p.special_price != null && p.special_price > 0 ? p.special_price : p.price;
  const price = priceVal != null ? `$${Number(priceVal).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : undefined;
  const mainImage =
    (p.image_urls && p.image_urls.length > 0 ? p.image_urls.at(-1) ?? p.image_url : p.image_url) || undefined;
  return {
    id: String(p.id),
    displayName,
    price,
    coverImage: mainImage,
    logoImage: mainImage,
    logoType: mainImage ? 'default' : undefined,
  };
}

export interface ProductsPaginatedResult {
  products: ProductWithImageUrl[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

/**
 * Fetch one page of domain products.
 * Now reads from Firestore product_flat (PHP fetching commented out).
 */
export async function fetchProductsFromPhpPaginated(
  page: number = 1,
  perPage: number = 24,
  signal?: AbortSignal
): Promise<ProductsPaginatedResult> {
  const { fetchProductsFromFirestorePaginated } = await import('./firestoreProductService');
  return fetchProductsFromFirestorePaginated(page, perPage, signal);
}

// --- PHP fetching code (commented out): fetch from /api/products?page=&per_page= ---
// export async function fetchProductsFromPhpPaginated(
//   page: number = 1,
//   perPage: number = 24,
//   signal?: AbortSignal
// ): Promise<ProductsPaginatedResult> {
//   const base = getBaseUrl();
//   const isDev = import.meta.env.DEV;
//   const endpoint = isDev
//     ? `/api/products?page=${page}&per_page=${perPage}`
//     : `${base}/api/products?page=${page}&per_page=${perPage}`;
//   if (!isDev && !base) {
//     console.warn('VITE_PHP_API_BASE_URL is not set; PHP API calls will fail.');
//     return { products: [], total: 0, perPage: 24, currentPage: 1, lastPage: 1 };
//   }
//   try {
//     const res = await fetch(endpoint, {
//       method: 'GET',
//       headers: { Accept: 'application/json' },
//       signal,
//     });
//     if (!res.ok) {
//       console.error('PHP API error:', res.status, res.statusText);
//       return { products: [], total: 0, perPage, currentPage: page, lastPage: 1 };
//     }
//     const json = await res.json();
//     const list = unwrapData<ProductFlat>(json);
//     const products = mapProductsWithImageUrl(Array.isArray(list) ? list : []);
//     const meta = (json as { meta?: { total?: number; per_page?: number; current_page?: number; last_page?: number } }).meta;
//     const total = meta?.total ?? products.length;
//     const lastPage = meta?.last_page ?? 1;
//     return {
//       products,
//       total,
//       perPage: meta?.per_page ?? perPage,
//       currentPage: meta?.current_page ?? page,
//       lastPage,
//     };
//   } catch (err) {
//     if ((err as Error).name === 'AbortError') throw err;
//     console.error('Failed to fetch products from PHP:', err);
//     return { products: [], total: 0, perPage, currentPage: page, lastPage: 1 };
//   }
// }

/**
 * Fetch a single product by id for DomainDetails.
 * Now reads from Firestore product_flat (PHP fetching commented out).
 */
export async function fetchProductById(id: string | number, signal?: AbortSignal): Promise<ProductWithImageUrl | null> {
  const { fetchProductByIdFromFirestore } = await import('./firestoreProductService');
  return fetchProductByIdFromFirestore(id, signal);
}

// --- PHP fetching code (commented out): fetch from /api/products/:id ---
// export async function fetchProductById(id: string | number, signal?: AbortSignal): Promise<ProductWithImageUrl | null> {
//   const base = getBaseUrl();
//   const isDev = import.meta.env.DEV;
//   const endpoint = isDev ? `/api/products/${id}` : `${base}/api/products/${id}`;
//   if (!isDev && !base) return null;
//   try {
//     const res = await fetch(endpoint, {
//       method: 'GET',
//       headers: { Accept: 'application/json' },
//       signal,
//     });
//     if (!res.ok) return null;
//     const json = await res.json();
//     const data = (json as { data?: ProductFlat & { images?: ProductImageFromApi[] } }).data;
//     if (!data || typeof data !== 'object') return null;
//     const product = data as ProductFlat & { images?: ProductImageFromApi[] };
//     const image_url = getProductImageUrl(product);
//     const image_urls = buildGalleryImageUrls(product.images);
//     const galleryUrls = image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);
//     return {
//       ...product,
//       image_url: galleryUrls[0] ?? image_url,
//       image_urls: galleryUrls,
//     };
//   } catch (err) {
//     if ((err as Error).name === 'AbortError') throw err;
//     return null;
//   }
// }

/**
 * Fetch all domain products (no pagination).
 * Now reads from Firestore product_flat (PHP fetching commented out).
 */
export async function fetchProductsFromPhp(): Promise<ProductWithImageUrl[]> {
  const { fetchAllProductsFromFirestore } = await import('./firestoreProductService');
  return fetchAllProductsFromFirestore();
}

// --- PHP fetching code (commented out): fetch from /api/products ---
// export async function fetchProductsFromPhp(): Promise<ProductWithImageUrl[]> {
//   const base = getBaseUrl();
//   const isDev = import.meta.env.DEV;
//   const endpoint = isDev ? '/api/products' : `${base}/api/products`;
//   if (!isDev && !base) {
//     console.warn('VITE_PHP_API_BASE_URL is not set; PHP API calls will fail.');
//     return [];
//   }
//   try {
//     const res = await fetch(endpoint, {
//       method: 'GET',
//       headers: { Accept: 'application/json' },
//     });
//     if (!res.ok) {
//       console.error('PHP API error:', res.status, res.statusText);
//       return [];
//     }
//     const json = await res.json();
//     const list = unwrapData<ProductFlat>(json);
//     const products = Array.isArray(list) ? list : [];
//     return mapProductsWithImageUrl(products);
//   } catch (err) {
//     console.error('Failed to fetch products from PHP:', err);
//     return [];
//   }
// }
