import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  login: (email: string, fullName: string) => void;
  register: (email: string, fullName: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUser(): User | null {
  const raw = localStorage.getItem("pge_user");
  return raw ? (JSON.parse(raw) as User) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const login = (email: string, fullName: string) => {
    const next = { email, fullName };
    setUser(next);
    localStorage.setItem("pge_user", JSON.stringify(next));
  };

  const register = (email: string, fullName: string) => login(email, fullName);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pge_user");
  };

  const value = useMemo(() => ({ user, login, register, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
