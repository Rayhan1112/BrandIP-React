/**
 * Cart Service - Firestore cart with full product details from MySQL
 * Add to cart: fetch full product from /api/products/:id, store in Firestore.
 * Remove/update/clear: read and write Firestore only.
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { getImageBaseUrl } from './phpApiService';
import { fetchProductById, type ProductWithImageUrl } from './phpApiService';
import { getNextOrderNumber, getNextInvoiceNumber } from './counterService';

const GUEST_CART_KEY = 'brandip_guest_cart_id';

/** Cart user id: Firebase uid when logged in, else persistent guest id from localStorage. */
function getCartUserId(): string {
  if (auth?.currentUser?.uid) return auth.currentUser.uid;
  let guestId = localStorage.getItem(GUEST_CART_KEY);
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    localStorage.setItem(GUEST_CART_KEY, guestId);
  }
  return guestId;
}

// ============================================
// Cart Types (matching Laravel API response)
// ============================================

export interface LaravelCartItem {
  id: number;           // cart_item id (for updates/removes)
  product_id: number;   // product id (for adding)
  quantity: number;
  name: string;
  price: number;
  formatted_price?: string;
  total: number;
  formatted_total?: string;
  product_url_key?: string;
  base_image?: string;
  image_path?: string;
  options?: Record<string, unknown>[];
}

export interface LaravelCart {
  id: number;
  items_count?: number;
  items_qty?: number;
  grand_total?: number;
  formatted_grand_total?: string;
  sub_total?: number;
  formatted_sub_total?: string;
  items: LaravelCartItem[];
}

export interface AddToCartResponse {
  data?: { id?: number; row_id?: string; quantity?: number };
  id?: number;
  row_id?: string;
  message?: string;
}

export interface CartResponse {
  data?: { items?: unknown[]; subtotal?: number };
  items?: unknown[];
  subtotal?: number;
}

// Legacy type for compatibility with existing components
export interface CartItem {
  id: string;
  domainId: string;
  domainName: string;
  domainPrice: number;
  logoImage: string;
  quantity: number;
  addedAt?: Date;
  product_url_key?: string;
}

// ============================================
// Wishlist Types
// ============================================

export interface WishlistItem {
  id: string;
  domainId: string;
  domainName: string;
  domainPrice: number;
  logoImage: string;
  userId: string;
  addedAt: Date;
}

export interface UserWishlistInfo {
  userId: string;
  userName: string;
  userEmail: string;
  wishlistCount: number;
  wishlistItems: WishlistItem[];
}

const CART_COLLECTION = 'cart';

/** Serializable product snapshot for Firestore (full detail from MySQL). */
function productToCartSnapshot(p: ProductWithImageUrl): Record<string, unknown> {
  const price = p.special_price != null && p.special_price > 0 ? p.special_price : (p.price ?? 0);
  return {
    id: p.id,
    product_id: p.product_id,
    name: p.name ?? p.sku ?? '',
    sku: p.sku ?? '',
    url_key: p.url_key ?? '',
    price: price,
    special_price: p.special_price ?? null,
    image_path: p.image_path ?? '',
    image_url: p.image_url ?? '',
    short_description: p.short_description ?? null,
    description: p.description ?? null,
  };
}

function cartDocToCartItem(docSnap: { id: string; data: () => DocumentData }): CartItem {
  const d = docSnap.data() as DocumentData & { addedAt?: { toDate: () => Date }; product?: Record<string, unknown>; quantity?: number; productId?: number };
  const product = (d.product as Record<string, unknown>) ?? {};
  const price = Number(product.price ?? d.price ?? 0);
  const name = String(product.name ?? d.name ?? '');
  const imageUrl = String(product.image_url ?? product.image_path ?? '');
  const logoImage =
    imageUrl.startsWith('http') || imageUrl.startsWith('//')
      ? imageUrl
      : imageUrl
        ? `${getImageBaseUrl()}/${String(imageUrl).replace(/^\//, '')}`
        : '';
  const rawAddedAt = d.addedAt;
  const addedAt =
    typeof rawAddedAt?.toDate === 'function'
      ? (rawAddedAt as { toDate: () => Date }).toDate()
      : rawAddedAt instanceof Date
        ? rawAddedAt
        : undefined;
  return {
    id: docSnap.id,
    domainId: String(product.id ?? product.product_id ?? d.productId ?? ''),
    domainName: name,
    domainPrice: price,
    logoImage,
    quantity: Number(d.quantity ?? 1),
    addedAt,
    product_url_key: product.url_key as string | undefined,
  };
}

