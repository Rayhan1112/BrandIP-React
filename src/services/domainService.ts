// Domain service for Firestore
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Domain interface matching Firestore structure
export interface Domain {
  id: string; // The sanitized domain name used as the Document ID
  domainName: string; // The original display name (e.g., "MyDomain.com")
  domainPrice: number;
  discount?: number;
  discountDuration?: string;
  status: 'Active' | 'Pending' | 'Sold';
  logoImage: string;
  mockupImage?: string;
  industryType?: string;
  nameStyle?: string;
  description?: string;
  shortDescription?: string;
  keywords?: string;
  escrowFee?: number;
  brokerageFee?: number;
  possibleUses?: string;
  createdAt: Date;
  userId: string;
  userEmail?: string;
  userName?: string;
}

export interface DomainUser {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
}

/**
 * Helper to sanitize domain names for use as Firestore Document IDs
 * Example: "MyDomain.com" -> "mydomain-com"
 */
const getDomainId = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '-');

// Transform Firestore document to Domain interface
function transformDomain(docSnap: QueryDocumentSnapshot<DocumentData> | DocumentData): Domain {
  const data = docSnap.data();
  return {
    id: docSnap.id, 
    domainName: data.domainName || docSnap.id,
    domainPrice: data.domainPrice || 0,
    discount: data.discount,
    discountDuration: data.discountDuration,
    status: data.status || 'Pending',
    logoImage: data.logoImage || '',
    mockupImage: data.mockupImage,
    industryType: data.industryType,
    nameStyle: data.nameStyle,
    description: data.description,
    shortDescription: data.shortDescription,
    keywords: data.keywords,
    escrowFee: data.escrowFee,
    brokerageFee: data.brokerageFee,
    possibleUses: data.possibleUses,
    createdAt: data.createdAt?.toDate() || new Date(),
    userId: data.userId || '',
    userEmail: data.userEmail || '',
    userName: data.userName || '',
  };
}

// Fetch user details by userId
export async function fetchUserById(userId: string): Promise<DomainUser | null> {
  try {
    const userRef = doc(db!, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userId,
        email: data.email || '',
        displayName: data.displayName,
        phone: data.phone,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Fetch all active domains
export async function fetchDomains(): Promise<Domain[]> {
  try {
    const domainsRef = collection(db!, 'domains');
    const q = query(domainsRef, where('status', '==', 'Active'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(transformDomain);
  } catch (error) {
    console.error('Error fetching domains:', error);
    return [];
  }
}

// Fetch domains by status
export async function fetchDomainsByStatus(status: 'Active' | 'Pending' | 'Sold'): Promise<Domain[]> {
  try {
    const domainsRef = collection(db!, 'domains');
    const q = query(domainsRef, where('status', '==', status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(transformDomain);
  } catch (error) {
    console.error('Error fetching domains by status:', error);
    return [];
  }
}

// Fetch domains by user
export async function fetchDomainsByUser(userId: string): Promise<Domain[]> {
  try {
    const domainsRef = collection(db!, 'domains');
    const q = query(domainsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(transformDomain);
  } catch (error) {
    console.error('Error fetching user domains:', error);
    return [];
  }
}

// Fetch single domain by its ID (the sanitized domain name)
export async function fetchDomainById(id: string): Promise<Domain | null> {
  try {
    // Ensure we are looking up the sanitized version
    const domainId = getDomainId(id);
    const domainRef = doc(db!, 'domains', domainId);
    const domainSnap = await getDoc(domainRef);
    
    if (domainSnap.exists()) {
      return transformDomain(domainSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching domain:', error);
    return null;
  }
}

// Submit a new domain request
export async function submitDomainRequest(domain: Omit<Domain, 'id' | 'createdAt' | 'status'>): Promise<string | null> {
  try {
    const domainId = getDomainId(domain.domainName);
    const domainRef = doc(db!, 'domains', domainId);
    
    // Check if domain already exists to prevent overwriting
    const existing = await getDoc(domainRef);
    if (existing.exists()) {
      throw new Error('Domain already exists in the system.');
    }

    await setDoc(domainRef, {
      ...domain,
      status: 'Pending',
      createdAt: new Date(),
    });
    
    return domainId;
  } catch (error) {
    console.error('Error submitting domain request:', error);
    return null;
  }
}

// Approve a domain request
export async function approveDomain(id: string): Promise<boolean> {
  try {
    const domainRef = doc(db!, 'domains', getDomainId(id));
    await updateDoc(domainRef, {
      status: 'Active',
      approvedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error approving domain:', error);
    return false;
  }
}

// Reject a domain request
export async function rejectDomain(id: string): Promise<boolean> {
  try {
    const domainRef = doc(db!, 'domains', getDomainId(id));
    await updateDoc(domainRef, {
      status: 'Sold',
      rejectedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error rejecting domain:', error);
    return false;
  }
}

// Search domains (client-side filter for simplicity, as Firestore doesn't support full-text search)
export async function searchDomains(searchTerm: string): Promise<Domain[]> {
  try {
    const domainsRef = collection(db!, 'domains');
    const q = query(domainsRef, where('status', '==', 'Active'));
    const querySnapshot = await getDocs(q);
    
    const searchLower = searchTerm.toLowerCase();
    return querySnapshot.docs
      .map(transformDomain)
      .filter(domain => 
        domain.domainName.toLowerCase().includes(searchLower) ||
        domain.shortDescription?.toLowerCase().includes(searchLower) ||
        domain.keywords?.toLowerCase().includes(searchLower) ||
        domain.industryType?.toLowerCase().includes(searchLower)
      );
  } catch (error) {
    console.error('Error searching domains:', error);
    return [];
  }
}