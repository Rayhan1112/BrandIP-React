import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { adminSignIn, logOut, onAuthChange, type AuthError } from '../firebase/authService';
import type { User } from 'firebase/auth';

const ADMIN_EMAIL = 'admin@gmail.com';

type AdminAuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  logout: () => Promise<void>;
  user: User | null;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      // Check if the user is the admin
      if (firebaseUser && firebaseUser.email === ADMIN_EMAIL) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminSignIn(email, password);
    if (result.success && result.user) {
      // Check if admin email
      if (result.user.email === ADMIN_EMAIL) {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        // Sign out if not admin
        await logOut();
        return { 
          success: false, 
          error: { code: 'auth/not-admin', message: 'This account does not have admin privileges.' } 
        };
      }
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await logOut();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, user }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