// ============================================
// Cart Functions (Firestore + full product from MySQL)
// ============================================

/**
 * Get cart from Firestore for current user (or guest). Returns items with full product detail.
 */
export async function getCart(): Promise<{ items: CartItem[]; subtotal: number; cart?: LaravelCart }> {
  if (!db) return { items: [], subtotal: 0 };
  try {
    const cartUserId = getCartUserId();
    const cartRef = collection(db, CART_COLLECTION);
    const q = query(cartRef, where('cartUserId', '==', cartUserId));
    const snapshot = await getDocs(q);
    const items: CartItem[] = snapshot.docs.map((docSnap) =>
      cartDocToCartItem({ id: docSnap.id, data: () => docSnap.data() })
    );
    const subtotal = items.reduce((s, i) => s + i.domainPrice * i.quantity, 0);
    return { items, subtotal };
  } catch (e) {
    console.error('getCart error:', e);
    return { items: [], subtotal: 0 };
  }
}

/**
 * Add product to cart: fetch full product from MySQL (/api/products/:id), then store in Firestore.
 * If product already in cart, increment quantity.
 */
export async function addToCart(
  productId: number | string
): Promise<{ success: boolean; message?: string; cart?: LaravelCart }> {
  if (!db) return { success: false, message: 'Database not available' };
  try {
    const product = await fetchProductById(productId);
    if (!product) return { success: false, message: 'Product not found' };

    const cartUserId = getCartUserId();
    const cartRef = collection(db, CART_COLLECTION);
    const q = query(
      cartRef,
      where('cartUserId', '==', cartUserId),
      where('productId', '==', product.id)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      const docRef = existing.docs[0].ref;
      const currentQty = existing.docs[0].data().quantity ?? 1;
      await updateDoc(docRef, { quantity: currentQty + 1 });
      return { success: true, message: 'Added to cart' };
    }

    await addDoc(cartRef, {
      cartUserId,
      productId: product.id,
      quantity: 1,
      product: productToCartSnapshot(product),
      addedAt: new Date(),
    });
    return { success: true, message: 'Added to cart' };
  } catch (e) {
    console.error('addToCart error:', e);
    return { success: false, message: e instanceof Error ? e.message : 'Failed to add to cart' };
  }
}

/**
 * Update cart item quantity in Firestore.
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<{ success: boolean; message?: string }> {
  if (!db) return { success: false, message: 'Database not available' };
  try {
    const cartUserId = getCartUserId();
    const docRef = doc(db, CART_COLLECTION, itemId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data()?.cartUserId !== cartUserId) {
      return { success: false, message: 'Cart item not found' };
    }
    await updateDoc(docRef, { quantity: Math.max(1, Math.floor(quantity)) });
    return { success: true };
  } catch (e) {
    console.error('updateCartItemQuantity error:', e);
    return { success: false, message: e instanceof Error ? e.message : 'Failed to update quantity' };
  }
}

/**
 * Remove single item from cart (delete from Firestore).
 */
export async function removeFromCart(itemId: string): Promise<{ success: boolean; message?: string }> {
  if (!db) return { success: false, message: 'Database not available' };
  try {
    const cartUserId = getCartUserId();
    const docRef = doc(db, CART_COLLECTION, itemId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data()?.cartUserId !== cartUserId) {
      return { success: false, message: 'Cart item not found' };
    }
    await deleteDoc(docRef);
    return { success: true };
  } catch (e) {
    console.error('removeFromCart error:', e);
    return { success: false, message: e instanceof Error ? e.message : 'Failed to remove item' };
  }
}

/**
 * Clear entire cart for current user (delete all items from Firestore).
 */
export async function clearCart(): Promise<{ success: boolean; message?: string }> {
  if (!db) return { success: false, message: 'Database not available' };
  try {
    const cartUserId = getCartUserId();
    const cartRef = collection(db, CART_COLLECTION);
    const q = query(cartRef, where('cartUserId', '==', cartUserId));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    return { success: true };
  } catch (e) {
    console.error('clearCart error:', e);
    return { success: false, message: e instanceof Error ? e.message : 'Failed to clear cart' };
  }
}

