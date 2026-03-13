import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, LocalUser } from "@/api/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = auth.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await auth.me();
      if (error) {
        auth.signOut();
        setUser(null);
      } else if (data?.user) {
        setUser(data.user);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await auth.signUp(email, password, displayName);
    if (error) throw error;
    if (data?.user) setUser(data.user);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    if (error) throw error;
    if (data?.user) setUser(data.user);
  };

  const googleSignIn = async (idToken: string) => {
    const { data, error } = await auth.googleLogin(idToken);
    if (error) throw error;
    if (data?.user) setUser(data.user);
  };

  const signOut = () => {
    auth.signOut();
    setUser(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, googleSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
