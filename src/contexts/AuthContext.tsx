import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Admin' | 'HR' | 'Employee';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department?: string;
  position?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || '';

const parseResponse = async (res: Response) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Local fallback accounts used when backend is not reachable (deployed static frontend)
const FALLBACK_USERS: Record<string, AuthUser & { password: string }> = {
  'admin@example.com': { id: 'u-admin', name: 'Admin User', email: 'admin@example.com', avatar: 'https://i.pravatar.cc/150?img=12', role: 'Admin', password: 'password123' },
  'hr@example.com': { id: 'u-hr', name: 'HR Manager', email: 'hr@example.com', avatar: 'https://i.pravatar.cc/150?img=23', role: 'HR', password: 'password123' },
  'employee@example.com': { id: 'u-emp', name: 'Employee User', email: 'employee@example.com', avatar: 'https://i.pravatar.cc/150?img=45', role: 'Employee', password: 'password123' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('authUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const url = `${API_BASE}/api/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const parsed = await parseResponse(res);
      if (!res.ok) {
        // If backend returns 404 (not found) or other errors, attempt local fallback
        const bodyStr = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
        const msg = `Request to ${url} returned ${res.status} ${res.statusText}: ${bodyStr}`;
        if (res.status === 404) {
          const fallback = FALLBACK_USERS[email.toLowerCase()];
          if (fallback && fallback.password === password) {
            const { password: _p, ...userWithoutPassword } = fallback;
            setUser(userWithoutPassword);
            return;
          }
          throw new Error(msg);
        }
        throw new Error(msg);
      }

      if (!parsed || !parsed.data) {
        throw new Error(`Request to ${url} returned invalid response`);
      }

      setUser(parsed.data);
    } catch (error: any) {
      // Network or fetch error — fall back to sample accounts so the static deployed frontend can still login
      const fallback = FALLBACK_USERS[email.toLowerCase()];
      if (fallback && fallback.password === password) {
        const { password: _p, ...userWithoutPassword } = fallback;
        setUser(userWithoutPassword);
        return;
      }
      const errMsg = error?.message || String(error);
      throw new Error(`Login request failed: ${errMsg}`);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updates: Partial<AuthUser>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      return { ...currentUser, ...updates };
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
