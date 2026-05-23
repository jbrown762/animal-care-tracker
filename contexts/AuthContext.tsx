import type { Session, User } from "@supabase/supabase-js";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AuthProviderName, getAuthRedirectParams, makeAuthRedirectUri, normalizeReturnPath } from "@/lib/authRedirects";
import { isSupabaseConfigured } from "@/lib/env";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  completeAuthRedirect: (url: string) => Promise<string | null>;
  initialized: boolean;
  requestPasswordReset: (email: string) => Promise<void>;
  session: Session | null;
  signIn: (email: string, password: string, returnTo?: string) => Promise<void>;
  signInWithProvider: (provider: AuthProviderName, returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    returnTo?: string
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  updatePassword: (password: string) => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialized(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const completeAuthRedirect = useCallback(async (url: string) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { accessToken, code, error, next, refreshToken } = getAuthRedirectParams(url);
    if (error) {
      throw new Error(error);
    }

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (sessionError) {
        throw sessionError;
      }
    } else if (code) {
      const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
      if (codeError) {
        throw codeError;
      }
    }

    const { data } = await supabase.auth.getSession();
    setSession(data.session);

    return next ?? null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      completeAuthRedirect,
      initialized,
      async requestPasswordReset(email) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: makeAuthRedirectUri("/reset-password")
        });
        if (error) {
          throw error;
        }
      },
      session,
      user: session?.user ?? null,
      async signIn(email, password, returnTo) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
        router.replace((normalizeReturnPath(returnTo) ?? "/") as never);
      },
      async signInWithProvider(provider, returnTo) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        const redirectTo = makeAuthRedirectUri(normalizeReturnPath(returnTo) ?? undefined);
        const { data, error } = await supabase.auth.signInWithOAuth({
          options: {
            redirectTo,
            skipBrowserRedirect: true
          },
          provider
        });
        if (error) {
          throw error;
        }
        if (!data.url) {
          throw new Error("Unable to start the sign-in flow.");
        }

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== "success") {
          throw new Error("Sign-in was cancelled.");
        }

        const next = await completeAuthRedirect(result.url);
        router.replace((next ?? "/") as never);
      },
      async signOut() {
        if (!supabase) {
          return;
        }
        await supabase.auth.signOut();
        router.replace("/sign-in");
      },
      async signUp(email, password, displayName, returnTo) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName
            },
            emailRedirectTo: makeAuthRedirectUri(normalizeReturnPath(returnTo) ?? "/create-org")
          }
        });
        if (error) {
          throw error;
        }
        if (data.session) {
          router.replace((normalizeReturnPath(returnTo) ?? "/create-org") as never);
        }
        return { needsEmailConfirmation: !data.session };
      },
      async updatePassword(password) {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          throw error;
        }
        router.replace("/");
      }
    }),
    [completeAuthRedirect, initialized, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