/**
 * Check if a product is in cart.
 */
export async function isInCart(productId: string | number): Promise<boolean> {
  const { items } = await getCart();
  return items.some((i) => String(i.domainId) === String(productId));
}

// ============================================
// Event System for Cart Updates
// ============================================

export const CART_UPDATED_EVENT = 'cart-updated';

export function notifyCartUpdated(): void {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

// ============================================
// Orders (Firestore) - place order & offline payment
// ============================================

export interface BillingAddressForOrder {
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  country: string;
  city: string;
  phone: string;
  address: string;
  state: string;
  zipCode: string;
}

export interface OrderItemForFirestore {
  domainId: string;
  domainName: string;
  domainPrice: number;
  logoImage: string;
  quantity: number;
}

const ORDERS_COLLECTION = 'orders';

/**
 * Create an order in Firestore (and support offline payment e.g. Money Transfer).
 * Creates a complete ecosystem: Order -> Offline Payment -> Transaction
 * All three are linked together with references.
 * Returns order number, order id, payment id, and transaction id.
 */
export async function createOrderInFirestore(
  billingAddress: BillingAddressForOrder,
  paymentMethod: string,
  items: OrderItemForFirestore[],
  subtotal: number,
  processingFee: number,
  total: number
): Promise<{ orderNumber: string; orderId: string; paymentId: string; transactionId: string } | null> {
  if (!db) return null;
  try {
    const customerId = getCartUserId();
    
    // Get next sequential order number starting from 1001
    const orderNumber = await getNextOrderNumber();
    
    const now = new Date();
    
    // Create order document
    const orderRef = collection(db, ORDERS_COLLECTION);
    const orderData = {
      orderNumber,
      customerId,
      billingAddress: {
        email: billingAddress.email,
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        company: billingAddress.company || '',
        country: billingAddress.country,
        city: billingAddress.city,
        phone: billingAddress.phone,
        address: billingAddress.address,
        state: billingAddress.state,
        zipCode: billingAddress.zipCode,
      },
      paymentMethod,
      paymentStatus: 'offline', // Money Transfer / offline payment
      items: items.map((i) => ({
        domainId: i.domainId,
        domainName: i.domainName,
        domainPrice: i.domainPrice,
        logoImage: i.logoImage,
        quantity: i.quantity,
      })),
      subtotal,
      processingFee,
      total,
      status: 'pending',
      paymentVerificationStatus: 'pending',
      createdAt: now,
      // Ecosystem references
      paymentId: '', // Will be updated after payment creation
      transactionId: '', // Will be updated after transaction creation
    };
    const docRef = await addDoc(orderRef, orderData);
    const orderId = docRef.id;
    
    // Create offline payment record (linked to order)
    const paymentRef = collection(db, 'offlinePayments');
    const paymentData = {
      orderId,
      orderNumber,
      customerId,
      amount: total,
      currency: 'USD',
      paymentMethod: 'Money Transfer',
      paymentType: 'offline',
      status: 'pending',
      paymentProofRequired: true,
      paymentProofUploaded: false,
      createdAt: now,
      updatedAt: now,
      // Transaction reference
      transactionId: '',
    };
    const paymentDocRef = await addDoc(paymentRef, paymentData);
    const paymentId = paymentDocRef.id;
    
    // Create transaction record (linked to order and payment)
    const transactionRef = collection(db, 'transactions');
    const transactionData = {
      orderId,
      orderNumber,
      paymentId,
      customerId,
      amount: total,
      currency: 'USD',
      type: 'payment',
      status: 'pending',
      paymentMethod: 'Money Transfer',
      description: `Payment for order ${orderNumber}`,
      processingFee,
      netAmount: subtotal,
      createdAt: now,
      updatedAt: now,
    };
    const transactionDocRef = await addDoc(transactionRef, transactionData);
    const transactionId = transactionDocRef.id;
    
    // Update order with payment and transaction references
    await updateDoc(docRef, {
      paymentId,
      transactionId,
    });
    
    // Update payment with transaction reference
    await updateDoc(paymentDocRef, {
      transactionId,
    });
    
    return { orderNumber, orderId, paymentId, transactionId };
  } catch (e) {
    console.error('createOrderInFirestore error:', e);
    return null;
  }
}

// ============================================
// Orders - fetch by customer & update payment proofs
// ============================================

/** Admin review status for offline payment; kept on same order document and shown everywhere. */
export type PaymentVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  billingAddress: Record<string, unknown>;
  paymentMethod: string;
  paymentStatus: string;
  paymentVerificationStatus?: PaymentVerificationStatus;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
  items: { domainId: string; domainName: string; domainPrice: number; quantity: number; logoImage?: string }[];
  subtotal: number;
  processingFee: number;
  total: number;
  status: string;
  createdAt: Date;
  paymentProof1Url?: string;
  paymentProof2Url?: string;
  paymentProofUploadedAt?: Date;
  // Ecosystem references
  paymentId?: string;
  transactionId?: string;
  // Invoice references
  invoiceId?: string;
  invoiceNumber?: string;
}

