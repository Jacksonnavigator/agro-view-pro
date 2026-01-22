// Authentication context for role-based access control
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types/device';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@agroview.pro': {
    password: 'admin123',
    user: {
      id: 'user-1',
      email: 'admin@agroview.pro',
      name: 'Admin User',
      role: 'admin',
    },
  },
  'viewer@agroview.pro': {
    password: 'viewer123',
    user: {
      id: 'user-2',
      email: 'viewer@agroview.pro',
      name: 'Viewer User',
      role: 'viewer',
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Check for persisted session
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser = mockUsers[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem('auth_user', JSON.stringify(mockUser.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
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
