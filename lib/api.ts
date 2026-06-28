const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("pc_access_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("pc_access_token");
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("pc_access_token");
    }
    return this.token;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${API_URL}${path}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.clearToken();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      const error = await res.json().catch(() => ({ detail: "Request failed" }));
      const detail = typeof error.detail === "string" ? error.detail : JSON.stringify(error.detail);
      throw new Error(detail || "Request failed");
    }

    return res.json();
  }

  get<T>(path: string) { return this.request<T>("GET", path); }
  post<T>(path: string, body?: unknown) { return this.request<T>("POST", path, body); }
  put<T>(path: string, body?: unknown) { return this.request<T>("PUT", path, body); }
  delete<T>(path: string) { return this.request<T>("DELETE", path); }
}

export const api = new ApiClient();