/** Alias for admin dashboard components that expect "Order". */
export type Order = OrderRecord;

/** Single order line item (for admin dashboard). */
export type OrderItem = OrderRecord['items'][number];

export async function getOrdersByCustomerId(customerId: string): Promise<OrderRecord[]> {
  if (!db) return [];
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.() ?? (data.createdAt instanceof Date ? data.createdAt : new Date());
      const uploadedAt = data.paymentProofUploadedAt?.toDate?.();
      const reviewedAt = data.reviewedAt?.toDate?.();
      return {
        id: d.id,
        orderNumber: data.orderNumber ?? '',
        customerId: data.customerId ?? '',
        billingAddress: data.billingAddress ?? {},
        paymentMethod: data.paymentMethod ?? '',
        paymentStatus: data.paymentStatus ?? 'offline',
        paymentVerificationStatus: (data.paymentVerificationStatus as PaymentVerificationStatus) ?? 'pending',
        reviewedAt: reviewedAt ?? undefined,
        reviewedBy: data.reviewedBy ?? undefined,
        adminNotes: data.adminNotes ?? undefined,
        items: Array.isArray(data.items) ? data.items : [],
        subtotal: Number(data.subtotal ?? 0),
        processingFee: Number(data.processingFee ?? 0),
        total: Number(data.total ?? 0),
        status: data.status ?? 'pending',
        createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
        paymentProof1Url: data.paymentProof1Url ?? undefined,
        paymentProof2Url: data.paymentProof2Url ?? undefined,
        paymentProofUploadedAt: uploadedAt,
        // Ecosystem references
        paymentId: data.paymentId ?? undefined,
        transactionId: data.transactionId ?? undefined,
        // Invoice references
        invoiceId: data.invoiceId ?? undefined,
        invoiceNumber: data.invoiceNumber ?? undefined,
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error('getOrdersByCustomerId error:', e);
    return [];
  }
}

export async function updateOrderPaymentProofs(
  orderId: string,
  paymentProof1Url: string,
  paymentProof2Url: string
): Promise<boolean> {
  if (!db) return false;
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      paymentProof1Url,
      paymentProof2Url,
      paymentProofUploadedAt: new Date(),
    });
    return true;
  } catch (e) {
    console.error('updateOrderPaymentProofs error:', e);
    return false;
  }
}

function toDateSafe(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (typeof (v as { toDate?: () => Date }).toDate === 'function') return (v as { toDate: () => Date }).toDate();
  if (v instanceof Date) return v;
  return undefined;
}

function mapOrderDocToRecord(d: { id: string; data: () => Record<string, unknown> }): OrderRecord {
  const data = d.data();
  const createdAt = toDateSafe(data.createdAt) ?? new Date();
  const uploadedAt = toDateSafe(data.paymentProofUploadedAt);
  const reviewedAt = toDateSafe(data.reviewedAt);
  return {
    id: d.id,
    orderNumber: (data.orderNumber as string) ?? '',
    customerId: (data.customerId as string) ?? '',
    billingAddress: (data.billingAddress as Record<string, unknown>) ?? {},
    paymentMethod: (data.paymentMethod as string) ?? '',
    paymentStatus: (data.paymentStatus as string) ?? 'offline',
    paymentVerificationStatus: (data.paymentVerificationStatus as PaymentVerificationStatus) ?? 'pending',
    reviewedAt: reviewedAt ?? undefined,
    reviewedBy: (data.reviewedBy as string) ?? undefined,
    adminNotes: (data.adminNotes as string) ?? undefined,
    items: (Array.isArray(data.items) ? data.items : []) as OrderRecord['items'],
    subtotal: Number(data.subtotal ?? 0),
    processingFee: Number(data.processingFee ?? 0),
    total: Number(data.total ?? 0),
    status: (data.status as string) ?? 'pending',
    createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
    paymentProof1Url: (data.paymentProof1Url as string) ?? undefined,
    paymentProof2Url: (data.paymentProof2Url as string) ?? undefined,
    paymentProofUploadedAt: uploadedAt,
    // Ecosystem references
    paymentId: data.paymentId as string | undefined,
    transactionId: data.transactionId as string | undefined,
    // Invoice references
    invoiceId: data.invoiceId as string | undefined,
    invoiceNumber: data.invoiceNumber as string | undefined,
  };
}

