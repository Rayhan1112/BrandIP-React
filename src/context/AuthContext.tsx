import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signUp,
  signIn,
  logOut,
  sendVerificationEmail,
  onAuthChange,
  isUserVerified,
  type AuthError,
} from '../firebase/authService';

// Types
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  error: AuthError | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: AuthError }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; needsVerification?: boolean; error?: AuthError }>;
  logOut: () => Promise<{ success: boolean; error?: AuthError }>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: AuthError }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const handleSignUp = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    setError(null);
    const result = await signUp(email, password, displayName);
    setIsLoading(false);
    if (!result.success && result.error) {
      setError(result.error);
    }
    return result;
  };

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    const result = await signIn(email, password);
    setIsLoading(false);
    if (!result.success && result.error) {
      setError(result.error);
    }
    return result;
  };

  const handleLogOut = async () => {
    setIsLoading(true);
    setError(null);
    const result = await logOut();
    setIsLoading(false);
    if (!result.success && result.error) {
      setError(result.error);
    }
    return result;
  };

  const handleSendVerificationEmail = async () => {
    setError(null);
    const result = await sendVerificationEmail();
    if (!result.success && result.error) {
      setError(result.error);
    }
    return result;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && isUserVerified(user),
    isEmailVerified: !!user && user.emailVerified,
    isLoading,
    error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    logOut: handleLogOut,
    sendVerificationEmail: handleSendVerificationEmail,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
