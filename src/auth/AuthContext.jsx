import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { onSessionExpired } from "../lib/apiClient";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import { tokenStore } from "../lib/tokenStore";
import {
  invoiceApi,
  useLazyMeQuery,
  useLoginMutation,
  useLogoutMutation,
} from "../services/invoiceApi";

const AuthContext = createContext(null);
const USE_MOCK = process.env.REACT_APP_ENABLE_MOCK_API === "true";

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [fetchMe] = useLazyMeQuery();

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
    dispatch(invoiceApi.util.resetApiState());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // Real Express API (5001) pe JWT auth nahi — direct app open.
      if (!USE_MOCK) {
        if (cancelled) return;
        setUser({
          id: "local",
          firstName: "Local",
          lastName: "User",
          fullName: "Local User",
          email: "local@invoice.test",
        });
        setStatus("authenticated");
        return;
      }

      if (!tokenStore.access && !tokenStore.refresh) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const data = await fetchMe().unwrap();
        if (cancelled) return;
        setUser(data.user);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        tokenStore.clear();
        setStatus("unauthenticated");
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [fetchMe]);

  useEffect(
    () =>
      onSessionExpired(() => {
        if (!USE_MOCK) return;
        clearSession();
        toast.error("Session khatam. Dobara login karein.");
      }),
    [clearSession]
  );

  const login = useCallback(
    async (email, password) => {
      const data = await loginMutation({ email, password }).unwrap();
      tokenStore.set(data.tokens);
      setUser(data.user);
      setStatus("authenticated");
      return data.user;
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    if (!USE_MOCK) {
      toast.info("Real API mode — login required nahi.");
      return;
    }
    try {
      await logoutMutation(tokenStore.refresh).unwrap();
    } catch {
      // local cleanup still needed
    }
    clearSession();
  }, [logoutMutation, clearSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      login,
      logout,
      getErrorMessage,
    }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
