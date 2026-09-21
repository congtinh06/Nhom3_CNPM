import React, { createContext, useContext, useState } from 'react';

export type RoleKey = 'public' | 'user' | 'admin';

export interface AuthUser {
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  role: RoleKey;
  login: (user: AuthUser) => void;
  logout: () => void;
  switchRole: (role: RoleKey) => void;
  loginWithEmail: (email: string, pass: string) => { success: boolean; error?: string };
  registerUser: (name: string, email: string, pass: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'bankshield_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const role: RoleKey = user ? user.role : 'public';

  const login = (newUser: AuthUser) => {
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // TODO: Phân quyền theo chuỗi email chỉ là tạm thời, sẽ thay bằng JWT token từ backend
  const loginWithEmail = (email: string, pass: string) => {
    const trimmedEmail = email.trim();
    const trimmedPass = pass.trim();

    if (!trimmedEmail) return { success: false, error: 'Vui lòng nhập email.' };
    if (!trimmedPass) return { success: false, error: 'Vui lòng nhập mật khẩu.' };

    if (trimmedEmail.toLowerCase().includes('admin')) {
      const adminUser: AuthUser = {
        name: 'admin',
        email: trimmedEmail,
        role: 'admin',
      };
      login(adminUser);
      return { success: true };
    } else {
      const normalUser: AuthUser = {
        name: trimmedEmail.split('@')[0] || 'Nguyễn Văn An',
        email: trimmedEmail,
        role: 'user',
      };
      login(normalUser);
      return { success: true };
    }
  };

  const registerUser = (name: string, email: string, pass: string) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) return { success: false, error: 'Vui lòng nhập họ và tên.' };
    if (!trimmedEmail || !trimmedEmail.includes('@')) return { success: false, error: 'Email không hợp lệ.' };
    if (pass.length < 8) return { success: false, error: 'Mật khẩu cần tối thiểu 8 ký tự.' };

    const newUser: AuthUser = {
      name: trimmedName,
      email: trimmedEmail,
      role: 'user',
    };
    login(newUser);
    return { success: true };
  };

  const switchRole = (newRole: RoleKey) => {
    if (newRole === 'public') {
      logout();
    } else if (newRole === 'user') {
      login({ name: 'Nguyễn Văn An', email: 'user@example.com', role: 'user' });
    } else if (newRole === 'admin') {
      login({ name: 'admin', email: 'admin@anti-phishing-bank.example.com', role: 'admin' });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, role, login, logout, switchRole, loginWithEmail, registerUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
