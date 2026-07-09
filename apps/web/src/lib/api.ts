const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

type ApiOptions = {
  token?: string;
};

function headers(options: ApiOptions = {}) {
  return {
    "Content-Type": "application/json",
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  };
}

export async function apiGet<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: headers(options),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: ApiOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: headers(options),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `API request failed: ${response.status}` }));
    throw new Error(error.detail ?? `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
