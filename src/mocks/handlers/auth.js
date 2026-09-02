import { delay, http } from "msw";
import { db } from "../db";
import {
  guard,
  issueTokens,
  latency,
  noContent,
  ok,
  serializeUser,
  unauthorized,
  url,
  verifyToken,
} from "../http";

export const authHandlers = [
  http.post(url("/auth/login"), async ({ request }) => {
    await delay(latency());
    const { email, password } = await request.json();
    const user = db.data.users.find(
      (u) => u.email.toLowerCase() === String(email ?? "").toLowerCase().trim()
    );

    // Same message for bad email/password — user enumeration avoid.
    if (!user || user.password !== password)
      return unauthorized("Email ya password ghalat hai.");

    if (user.status === "suspended")
      return unauthorized("Account suspend hai.");

    user.lastLoginAt = new Date().toISOString();
    db.commit();
    return ok({ user: serializeUser(user), tokens: issueTokens(user.id) });
  }),

  http.post(url("/auth/refresh"), async ({ request }) => {
    await delay(100);
    const { refreshToken } = await request.json();
    const payload = refreshToken ? verifyToken(refreshToken) : null;
    const session = db.data.sessions.find((s) => s.token === refreshToken);

    if (!payload || payload.type !== "refresh" || !session)
      return unauthorized("Refresh token invalid hai.");

    // Rotate: purana session delete, naya issue.
    db.data.sessions = db.data.sessions.filter((s) => s.token !== refreshToken);
    db.commit();
    const user = db.data.users.find((u) => u.id === payload.sub);
    if (!user || user.status !== "active") return unauthorized("User inactive.");

    return ok({ tokens: issueTokens(user.id) });
  }),

  http.post(url("/auth/logout"), async ({ request }) => {
    await delay(80);
    const { refreshToken } = await request.json().catch(() => ({}));
    if (refreshToken) {
      db.data.sessions = db.data.sessions.filter((s) => s.token !== refreshToken);
      db.commit();
    }
    return noContent();
  }),

  http.get(url("/auth/me"), async ({ request }) => {
    await delay(latency());
    const auth = guard(request);
    if (auth.response) return auth.response;
    return ok({ user: serializeUser(auth.user) });
  }),
];
