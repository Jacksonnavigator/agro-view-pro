// Authentication context for role-based access control
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { User, UserRole } from '@/types/device';
import { auth, database, ref, get } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (value: unknown): UserRole =>
  value === 'admin' ? 'admin' : 'viewer';

async function resolveUser(firebaseUser: FirebaseUser): Promise<User> {
  const token = await firebaseUser.getIdTokenResult(true);
  let role = normalizeRole(token.claims.role);
  let name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';

  try {
    const profileSnapshot = await get(ref(database, `users/${firebaseUser.uid}`));
    if (profileSnapshot.exists()) {
      const profile = profileSnapshot.val() as { role?: UserRole; name?: string };
      role = normalizeRole(profile.role || role);
      name = profile.name || name;
    }
  } catch (error) {
    // Silently handle profile load failure, use default values
  }

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        setUser(await resolveUser(firebaseUser));
      } catch (error) {
        // Failed to resolve user, handle gracefully
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(await resolveUser(credential.user));
      return true;
    } catch (error) {
      // Sign-in failed, return false for UI handling
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    void signOut(auth);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (!user) return false;
      // Admin has access to everything
      if (user.role === 'admin') return true;
      return user.role === role;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
