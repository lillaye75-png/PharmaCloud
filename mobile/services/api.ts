const API_URL = "http://localhost:8000/api/v1";

let token: string | null = null;

export const api = {
  setToken: (t: string) => { token = t; },
  getToken: () => token,
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
    return res.json();
  },
  get: <T>(path: string) => api.request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => api.request<T>("POST", path, body),
};
