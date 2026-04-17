import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  username: string;
  namaLengkap: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, namaLengkap: string, username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setUser({
        id: data.id,
        username: data.username,
        namaLengkap: data.nama_lengkap,
        email: data.email,
      });
    }
    setLoading(false);
  };

const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { success: false, message: "Email atau password salah. Silakan coba lagi." };
    }
    return { success: false, message: error.message };
  }

  // Langsung fetch profil setelah login berhasil
  if (data.user) {
    await fetchUserProfile(data.user.id);
  }

  return { success: true, message: "Login berhasil!" };
};

  const register = async (
    email: string,
    namaLengkap: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    // Cek apakah username sudah dipakai
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .single();

    if (existingUser) {
      return { success: false, message: "Username sudah digunakan. Silakan pilih username lain." };
    }

    // Daftarkan akun baru — profil otomatis dibuat oleh trigger
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nama_lengkap: namaLengkap, username },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { success: false, message: "Email sudah terdaftar. Silakan gunakan email lain." };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: "Registrasi berhasil! Silakan login." };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}