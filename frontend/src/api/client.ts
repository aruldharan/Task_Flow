/**
 * Local API client - replaces Supabase client
 * Talks to the Express backend over HTTP with JWT auth
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<{ data: T | null; error: Error | null }> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    return { data: null, error: new Error(err.message ?? "Request failed") };
  }
  const data = await res.json();
  return { data, error: null };
}

// ----- Auth -----
export const auth = {
  signUp: async (email: string, password: string, displayName: string) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    const result = await handleResponse<{ token: string; user: LocalUser }>(res);
    if (result.data?.token) {
      localStorage.setItem("auth_token", result.data.token);
      localStorage.setItem("auth_user", JSON.stringify(result.data.user));
    }
    return result;
  },

  signIn: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await handleResponse<{ token: string; user: LocalUser }>(res);
    if (result.data?.token) {
      localStorage.setItem("auth_token", result.data.token);
      localStorage.setItem("auth_user", JSON.stringify(result.data.user));
    }
    return result;
  },

  signOut: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  },

  getUser: (): LocalUser | null => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  me: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders(),
    });
    return handleResponse<{ user: LocalUser }>(res);
  },

  googleLogin: async (accessToken: string) => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const result = await handleResponse<{ token: string; user: LocalUser }>(res);
    if (result.data?.token) {
      localStorage.setItem("auth_token", result.data.token);
      localStorage.setItem("auth_user", JSON.stringify(result.data.user));
    }
    return result;
  },

  getToken,
};

// ----- Generic resource API helpers -----
function resource(path: string) {
  const url = `${API_BASE}/${path}`;
  return {
    select: async (params: Record<string, string | string[] | null | undefined> = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) qs.set(k, String(v));
      }
      const full = qs.toString() ? `${url}?${qs}` : url;
      const res = await fetch(full, { headers: authHeaders() });
      return handleResponse<unknown[]>(res);
    },
    insert: async (body: object) => {
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<unknown>(res);
    },
    update: async (id: string, body: object) => {
      const res = await fetch(`${url}/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      return handleResponse<unknown>(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${url}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      return handleResponse<unknown>(res);
    },
  };
}

export const api = {
  tasks: resource("tasks"),
  projects: resource("projects"),
  tags: resource("tags"),
  comments: resource("comments"),
  timeLogs: resource("time-logs"),
  notifications: resource("notifications"),
  habits: resource("habits"),
  habitCompletions: resource("habit-completions"),
  dailyNotes: resource("daily-notes"),
  goals: resource("goals"),
  profiles: resource("profiles"),
  activityLog: resource("activity-log"),
  userRoles: resource("user-roles"),
};

// ----- Types -----
export interface LocalUser {
  id: string;
  email: string;
  display_name?: string;
}
