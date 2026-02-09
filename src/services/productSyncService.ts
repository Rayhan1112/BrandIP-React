/**
 * Sync products from MySQL (via PHP API) into Firestore collection "product_flat".
 * Fetches all products in pages, then writes them to Firestore using batched writes.
 */

import {
  collection,
  doc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebase/config';
import {
  fetchProductsFromPhpPaginated,
  type ProductWithImageUrl,
  type ProductFlat,
} from './phpApiService';

const FIRESTORE_COLLECTION = 'product_flat';
const FETCH_PAGE_SIZE = 100;
const BATCH_SIZE = 500;

export interface ProductSyncResult {
  success: boolean;
  totalFetched: number;
  totalWritten: number;
  errors: string[];
}

/**
 * Convert a product to a Firestore-safe document (no undefined; use null for missing).
 */
function productToFirestoreDoc(product: ProductWithImageUrl | ProductFlat): DocumentData {
  const p = product as Record<string, unknown>;
  const out: DocumentData = {};
  const keys = [
    'id', 'sku', 'type', 'product_number', 'name', 'short_description', 'description',
    'url_key', 'new', 'featured', 'status', 'meta_title', 'meta_keywords', 'meta_description',
    'price', 'special_price', 'special_price_from', 'special_price_to', 'weight',
    'created_at', 'locale', 'channel', 'attribute_family_id', 'product_id', 'updated_at',
    'parent_id', 'visible_individually', 'image_path', 'image_url', 'image_urls',
  ];
  for (const key of keys) {
    if (key in p) {
      const v = p[key];
      out[key] = v === undefined ? null : v;
    }
  }
  return out;
}

/**
 * Fetch all products from MySQL (via PHP API) and store them in Firestore
 * under the collection "product_flat". Each document ID is the product's numeric id.
 *
 * Uses pagination to fetch (100 per page) and Firestore batched writes (500 per batch).
 * Requires Firebase to be configured and PHP API to be available (VITE_PHP_API_BASE_URL).
 *
 * @returns Result with totalFetched, totalWritten, and any errors.
 */
export async function syncAllProductsFromMysqlToFirestore(): Promise<ProductSyncResult> {
  const errors: string[] = [];
  let totalFetched = 0;
  let totalWritten = 0;

  if (!isFirebaseReady() || !db) {
    errors.push('Firebase is not configured or Firestore is not available.');
    return { success: false, totalFetched: 0, totalWritten: 0, errors };
  }

  const coll = collection(db, FIRESTORE_COLLECTION);

  // Fetch all products page by page from PHP API (which reads from MySQL)
  const allProducts: ProductWithImageUrl[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    try {
      const result = await fetchProductsFromPhpPaginated(page, FETCH_PAGE_SIZE);
      allProducts.push(...result.products);
      totalFetched = result.total;
      lastPage = result.lastPage;
      page++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to fetch page ${page}: ${msg}`);
      break;
    }
  } while (page <= lastPage);

  if (allProducts.length === 0 && errors.length === 0) {
    return {
      success: true,
      totalFetched: 0,
      totalWritten: 0,
      errors: [],
    };
  }

  // Write to Firestore in batches (max 500 per batch)
  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const chunk = allProducts.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const product of chunk) {
      const docId = String(product.id);
      const ref = doc(coll, docId);
      batch.set(ref, productToFirestoreDoc(product), { merge: true });
    }

    try {
      await batch.commit();
      totalWritten += chunk.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Batch write failed (offset ${i}): ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    totalFetched: allProducts.length,
    totalWritten,
    errors,
  };
}
