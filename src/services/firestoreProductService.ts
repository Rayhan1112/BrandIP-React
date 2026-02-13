/**
 * Fetch products from Firestore collection "product_flat".
 * Images are built from image_path using AWS base URL (same as before).
 */

import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  getProductImageUrl,
  buildGalleryImageUrls,
  type ProductFlat,
  type ProductWithImageUrl,
  type ProductImageFromApi,
} from './phpApiService';

const PRODUCT_FLAT_COLLECTION = 'product_flat';

type FirestoreData = Record<string, unknown> & {
  id?: number;
  product_id?: number;
  image_path?: string | null;
  images?: ProductImageFromApi[];
  created_at?: unknown;
  updated_at?: unknown;
};

function toTimestampString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return String(v);
}

/**
 * Map a Firestore document to ProductFlat (same attributes as product_flat / API).
 */
function docToProductFlat(docId: string, data: FirestoreData): ProductFlat {
  const id = data.id != null ? Number(data.id) : Number(docId);
  const product_id = data.product_id != null ? Number(data.product_id) : id;
  return {
    id,
    sku: (data.sku as string) ?? null,
    type: (data.type as string) ?? null,
    product_number: (data.product_number as string) ?? null,
    name: (data.name as string) ?? null,
    short_description: (data.short_description as string) ?? null,
    description: (data.description as string) ?? null,
    url_key: (data.url_key as string) ?? null,
    new: data.new as boolean | null ?? null,
    featured: data.featured as boolean | null ?? null,
    status: data.status as boolean | null ?? null,
    meta_title: (data.meta_title as string) ?? null,
    meta_keywords: (data.meta_keywords as string) ?? null,
    meta_description: (data.meta_description as string) ?? null,
    price: data.price != null ? Number(data.price) : null,
    special_price: data.special_price != null ? Number(data.special_price) : null,
    special_price_from: (data.special_price_from as string) ?? null,
    special_price_to: (data.special_price_to as string) ?? null,
    weight: data.weight != null ? Number(data.weight) : null,
    created_at: toTimestampString(data.created_at),
    locale: (data.locale as string) ?? null,
    channel: (data.channel as string) ?? null,
    attribute_family_id: data.attribute_family_id != null ? Number(data.attribute_family_id) : null,
    product_id,
    updated_at: toTimestampString(data.updated_at),
    parent_id: data.parent_id != null ? Number(data.parent_id) : null,
    visible_individually: data.visible_individually as boolean | null ?? null,
    image_path: (data.image_path as string) ?? undefined,
  };
}

/**
 * Map Firestore doc to ProductWithImageUrl (image_url from AWS via image_path).
 */
function docToProductWithImageUrl(docId: string, data: FirestoreData): ProductWithImageUrl {
  const flat = docToProductFlat(docId, data);
  const image_url = getProductImageUrl(flat);
  const images = data.images as ProductImageFromApi[] | undefined;
  const image_urls = buildGalleryImageUrls(images ?? null);
  const galleryUrls = image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);
  return {
    ...flat,
    image_url: galleryUrls[0] ?? image_url,
    image_urls: galleryUrls,
  };
}

/**
 * Fetch all products from Firestore product_flat collection.
 * Images remain from AWS (image_path → full URL via getProductImageUrl).
 */
export async function fetchAllProductsFromFirestore(): Promise<ProductWithImageUrl[]> {
  if (!db) return [];
  const coll = collection(db, PRODUCT_FLAT_COLLECTION);
  const q = query(coll);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToProductWithImageUrl(d.id, d.data() as FirestoreData));
}

/**
 * Fetch a single product by id from Firestore product_flat.
 * Returns null if not found. Image URL built from image_path (AWS).
 */
export async function fetchProductByIdFromFirestore(
  id: string | number,
  _signal?: AbortSignal
): Promise<ProductWithImageUrl | null> {
  if (!db) return null;
  const docRef = doc(db, PRODUCT_FLAT_COLLECTION, String(id));
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return docToProductWithImageUrl(snap.id, snap.data() as FirestoreData);
}

/**
 * Fetch one page of products from Firestore (client-side slice of full list).
 * Same API as PHP paginated for drop-in replacement.
 */
export async function fetchProductsFromFirestorePaginated(
  page: number = 1,
  perPage: number = 24,
  signal?: AbortSignal
): Promise<{
  products: ProductWithImageUrl[];
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}> {
  const all = await fetchAllProductsFromFirestore();
  if (signal?.aborted) {
    return { products: [], total: 0, perPage, currentPage: page, lastPage: 1 };
  }
  const total = all.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const products = all.slice(start, start + perPage);
  return {
    products,
    total,
    perPage,
    currentPage: page,
    lastPage,
  };
}
