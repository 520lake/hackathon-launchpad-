import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  full_name?: string;
  is_superuser?: boolean;
  avatar?: string;
  role?: string;
  bio?: string;
  skills?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  is_verified?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (token: string) => {
    try {
      const res = await axios.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    let token = localStorage.getItem('token');
    
    // Try to recover from cookie if localStorage is empty
    if (!token || token === 'undefined' || token === 'null') {
      const cookieToken = getCookie('access_token');
      if (cookieToken) {
        token = cookieToken;
        localStorage.setItem('token', token);
      }
    }

    if (token) {
      await fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    await fetchCurrentUser(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Clear cookies as well if possible (client side clearing of httpOnly cookies is limited but try)
    document.cookie = 'access_token=; Max-Age=0; path=/;';
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
