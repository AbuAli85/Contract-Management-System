// Auto base URL + fetch wrapper for same-origin client calls and absolute server calls

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return appUrl.replace(/\/+$/, '');
}

export function apiUrl(path: string): string {
  const p = `/${path}`.replace(/\/+/, '/');
  return `${getBaseUrl()}${p}`;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(apiUrl(path), { credentials: 'include', ...init });
}

export async function apiJson<T>(path: string, init: RequestInit = {}) {
  const res = await apiFetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }
  return (await res.json()) as T;
}


