const ACCESS_KEY = "invoice.accessToken";
const REFRESH_KEY = "invoice.refreshToken";

/**
 * Demo tokens localStorage mein hain.
 * Real backend mein refresh token httpOnly cookie mein rakho.
 */
export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
