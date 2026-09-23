const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) return false;
        const data = await r.json();
        setAccessToken(data.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Wrapper de fetch: adjunta el access token, y si la API responde 401
 * intenta refrescar la sesión UNA vez y reintenta la request original.
 * Si el refresh también falla, propaga el 401 para que la UI mande a login.
 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && !options.skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401 && !options.skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await doFetch();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Error de red" }));
    throw new ApiError(res.status, body.error ?? "Error inesperado");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export { ApiError };
