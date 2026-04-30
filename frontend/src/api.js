import { authHeaders, removeToken } from "./auth";

export async function authFetch(url, options = {}, onUnauthorized) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    removeToken();
    if (onUnauthorized) onUnauthorized();
    return null;
  }

  return res;
}