/** Fetch a single order by id (for admin detail page). */
export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  if (!db) return null;
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return null;
    return mapOrderDocToRecord(snap);
  } catch (e) {
    console.error('getOrderById error:', e);
    return null;
  }
}

/** Fetch all orders for admin Sales > Orders (all payment types). */
export async function getAllOrdersForAdmin(): Promise<OrderRecord[]> {
  if (!db) return [];
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const snapshot = await getDocs(ordersRef);
    return snapshot.docs
      .map((d) => mapOrderDocToRecord(d))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error('getAllOrdersForAdmin error:', e);
    return [];
  }
}

/** Fetch all orders (offline payments) for admin payment verification. Same document as customer orders. */
export async function getOrdersForAdmin(): Promise<OrderRecord[]> {
  if (!db) return [];
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, where('paymentStatus', '==', 'offline'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => mapOrderDocToRecord(d))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error('getOrdersForAdmin error:', e);
    return [];
  }
}

/** Admin: set payment verification status (approve/reject). Status is stored on same order doc and reflected everywhere. */
export async function updateOrderPaymentVerification(
  orderId: string,
  paymentVerificationStatus: PaymentVerificationStatus,
  adminNotes?: string,
  reviewedBy?: string
): Promise<boolean> {
  if (!db) return false;
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      paymentVerificationStatus,
      reviewedAt: new Date(),
      reviewedBy: reviewedBy ?? null,
      ...(adminNotes !== undefined && { adminNotes }),
    });
    return true;
  } catch (e) {
    console.error('updateOrderPaymentVerification error:', e);
    return false;
  }
}

/** Admin: update editable fields on an order (e.g. adminNotes, or set status back to pending). */
export async function updateOrderAdminFields(
  orderId: string,
  fields: { adminNotes?: string; paymentVerificationStatus?: PaymentVerificationStatus }
): Promise<boolean> {
  if (!db) return false;
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    // Build update object, filtering out undefined values
    const update: Record<string, string | null> = {};
    if (fields.paymentVerificationStatus !== undefined) {
      update.paymentVerificationStatus = fields.paymentVerificationStatus;
    }
    if (fields.adminNotes !== undefined) {
      update.adminNotes = fields.adminNotes;
    }
    if (fields.paymentVerificationStatus === 'pending') {
      update.reviewedAt = null as unknown as string;
      update.reviewedBy = null as unknown as string;
    }
    await updateDoc(orderRef, update);
    return true;
  } catch (e) {
    console.error('updateOrderAdminFields error:', e);
    return false;
  }
}

// ============================================
// Invoice Management
// ============================================

export interface InvoiceRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  billingAddress: Record<string, unknown>;
  items: OrderRecord['items'];
  subtotal: number;
  processingFee: number;
  total: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  transactionCreated: boolean;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const INVOICES_COLLECTION = 'invoices';

