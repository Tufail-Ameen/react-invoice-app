import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { authApi } from '@/api/endpoints'
import { onSessionExpired } from '@/lib/apiClient'
import { hasEveryPermission, hasPermission } from '@/lib/permissions'
import { tokenStore } from '@/lib/tokenStore'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('unauthenticated')
    queryClient.clear()
  }, [queryClient])

  // App khulte hi token se user bahal karna. Isi wajah se refresh par
  // login zinda rehta hai.
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!tokenStore.access && !tokenStore.refresh) {
        setStatus('unauthenticated')
        return
      }
      try {
        const { user: me } = await authApi.me()
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      } catch {
        if (cancelled) return
        tokenStore.clear()
        setStatus('unauthenticated')
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(
    () =>
      onSessionExpired(() => {
        clearSession()
        toast.error('Session khatam ho gayi. Dobara login karein.')
      }),
    [clearSession]
  )

  const login = useCallback(async (credentials) => {
    const { user: me, tokens } = await authApi.login(credentials)
    tokenStore.set(tokens)
    setUser(me)
    setStatus('authenticated')
    return me
  }, [])

  const establishSession = useCallback(({ user: me, tokens }) => {
    if (!tokens) return me
    tokenStore.set(tokens)
    setUser(me)
    setStatus('authenticated')
    return me
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout(tokenStore.refresh)
    } catch {
      // Server par session pehle hi ja chuki hai — local cleanup phir bhi zaroori.
    }
    clearSession()
  }, [clearSession])

  const value = useMemo(() => {
    const permissions = user?.permissions ?? []
    return {
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      permissions,
      isAdmin: permissions.length > 0,
      can: (permission) => hasPermission(permissions, permission),
      canAll: (list) => hasEveryPermission(permissions, list),
      login,
      establishSession,
      logout,
      setUser,
    }
  }, [user, status, login, establishSession, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
