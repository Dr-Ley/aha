"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import type { User } from "@/lib/data";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sessionToUser(session: { user?: { id?: string | null; email?: string | null; name?: string | null; role?: string; avatar?: string | null } }): User | null {
  const u = session?.user;
  if (!u?.id || !u?.email) return null;
  return {
    id: String(u.id),
    email: u.email,
    password: "", // never expose
    name: (u.name as string) ?? "",
    role: (u.role as "customer" | "staff" | "admin") ?? "customer",
    avatar: u.avatar ?? undefined,
    createdAt: "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const user = session ? sessionToUser(session) : null;

  const login = async (_email: string, _password: string): Promise<boolean> => {
    // Login is handled by AuthModal via signIn() from next-auth/react
    return false;
  };

  const logout = () => {
    nextAuthSignOut({ callbackUrl: "/" });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