/** Create invoice for an order */
export async function createInvoiceForOrder(
  orderId: string,
  createTransaction: boolean = false
): Promise<{ invoiceId: string; invoiceNumber: string; transactionId?: string } | null> {
  if (!db) return null;
  try {
    const order = await getOrderById(orderId);
    if (!order) return null;
    
    const invoiceNumber = await getNextInvoiceNumber();
    const now = new Date();
    
    const billing = order.billingAddress as {
      firstName?: string;
      lastName?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    } | undefined;
    
    const customerName = billing 
      ? `${billing.firstName || ''} ${billing.lastName || ''}`.trim() 
      : 'Unknown';
    
    const invoiceRef = collection(db, INVOICES_COLLECTION);
    const invoiceData = {
      orderId,
      orderNumber: order.orderNumber,
      invoiceNumber,
      customerName,
      customerEmail: billing?.email || '',
      billingAddress: order.billingAddress,
      items: order.items,
      subtotal: order.subtotal,
      processingFee: order.processingFee,
      total: order.total,
      currency: 'USD',
      status: 'issued',
      transactionCreated: createTransaction,
      issuedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(invoiceRef, invoiceData);
    let transactionId: string | undefined;
    
    // Create transaction if checkbox is checked
    if (createTransaction && order.transactionId) {
      transactionId = order.transactionId;
      // Update transaction status to completed
      await updateDoc(doc(db, 'transactions', order.transactionId), {
        status: 'completed',
        invoiceId: docRef.id,
        invoiceNumber,
        updatedAt: now,
      });
      
      // Update order with invoice reference
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        invoiceId: docRef.id,
        invoiceNumber,
        status: 'processing',
        updatedAt: now,
      });
    }
    
    return { invoiceId: docRef.id, invoiceNumber, transactionId };
  } catch (e) {
    console.error('createInvoiceForOrder error:', e);
    return null;
  }
}

