/**
 * JWT token storage helpers.
 *
 * Both the short-lived access token and the long-lived refresh token are kept
 * in localStorage and sent to the backend as request headers/body. SSR-safe:
 * every access guards against `window` being undefined.
 *
 * Trade-off: storing tokens in localStorage exposes them to XSS. For this app
 * (a notes challenge with no sensitive data) that's an acceptable trade for a
 * simpler architecture with no server-side proxy or cookie plumbing. A
 * production app handling sensitive data would typically move the refresh
 * token into an httpOnly cookie via a small backend-for-frontend.
 */

const ACCESS_TOKEN_KEY = "turbo-notes.access";
const REFRESH_TOKEN_KEY = "turbo-notes.refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
