// Lightweight fetch wrapper that standardizes API responses
// - Returns `json.data ?? json` on success
// - Throws parsed JSON with { ok:false, code?, message?, fieldErrors? } or the Response when unavailable

type ApiInit = RequestInit & { auth?: boolean };

async function safeParseJson(res: Response): Promise<unknown | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init: ApiInit = {},
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  // Do not force Content-Type for GET/HEAD or when body is FormData
  const shouldSetJson = !(init.body instanceof FormData) && !headers.has("Content-Type");
  if (shouldSetJson) headers.set("Content-Type", "application/json");

  const res = await fetch(input, {
    ...init,
    headers,
    credentials: init.auth ? "include" : init.credentials,
  });

  const json = await safeParseJson(res);

  if (!res.ok) {
    // Prefer parsed JSON error, otherwise throw the Response for upstream handlers
    throw json ?? res;
  }

  // Some APIs return ActionData, others plain objects
  if (json && typeof json === "object") {
    if ("ok" in json) {
      const j = json as { ok?: unknown; data?: unknown };
      if (j.ok === false) throw json;
      return (j.data as T) ?? (json as T);
    }
    return json as T;
  }
  // No JSON body
  return undefined as T;
}

export function getJson<T = unknown>(url: string, init?: ApiInit) {
  return apiFetch<T>(url, { ...init, method: "GET" });
}

export function postJson<T = unknown>(url: string, body?: unknown, init?: ApiInit) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return apiFetch<T>(url, { ...init, method: "POST", body: payload });
}

export function putJson<T = unknown>(url: string, body?: unknown, init?: ApiInit) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return apiFetch<T>(url, { ...init, method: "PUT", body: payload });
}

export function patchJson<T = unknown>(url: string, body?: unknown, init?: ApiInit) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return apiFetch<T>(url, { ...init, method: "PATCH", body: payload });
}

export function del<T = unknown>(url: string, init?: ApiInit) {
  return apiFetch<T>(url, { ...init, method: "DELETE" });
}
