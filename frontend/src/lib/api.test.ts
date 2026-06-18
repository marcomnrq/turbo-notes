import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_URL, ApiError, categoriesApi } from "@/lib/api";

/**
 * Token storage keys (kept in sync with src/lib/tokens.ts — re-declared here so
 * tests don't depend on the private constants).
 */
const ACCESS_KEY = "turbo-notes.access";
const REFRESH_KEY = "turbo-notes.refresh";

function setTokens(access: string | null, refresh: string | null) {
  if (access) window.localStorage.setItem(ACCESS_KEY, access);
  else window.localStorage.removeItem(ACCESS_KEY);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
  else window.localStorage.removeItem(REFRESH_KEY);
}

/** Build a fetch mock that returns different responses per call. */
function fetchMock(responses: Array<{ status: number; body: unknown }>) {
  const calls = [...responses];
  const fn = vi.fn(async (_url: string, _init?: RequestInit) => {
    const next = calls.shift() ?? {
      status: 500,
      body: { detail: "no more mocks" },
    };
    return new Response(JSON.stringify(next.body), {
      status: next.status,
      headers: { "Content-Type": "application/json" },
    });
  });
  return fn;
}

describe("api client auth header", () => {
  beforeEach(() => setTokens("token-123", "refresh-123"));

  it("attaches the access token as a Bearer header", async () => {
    const fn = fetchMock([{ status: 200, body: [] }]);
    vi.stubGlobal("fetch", fn);
    await categoriesApi.list();
    const [url, init] = fn.mock.calls[0];
    // Calls go to the full Django URL, not a same-origin proxy.
    expect(url).toBe(`${API_URL}/api/categories`);
    const headers = (init as RequestInit).headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });

  it("works without a token (no Authorization header)", async () => {
    setTokens(null, null);
    const fn = fetchMock([{ status: 401, body: { detail: "Unauthorized" } }]);
    vi.stubGlobal("fetch", fn);
    await expect(categoriesApi.list()).rejects.toBeInstanceOf(ApiError);
    const [, init] = fn.mock.calls[0];
    expect((init?.headers as Headers).get("Authorization")).toBeNull();
  });
});

describe("api client 401 refresh-retry", () => {
  // The API client guards refreshes with a module-level `refreshing` promise
  // so concurrent 401s share one refresh. That state would leak between tests,
  // so we re-import the client fresh for this block.
  beforeEach(async () => {
    vi.resetModules();
    setTokens("expired", "refresh-123");
  });

  afterEach(() => vi.unstubAllGlobals());

  it("refreshes on 401 and retries the original request once", async () => {
    const { API_URL, categoriesApi } = await import("@/lib/api");
    // 1st call: 401. Refresh: 200 w/ new access. 2nd call (retry): 200 w/ data.
    const data = [{ id: 1, name: "School", color: "#3b82f6", note_count: 2 }];
    const fn = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === `${API_URL}/api/auth/refresh`) {
        return new Response(
          JSON.stringify({ access: "fresh-token", refresh: "rotated" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      const headers = init?.headers as Headers;
      const hasFresh = headers?.get("Authorization") === "Bearer fresh-token";
      if (!hasFresh) {
        return new Response(JSON.stringify({ detail: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fn as unknown as typeof fetch);
    const result = await categoriesApi.list();
    expect(result).toEqual(data);
    // Rotation stores the new access + rotated refresh tokens.
    expect(window.localStorage.getItem(ACCESS_KEY)).toBe("fresh-token");
    expect(window.localStorage.getItem(REFRESH_KEY)).toBe("rotated");
  });

  it("does not refresh without a refresh token", async () => {
    const { ApiError: LocalApiError, categoriesApi } = await import(
      "@/lib/api"
    );
    setTokens("expired", null);
    const fn = fetchMock([{ status: 401, body: { detail: "Unauthorized" } }]);
    vi.stubGlobal("fetch", fn);
    await expect(categoriesApi.list()).rejects.toBeInstanceOf(LocalApiError);
    // No refresh attempt was made.
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry infinitely — a second 401 after refresh fails", async () => {
    const {
      API_URL,
      ApiError: LocalApiError,
      categoriesApi,
    } = await import("@/lib/api");
    const fn = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url === `${API_URL}/api/auth/refresh`) {
        return new Response(
          JSON.stringify({ access: "fresh-token", refresh: "rotated" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      // Always 401, even with the fresh token.
      return new Response(JSON.stringify({ detail: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fn as unknown as typeof fetch);
    await expect(categoriesApi.list()).rejects.toBeInstanceOf(LocalApiError);
  });
});
