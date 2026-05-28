"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { authErrorToTr, mapSupabaseAuthError } from "@/lib/authErrors";
import type { Profile, SignUpData } from "@/types";

interface AuthResult {
  error?: string;
  /** Kayıt sonrası e-posta doğrulaması gerekiyorsa true. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (patch: Partial<Profile>) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[Anonix] Profil alınamadı:", error.message);
      setProfile(null);
      return;
    }
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    // İlk yüklemede mevcut oturumu al.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id).finally(() => {
          if (active) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Oturum değişikliklerini dinle.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Supabase içinde deadlock'u önlemek için profil çağrısını ertele.
      if (newSession?.user) {
        setTimeout(() => fetchProfile(newSession.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(
    async ({ username, email, password, gender, isAnonymous, ageConfirmed, referralCode, inviteCode }: SignUpData): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Bu meta veriler DB tetikleyicisiyle profiles tablosuna yazılır.
          data: {
            username,
            gender,
            is_anonymous: isAnonymous,
            age_confirmed: ageConfirmed,
            ...(referralCode ? { referred_by_code: referralCode } : {}),
            ...(inviteCode ? { invite_code: inviteCode } : {}),
          },
        },
      });

      if (error) return { error: authErrorToTr(error.message) };

      // E-posta doğrulaması açıksa session gelmez.
      const needsEmailConfirmation = !data.session;
      return { needsEmailConfirmation };
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: authErrorToTr(error.message) };
      return {};
    },
    []
  );

  const signInWithOAuth = useCallback(
    async (provider: "google" | "apple"): Promise<AuthResult> => {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      // Sağlayıcı adı KESİNLİKLE küçük harf (Supabase küçük harf bekler).
      const providerName = provider.toLowerCase() as "google" | "apple";
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: providerName,
          options: { redirectTo },
        });
        if (error) {
          // Ham JSON / "provider is not enabled" gibi mesajları Türkçe'ye çevir.
          return { error: mapSupabaseAuthError(error as unknown as Parameters<typeof mapSupabaseAuthError>[0]) };
        }
        // Başarılıysa tarayıcı sağlayıcıya yönlenir; dönüş /auth/callback'te ele alınır.
        return {};
      } catch (e) {
        return { error: mapSupabaseAuthError((e as Error)?.message ?? "unknown") };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { error: authErrorToTr(error.message) };
    return {};
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>): Promise<AuthResult> => {
      if (!user) return { error: "Önce giriş yapmalısın." };
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single();

      if (error) return { error: authErrorToTr(error.message) };
      setProfile(data as Profile);
      return {};
    },
    [user]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  return ctx;
}
