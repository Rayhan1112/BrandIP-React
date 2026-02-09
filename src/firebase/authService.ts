// Firebase Authentication Service
import {
  createUserWithEmailAndPassword as createUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, isFirebaseReady, db } from './config';

// Types for auth errors
export type AuthError = {
  code: string;
  message: string;
};

// Helper to format Firebase auth errors
function formatAuthError(error: any): AuthError {
  const code = error.code || 'unknown';
  let message = error.message || 'An unexpected error occurred';

  // Map Firebase error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-up method is not enabled. Please contact support.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/expired-action-code': 'This verification link has expired.',
    'auth/invalid-action-code': 'This verification link is invalid.',
    'auth/missing-verification-code': 'Verification code is missing.',
    'auth/invalid-verification-code': 'Invalid verification code.',
  };

  if (errorMessages[code]) {
    message = errorMessages[code];
  }

  return { code, message };
}

// Check if Firebase is configured
function checkFirebaseConfig(): { ready: boolean; error?: AuthError } {
  if (!isFirebaseReady()) {
    return {
      ready: false,
      error: { code: 'auth/not-configured', message: 'Firebase is not configured. Please add your credentials to .env file.' },
    };
  }
  if (!auth) {
    return {
      ready: false,
      error: { code: 'auth/initialize-failed', message: 'Firebase failed to initialize.' },
    };
  }
  return { ready: true };
}

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; user?: User; error?: AuthError }> {
  const configCheck = checkFirebaseConfig();
  if (!configCheck.ready) {
    return { success: false, error: configCheck.error };
  }

  try {
    const userCredential = await createUser(auth!, email, password);
    
    // Update user profile with display name
    await updateProfile(userCredential.user, {
      displayName,
    });

    // Create user document in Firestore
    const userDocRef = doc(db!, 'users', userCredential.user.uid);
    await setDoc(userDocRef, {
      email,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send email verification
    await sendEmailVerification(userCredential.user);

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: formatAuthError(error) };
  }
}

// Sign in with email and password
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: AuthError; needsVerification?: boolean }> {
  const configCheck = checkFirebaseConfig();
  if (!configCheck.ready) {
    return { success: false, error: configCheck.error };
  }

  try {
    // Set session persistence to local (remember user across sessions)
    await setPersistence(auth!, browserLocalPersistence);
    
    const userCredential = await signInWithEmailAndPassword(auth!, email, password);

    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      return {
        success: false,
        needsVerification: true,
        error: { code: 'auth/email-not-verified', message: 'Please verify your email address to sign in.' },
      };
    }

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: formatAuthError(error) };
  }
}

// Admin sign in - skips email verification
export async function adminSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: AuthError }> {
  const configCheck = checkFirebaseConfig();
  if (!configCheck.ready) {
    return { success: false, error: configCheck.error };
  }

  try {
    // Set session persistence to local (remember user across sessions)
    await setPersistence(auth!, browserLocalPersistence);
    
    const userCredential = await signInWithEmailAndPassword(auth!, email, password);
    // Skip email verification check for admin
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: formatAuthError(error) };
  }
}

// Send email verification link
export async function sendVerificationEmail(): Promise<{ success: boolean; error?: AuthError }> {
  const configCheck = checkFirebaseConfig();
  if (!configCheck.ready) {
    return { success: false, error: configCheck.error };
  }

  try {
    const user = auth!.currentUser;
    if (!user) {
      return { success: false, error: { code: 'auth/no-user', message: 'No user signed in.' } };
    }

    if (user.emailVerified) {
      return { success: false, error: { code: 'auth/already-verified', message: 'Email is already verified.' } };
    }

    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatAuthError(error) };
  }
}

// Sign out
export async function logOut(): Promise<{ success: boolean; error?: AuthError }> {
  const configCheck = checkFirebaseConfig();
  if (!configCheck.ready) {
    return { success: false, error: configCheck.error };
  }

  try {
    await firebaseSignOut(auth!);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatAuthError(error) };
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth?.currentUser ?? null;
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
  if (!isFirebaseReady() || !auth) {
    // Return a no-op unsubscribe function
    console.warn('Firebase not ready, auth state changes will not be tracked');
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Check if user is authenticated and email is verified
export function isUserVerified(user: User | null): boolean {
  return user !== null && user.emailVerified;
}
