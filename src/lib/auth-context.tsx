import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { signIn, signOut, getSession, type SessionUser } from "./db";

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, login: async () => null, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession());
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { user: u, error } = await signIn(email, password);
    if (u) setUser(u);
    return error;
  };

  const logout = () => {
    signOut();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
