import { doc, getDoc, updateDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';

// Counter document structure
interface Counter {
  id: string;
  name: string;
  currentValue: number;
  increment: number;
}

// Get next order number (starts from 1000)
export async function getNextOrderNumber(): Promise<string> {
  try {
    const counterDoc = doc(db!, 'counters', 'orders');
    
    return await runTransaction(db!, async (transaction) => {
      const counterSnapshot = await transaction.get(counterDoc);
      
      if (!counterSnapshot.exists()) {
        // Initialize counter if it doesn't exist
        transaction.set(counterDoc, {
          name: 'Order Counter',
          currentValue: 1000,
          increment: 1,
        });
        return '1001';
      }
      
      const counter = counterSnapshot.data() as Counter;
      const nextValue = counter.currentValue + counter.increment;
      transaction.update(counterDoc, { currentValue: nextValue });
      return nextValue.toString();
    });
  } catch (error) {
    console.error('Error getting next order number:', error);
    // Fallback to timestamp-based order number
    return `ORD-${Date.now().toString(36).toUpperCase()}`;
  }
}

// Get next invoice number (starts from 1, resets per order or global)
export async function getNextInvoiceNumber(): Promise<string> {
  try {
    const counterDoc = doc(db!, 'counters', 'invoices');
    
    return await runTransaction(db!, async (transaction) => {
      const counterSnapshot = await transaction.get(counterDoc);
      
      if (!counterSnapshot.exists()) {
        // Initialize counter if it doesn't exist
        transaction.set(counterDoc, {
          name: 'Invoice Counter',
          currentValue: 1,
          increment: 1,
        });
        return 'INV-1';
      }
      
      const counter = counterSnapshot.data() as Counter;
      const nextValue = counter.currentValue + counter.increment;
      transaction.update(counterDoc, { currentValue: nextValue });
      return `INV-${nextValue}`;
    });
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    // Fallback to timestamp-based invoice number
    return `INV-${Date.now().toString(36).toUpperCase()}`;
  }
}

// Get next transaction number (starts from 1)
export async function getNextTransactionNumber(): Promise<string> {
  try {
    const counterDoc = doc(db!, 'counters', 'transactions');
    
    return await runTransaction(db!, async (transaction) => {
      const counterSnapshot = await transaction.get(counterDoc);
      
      if (!counterSnapshot.exists()) {
        // Initialize counter if it doesn't exist
        transaction.set(counterDoc, {
          name: 'Transaction Counter',
          currentValue: 1,
          increment: 1,
        });
        return 'TXN-1';
      }
      
      const counter = counterSnapshot.data() as Counter;
      const nextValue = counter.currentValue + counter.increment;
      transaction.update(counterDoc, { currentValue: nextValue });
      return `TXN-${nextValue}`;
    });
  } catch (error) {
    console.error('Error getting next transaction number:', error);
    // Fallback to timestamp-based transaction number
    return `TXN-${Date.now().toString(36).toUpperCase()}`;
  }
}

// Initialize counters manually (for admin setup)
export async function initializeCounters(): Promise<void> {
  try {
    const orderCounter = doc(db!, 'counters', 'orders');
    const invoiceCounter = doc(db!, 'counters', 'invoices');
    const transactionCounter = doc(db!, 'counters', 'transactions');
    
    const orderSnap = await getDoc(orderCounter);
    if (!orderSnap.exists()) {
      await setDoc(orderCounter, {
        name: 'Order Counter',
        currentValue: 1000,
        increment: 1,
      });
    }
    
    const invoiceSnap = await getDoc(invoiceCounter);
    if (!invoiceSnap.exists()) {
      await setDoc(invoiceCounter, {
        name: 'Invoice Counter',
        currentValue: 1,
        increment: 1,
      });
    }
    
    const transactionSnap = await getDoc(transactionCounter);
    if (!transactionSnap.exists()) {
      await setDoc(transactionCounter, {
        name: 'Transaction Counter',
        currentValue: 1,
        increment: 1,
      });
    }
  } catch (error) {
    console.error('Error initializing counters:', error);
  }
}
