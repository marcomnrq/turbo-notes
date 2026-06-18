/** Shared API types mirroring the Django backend serializers. */

export interface User {
  id: number;
  email: string;
}

export interface Category {
  id: number;
  name: string;
  /** Hex color, e.g. "#3b82f6", used to tint notes in this category. */
  color: string;
  note_count: number;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  category: number;
  /** ISO-8601 timestamp. */
  created_at: string;
  /** ISO-8601 timestamp; updates on every edit (drives "Last edited"). */
  updated_at: string;
}

/** Response shape from the auth endpoints (login/signup). */
export interface AuthResponse {
  user: User;
  /** Short-lived JWT; stored in localStorage and sent as a Bearer header. */
  access: string;
  /**
   * Long-lived refresh token. Returned to the BFF only — it lives in an
   * httpOnly cookie and never reaches client-side JS.
   */
  refresh?: string;
}
