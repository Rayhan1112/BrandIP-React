/**
 * Payment Service - Manages offline payments and transactions ecosystem
 * 
 * This service provides a complete ecosystem for:
 * - Offline payments (Money Transfer)
 * - Transactions linked to orders
 * - Payment verification workflow
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getNextTransactionNumber } from './counterService';

const OFFLINE_PAYMENTS_COLLECTION = 'offlinePayments';
const TRANSACTIONS_COLLECTION = 'transactions';

// ============================================
// Types for Payment Ecosystem
// ============================================

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'payment' | 'refund' | 'adjustment';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface OfflinePayment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentType: 'offline' | 'online';
  status: PaymentStatus;
  paymentProofRequired: boolean;
  paymentProofUploaded: boolean;
  paymentProof1Url?: string;
  paymentProof2Url?: string;
  paymentProofUploadedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  orderId: string;
  orderNumber: string;
  paymentId?: string;
  customerId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  paymentMethod: string;
  description: string;
  processingFee?: number;
  netAmount?: number;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Offline Payment Functions
// ============================================

/**
 * Get offline payment by ID
 */
export async function getOfflinePaymentById(paymentId: string): Promise<OfflinePayment | null> {
  if (!db) return null;
  try {
    const paymentRef = doc(db, OFFLINE_PAYMENTS_COLLECTION, paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) return null;
    
    const data = paymentSnap.data();
    return mapDocToOfflinePayment(paymentSnap.id, data);
  } catch (e) {
    console.error('getOfflinePaymentById error:', e);
    return null;
  }
}

/**
 * Get offline payment by order ID
 */
export async function getOfflinePaymentByOrderId(orderId: string): Promise<OfflinePayment | null> {
  if (!db) return null;
  try {
    const paymentsRef = collection(db, OFFLINE_PAYMENTS_COLLECTION);
    const q = query(paymentsRef, where('orderId', '==', orderId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return mapDocToOfflinePayment(doc.id, doc.data());
  } catch (e) {
    console.error('getOfflinePaymentByOrderId error:', e);
    return null;
  }
}

/**
 * Get all offline payments for a customer
 */
export async function getOfflinePaymentsByCustomerId(customerId: string): Promise<OfflinePayment[]> {
  if (!db) return [];
  try {
    const paymentsRef = collection(db, OFFLINE_PAYMENTS_COLLECTION);
    const q = query(paymentsRef, where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => mapDocToOfflinePayment(doc.id, doc.data()));
  } catch (e) {
    console.error('getOfflinePaymentsByCustomerId error:', e);
    return [];
  }
}

/**
 * Update offline payment with payment proofs
 */
export async function updateOfflinePaymentProofs(
  paymentId: string,
  proof1Url: string,
  proof2Url: string
): Promise<boolean> {
  if (!db) return false;
  try {
    const paymentRef = doc(db, OFFLINE_PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, {
      paymentProof1Url: proof1Url,
      paymentProof2Url: proof2Url,
      paymentProofUploaded: true,
      paymentProofUploadedAt: new Date(),
      updatedAt: new Date(),
    });
    return true;
  } catch (e) {
    console.error('updateOfflinePaymentProofs error:', e);
    return false;
  }
}

/**
 * Approve offline payment
 */
export async function approveOfflinePayment(
  paymentId: string,
  adminId: string,
  notes?: string
): Promise<boolean> {
  if (!db) return false;
  try {
    const paymentRef = doc(db, OFFLINE_PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, {
      status: 'completed',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      adminNotes: notes || '',
      updatedAt: new Date(),
    });
    return true;
  } catch (e) {
    console.error('approveOfflinePayment error:', e);
    return false;
  }
}

/**
 * Reject offline payment
 */
export async function rejectOfflinePayment(
  paymentId: string,
  adminId: string,
  notes: string
): Promise<boolean> {
  if (!db) return false;
  try {
    const paymentRef = doc(db, OFFLINE_PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, {
      status: 'failed',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      adminNotes: notes,
      updatedAt: new Date(),
    });
    return true;
  } catch (e) {
    console.error('rejectOfflinePayment error:', e);
    return false;
  }
}

// ============================================
// Transaction Functions
// ============================================

/**
 * Get transaction by ID
 */
export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  if (!db) return null;
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const transactionSnap = await getDoc(transactionRef);
    if (!transactionSnap.exists()) return null;
    
    const data = transactionSnap.data();
    return mapDocToTransaction(transactionSnap.id, data);
  } catch (e) {
    console.error('getTransactionById error:', e);
    return null;
  }
}

/**
 * Get transaction by order ID
 */
