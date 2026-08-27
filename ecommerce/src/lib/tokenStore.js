const ACCESS_KEY = 'nexa.accessToken'
const REFRESH_KEY = 'nexa.refreshToken'

/**
 * Tokens localStorage mein rakhe gaye hain kyunke ye ek demo hai.
 * Production mein refresh token httpOnly + Secure cookie mein hona chahiye
 * taake XSS use chura na sake. Access token memory mein rakhna behtar hai.
 */
export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY)
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY)
  },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
