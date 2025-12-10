"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, getCurrentUser, login, logout, createAccount } from "@/lib/auth";
import {
  getUserRole,
  createDefaultUserRole,
  UserRole,
} from "@/lib/api/user-roles";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Fetch user role
        const userRole = await getUserRole(currentUser.$id);
        setRole(userRole?.role || "user");
      }
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    await login(email, password);
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // Fetch user role after login
      const userRole = await getUserRole(currentUser.$id);
      if (userRole) {
        setRole(userRole.role);
      } else {
        // Create default role if not exists
        await createDefaultUserRole(currentUser.$id, email, currentUser.name);
        setRole("user");
      }
    }
  }

  async function handleRegister(email: string, password: string, name: string) {
    await createAccount(email, password, name);
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // Create default user role
      await createDefaultUserRole(currentUser.$id, email, name);
      setRole("user");
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setRole(null);
  }

  async function refreshUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin: role === "admin",
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