/** Get invoice by ID */
export async function getInvoiceById(invoiceId: string): Promise<InvoiceRecord | null> {
  if (!db) return null;
  try {
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    const snap = await getDoc(invoiceRef);
    if (!snap.exists()) return null;
    
    const data = snap.data();
    return {
      id: snap.id,
      orderId: data.orderId || '',
      orderNumber: data.orderNumber || '',
      invoiceNumber: data.invoiceNumber || '',
      customerName: data.customerName || '',
      customerEmail: data.customerEmail || '',
      billingAddress: data.billingAddress || {},
      items: data.items || [],
      subtotal: Number(data.subtotal || 0),
      processingFee: Number(data.processingFee || 0),
      total: Number(data.total || 0),
      currency: data.currency || 'USD',
      status: (data.status as InvoiceRecord['status']) || 'draft',
      transactionCreated: data.transactionCreated === true,
      issuedAt: data.issuedAt?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  } catch (e) {
    console.error('getInvoiceById error:', e);
    return null;
  }
}

/** Get invoices by order ID */
export async function getInvoicesByOrderId(orderId: string): Promise<InvoiceRecord[]> {
  if (!db) return [];
  try {
    const invoicesRef = collection(db, INVOICES_COLLECTION);
    const q = query(invoicesRef, where('orderId', '==', orderId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((snap) => {
      const data = snap.data();
      return {
        id: snap.id,
        orderId: data.orderId || '',
        orderNumber: data.orderNumber || '',
        invoiceNumber: data.invoiceNumber || '',
        customerName: data.customerName || '',
        customerEmail: data.customerEmail || '',
        billingAddress: data.billingAddress || {},
        items: data.items || [],
        subtotal: Number(data.subtotal || 0),
        processingFee: Number(data.processingFee || 0),
        total: Number(data.total || 0),
        currency: data.currency || 'USD',
        status: (data.status as InvoiceRecord['status']) || 'draft',
        transactionCreated: data.transactionCreated === true,
        issuedAt: data.issuedAt?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    });
  } catch (e) {
    console.error('getInvoicesByOrderId error:', e);
    return [];
  }
}

/** Cancel invoice */
export async function cancelInvoice(invoiceId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
    await updateDoc(invoiceRef, {
      status: 'cancelled',
      updatedAt: new Date(),
    });
    return true;
  } catch (e) {
    console.error('cancelInvoice error:', e);
    return false;
  }
}

/** Get all invoices for admin */
export async function getAllInvoicesForAdmin(): Promise<InvoiceRecord[]> {
  if (!db) return [];
  try {
    const invoicesRef = collection(db, INVOICES_COLLECTION);
    const snapshot = await getDocs(invoicesRef);
    return snapshot.docs
      .map((snap) => {
        const data = snap.data();
        return {
          id: snap.id,
          orderId: data.orderId || '',
          orderNumber: data.orderNumber || '',
          invoiceNumber: data.invoiceNumber || '',
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          billingAddress: data.billingAddress || {},
          items: data.items || [],
          subtotal: Number(data.subtotal || 0),
          processingFee: Number(data.processingFee || 0),
          total: Number(data.total || 0),
          currency: data.currency || 'USD',
          status: (data.status as InvoiceRecord['status']) || 'draft',
          transactionCreated: data.transactionCreated === true,
          issuedAt: data.issuedAt?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e) {
    console.error('getAllInvoicesForAdmin error:', e);
    return [];
  }
}

// ============================================
// Wishlist Functions (Firebase)
// ============================================

function transformWishlistItem(docSnap: DocumentData): WishlistItem {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    domainId: data.domainId || '',
    domainName: data.domainName || '',
    domainPrice: data.domainPrice || 0,
    logoImage: data.logoImage || '',
    userId: data.userId || '',
    addedAt: data.addedAt?.toDate() || new Date(),
  };
}

export async function addToWishlist(
  userId: string,
  domainId: string,
  domainName: string,
  domainPrice: number,
  logoImage: string
): Promise<string | null> {
  try {
    const wishlistRef = collection(db!, 'wishlist');
    const q = query(wishlistRef, where('userId', '==', userId), where('domainId', '==', domainId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return 'already_exists';
    
    const docRef = await addDoc(wishlistRef, {
      userId,
      domainId,
      domainName,
      domainPrice,
      logoImage,
      addedAt: new Date(),
    });
    return docRef.id;
  } catch (e) {
    console.error('addToWishlist error:', e);
    return null;
  }
}

export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  try {
    const wishlistRef = collection(db!, 'wishlist');
    const q = query(wishlistRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(transformWishlistItem);
  } catch (e) {
    console.error('getUserWishlist error:', e);
    return [];
  }
}

export async function removeFromWishlist(wishlistItemId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db!, 'wishlist', wishlistItemId));
    return true;
  } catch (e) {
    console.error('removeFromWishlist error:', e);
    return false;
  }
}

export async function isInWishlist(userId: string, domainId: string): Promise<boolean> {
  try {
    const wishlistRef = collection(db!, 'wishlist');
    const q = query(wishlistRef, where('userId', '==', userId), where('domainId', '==', domainId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (e) {
    console.error('isInWishlist error:', e);
    return false;
  }
}

export async function getAllUsersWithWishlists(): Promise<UserWishlistInfo[]> {
  try {
    const wishlistRef = collection(db!, 'wishlist');
    const wishlistSnapshot = await getDocs(wishlistRef);
    if (wishlistSnapshot.empty) return [];
    
    const userWishlists: Record<string, WishlistItem[]> = {};
    wishlistSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = data.userId;
      const item: WishlistItem = {
        id: docSnap.id,
        domainId: data.domainId || '',
        domainName: data.domainName || '',
        domainPrice: data.domainPrice || 0,
        logoImage: data.logoImage || '',
        userId: userId || '',
        addedAt: data.addedAt?.toDate() || new Date(),
      };
      if (!userWishlists[userId]) userWishlists[userId] = [];
      userWishlists[userId].push(item);
    });
    
    const usersRef = collection(db!, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const userDetails: Record<string, { displayName: string; email: string }> = {};
    usersSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      userDetails[docSnap.id] = { displayName: data.displayName || 'Unknown', email: data.email || 'No email' };
    });
    
    const result: UserWishlistInfo[] = [];
    for (const [userId, items] of Object.entries(userWishlists)) {
      const detail = userDetails[userId] || { displayName: 'Unknown', email: 'No email' };
      result.push({
        userId,
        userName: detail.displayName,
        userEmail: detail.email,
        wishlistCount: items.length,
        wishlistItems: items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime()),
      });
    }
    return result.sort((a, b) => b.wishlistCount - a.wishlistCount);
  } catch (e) {
    console.error('getAllUsersWithWishlists error:', e);
    return [];
  }
}

// ============================================
// Legacy/Compatibility Functions
// ============================================

/**
 * Get cart item count (number of items, not total quantity)
 */
export async function getCartItemCount(): Promise<number> {
  const { items } = await getCart();
  return items.length;
}

/**
 * Get cart total quantity (sum of all item quantities)
 */
export async function getCartTotalQuantity(): Promise<number> {
  const { items } = await getCart();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get cart grand total price (from Firestore cart).
 */
export async function getCartGrandTotal(): Promise<number> {
  const { items } = await getCart();
  return items.reduce((sum, i) => sum + i.domainPrice * i.quantity, 0);
}

