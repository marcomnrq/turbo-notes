/**
 * Typed API client for the Turbo Notes backend.
 *
 * The frontend calls Django directly over CORS. The browser origin
 * (localhost:3000) is whitelisted in Django's CORS_ALLOWED_ORIGINS, and every
 * authenticated request carries the access token as a `Authorization: Bearer`
 * header.
 *
 * On a 401 the client transparently refreshes the access token (using the
 * refresh token from localStorage) and retries the request once. A second
 * failure clears the session and bounces to /login.
 */

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/tokens";
import type { Category, Note, User } from "@/lib/types";

/** Raised when a request fails with a non-success status. */
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Base URL of the Django backend. */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

let refreshing: Promise<boolean> | null = null;

/**
 * Refresh the access token. Serialized so concurrent 401s share a single
 * refresh round-trip. Resolves false if there's no refresh token or the
 * refresh failed (caller should send the user to /login).
 */
function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const resp = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!resp.ok) return false;
      const data = (await resp.json()) as { access: string; refresh?: string };
      setAccessToken(data.access);
      // Rotation is on, so a new refresh token comes back — store it.
      if (data.refresh) setRefreshToken(data.refresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

function redirectToLogin(): void {
  clearTokens();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Try one transparent refresh on 401.
  if (resp.status === 401 && retry) {
    const ok = await refreshAccessToken();
    if (ok) return request<T>(path, options, false);
    redirectToLogin();
    throw new ApiError(401, "Unauthorized", null);
  }

  if (resp.status === 401) redirectToLogin();

  if (!resp.ok) {
    let body: unknown = null;
    try {
      body = await resp.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(resp.status, resp.statusText, body);
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<User> {
  const data = await request<{ access: string; refresh: string; user: User }>(
    "/api/auth/login",
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password }),
    },
    false,
  );
  setAccessToken(data.access);
  setRefreshToken(data.refresh);
  return data.user;
}

export async function signup(email: string, password: string): Promise<User> {
  const data = await request<{ access: string; refresh: string; user: User }>(
    "/api/auth/signup",
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password }),
    },
    false,
  );
  setAccessToken(data.access);
  setRefreshToken(data.refresh);
  return data.user;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await request(
        "/api/auth/logout",
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ refresh: refreshToken }),
        },
        false,
      );
    } catch {
      /* the server may already consider us logged out */
    }
  }
  clearTokens();
}

export async function getMe(): Promise<User | null> {
  if (!getAccessToken()) return null;
  try {
    return await request<User>(
      "/api/auth/me",
      { headers: JSON_HEADERS },
      false,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Notes + categories
// ---------------------------------------------------------------------------

export const notesApi = {
  list(params: { category?: number; search?: string } = {}): Promise<Note[]> {
    const search = new URLSearchParams();
    if (params.category) search.set("category", String(params.category));
    if (params.search?.trim()) search.set("search", params.search.trim());
    const qs = search.toString();
    return request<Note[]>(`/api/notes${qs ? `?${qs}` : ""}`);
  },

  create(
    payload: Partial<Pick<Note, "title" | "content" | "category">>,
  ): Promise<Note> {
    return request<Note>("/api/notes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  retrieve(id: number): Promise<Note> {
    return request<Note>(`/api/notes/${id}`);
  },

  update(
    id: number,
    payload: Partial<Pick<Note, "title" | "content" | "category">>,
  ): Promise<Note> {
    return request<Note>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  delete(id: number): Promise<void> {
    return request<void>(`/api/notes/${id}`, { method: "DELETE" });
  },
};

export const categoriesApi = {
  list(): Promise<Category[]> {
    return request<Category[]>("/api/categories");
  },
};
