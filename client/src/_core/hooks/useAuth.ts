import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { signOut } from "@/lib/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  uid: string;
  name: string | null;
  email: string | null;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {};
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated || loading) return;
    if (!user && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, [redirectOnUnauthenticated, loading, user]);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured) await signOut();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}
