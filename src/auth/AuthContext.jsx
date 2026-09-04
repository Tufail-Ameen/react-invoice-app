import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { onSessionExpired } from "../lib/apiClient";
import { hasEveryPermission, hasPermission } from "../lib/permissions";
import { getErrorMessage } from "../lib/rtkBaseQuery";
import { tokenStore } from "../lib/tokenStore";
import {
  invoiceApi,
  useLazyMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useSwitchBusinessMutation,
} from "../services/invoiceApi";

const AuthContext = createContext(null);
const BOOTSTRAP_TIMEOUT_MS = 4000;

function applySessionUser(user) {
  if (user?.activeBusinessId) tokenStore.setBusinessId(user.activeBusinessId);
  return user;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("BOOTSTRAP_TIMEOUT")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();
  const [switchBusinessMutation] = useSwitchBusinessMutation();
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
      // Bina token → seedha login.
      if (!tokenStore.access && !tokenStore.refresh) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      try {
        // Backend down / hang ho to Loading forever na rahe.
        const data = await withTimeout(fetchMe().unwrap(), BOOTSTRAP_TIMEOUT_MS);
        if (cancelled) return;
        setUser(applySessionUser(data.user));
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        tokenStore.clear();
        setUser(null);
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
        clearSession();
        toast.error("Session khatam. Dobara login karein.");
      }),
    [clearSession]
  );

  const login = useCallback(
    async (email, password) => {
      const data = await loginMutation({ email, password }).unwrap();
      tokenStore.set({
        ...data.tokens,
        businessId: data.user?.activeBusinessId || null,
      });
      setUser(applySessionUser(data.user));
      setStatus("authenticated");
      return data.user;
    },
    [loginMutation]
  );

  const register = useCallback(
    async (body) => {
      const data = await registerMutation(body).unwrap();
      tokenStore.set({
        ...data.tokens,
        businessId: data.user?.activeBusinessId || null,
      });
      setUser(applySessionUser(data.user));
      setStatus("authenticated");
      return data.user;
    },
    [registerMutation]
  );

  const switchBusiness = useCallback(
    async (businessId) => {
      const data = await switchBusinessMutation({ businessId }).unwrap();
      tokenStore.set({
        ...data.tokens,
        businessId: data.user?.activeBusinessId || businessId,
      });
      setUser(applySessionUser(data.user));
      dispatch(invoiceApi.util.resetApiState());
      return data.user;
    },
    [switchBusinessMutation, dispatch]
  );

  const logout = useCallback(async () => {
    try {
      if (tokenStore.refresh) {
        await logoutMutation(tokenStore.refresh).unwrap();
      }
    } catch {
      // local cleanup still needed
    }
    clearSession();
  }, [logoutMutation, clearSession]);

  const value = useMemo(() => {
    const permissions = user?.permissions ?? [];
    const activeBusiness =
      user?.businesses?.find((b) => b.id === user?.activeBusinessId) ||
      user?.businesses?.[0] ||
      null;

    return {
      user,
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      permissions,
      activeBusiness,
      businesses: user?.businesses ?? [],
      isPlatformAdmin:
        Boolean(user?.isPlatformAdmin) ||
        hasPermission(permissions, "platform.manage_businesses"),
      can: (permission) => hasPermission(permissions, permission),
      canAll: (list) => hasEveryPermission(permissions, list),
      login,
      register,
      logout,
      switchBusiness,
      getErrorMessage,
    };
  }, [user, status, login, register, logout, switchBusiness]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