export async function getTransactionByOrderId(orderId: string): Promise<Transaction | null> {
  if (!db) return null;
  try {
    const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);
    const q = query(transactionsRef, where('orderId', '==', orderId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return mapDocToTransaction(doc.id, doc.data());
  } catch (e) {
    console.error('getTransactionByOrderId error:', e);
    return null;
  }
}

/**
 * Get all transactions for a customer
 */
export async function getTransactionsByCustomerId(customerId: string): Promise<Transaction[]> {
  if (!db) return [];
  try {
    const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);
    const q = query(
      transactionsRef, 
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => mapDocToTransaction(doc.id, doc.data()));
  } catch (e) {
    console.error('getTransactionsByCustomerId error:', e);
    return [];
  }
}

/**
 * Get transactions by order number
 */
export async function getTransactionsByOrderNumber(orderNumber: string): Promise<Transaction[]> {
  if (!db) return [];
  try {
    const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);
    const q = query(transactionsRef, where('orderNumber', '==', orderNumber));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => mapDocToTransaction(doc.id, doc.data()));
  } catch (e) {
    console.error('getTransactionsByOrderNumber error:', e);
    return [];
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus
): Promise<boolean> {
  if (!db) return false;
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    await updateDoc(transactionRef, {
      status,
      updatedAt: new Date(),
    });
    return true;
  } catch (e) {
    console.error('updateTransactionStatus error:', e);
    return false;
  }
}

/**
 * Create a refund transaction
 */
export async function createRefundTransaction(
  orderId: string,
  orderNumber: string,
  customerId: string,
  amount: number,
  originalTransactionId: string,
  reason: string
): Promise<{ transactionId: string; transactionNumber: string } | null> {
  if (!db) return null;
  try {
    const transactionNumber = await getNextTransactionNumber();
    
    const transactionRef = collection(db, TRANSACTIONS_COLLECTION);
    const transactionData = {
      orderId,
      orderNumber,
      paymentId: originalTransactionId,
      customerId,
      amount: -Math.abs(amount), // Negative for refund
      currency: 'USD',
      type: 'refund' as TransactionType,
      status: 'pending' as TransactionStatus,
      paymentMethod: 'Money Transfer',
      description: `Refund for order ${orderNumber}: ${reason}`,
      referenceId: originalTransactionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(transactionRef, transactionData);
    return { transactionId: docRef.id, transactionNumber };
  } catch (e) {
    console.error('createRefundTransaction error:', e);
    return null;
  }
}

// ============================================
// Helper Functions
// ============================================

function toDateSafe(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (typeof (v as { toDate?: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate();
  }
  if (v instanceof Date) return v;
  return undefined;
}

function mapDocToOfflinePayment(id: string, data: DocumentData): OfflinePayment {
  return {
    id,
    orderId: data.orderId || '',
    orderNumber: data.orderNumber || '',
    customerId: data.customerId || '',
    amount: Number(data.amount || 0),
    currency: data.currency || 'USD',
    paymentMethod: data.paymentMethod || 'Money Transfer',
    paymentType: data.paymentType || 'offline',
    status: (data.status as PaymentStatus) || 'pending',
    paymentProofRequired: data.paymentProofRequired !== false,
    paymentProofUploaded: data.paymentProofUploaded === true,
    paymentProof1Url: data.paymentProof1Url,
    paymentProof2Url: data.paymentProof2Url,
    paymentProofUploadedAt: toDateSafe(data.paymentProofUploadedAt),
    reviewedAt: toDateSafe(data.reviewedAt),
    reviewedBy: data.reviewedBy,
    adminNotes: data.adminNotes,
    transactionId: data.transactionId,
    createdAt: toDateSafe(data.createdAt) || new Date(),
    updatedAt: toDateSafe(data.updatedAt) || new Date(),
  };
}

function mapDocToTransaction(id: string, data: DocumentData): Transaction {
  return {
    id,
    orderId: data.orderId || '',
    orderNumber: data.orderNumber || '',
    paymentId: data.paymentId,
    customerId: data.customerId || '',
    amount: Number(data.amount || 0),
    currency: data.currency || 'USD',
    type: (data.type as TransactionType) || 'payment',
    status: (data.status as TransactionStatus) || 'pending',
    paymentMethod: data.paymentMethod || 'Money Transfer',
    description: data.description || '',
    processingFee: data.processingFee,
    netAmount: data.netAmount,
    referenceId: data.referenceId,
    metadata: data.metadata,
    createdAt: toDateSafe(data.createdAt) || new Date(),
    updatedAt: toDateSafe(data.updatedAt) || new Date(),
  };
}

// ============================================
// Export Type Helpers
// ============================================

export interface PaymentEcosystem {
  orderId: string;
  orderNumber: string;
  payment: OfflinePayment | null;
  transactions: Transaction[];
}
