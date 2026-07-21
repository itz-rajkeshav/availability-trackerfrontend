import { ROLE_LOGIN_PATH, ROLE, homePathFor } from "../constants/roles.js";

// empty string in dev, goes through the vite proxy on the same origin
const API_URL = import.meta.env.VITE_API_URL || "";

const STORAGE_KEYS = ["token", "userRole", "userId", "userEmail"];

export function getToken() {
  return localStorage.getItem("token");
}

export function getStoredRole() {
  return localStorage.getItem("userRole");
}

export function clearAuthStorage() {
  for (const key of STORAGE_KEYS) localStorage.removeItem(key);
}

function redirectToLogin(expired = false) {
  const role = getStoredRole();
  const path = ROLE_LOGIN_PATH[role] ?? ROLE_LOGIN_PATH[ROLE.USER];
  clearAuthStorage();
  window.location.href = expired ? `${path}?expired=1` : path;
}

export async function api(method, path, body, options = {}) {
  const { skipAuthRedirect, headers: extraHeaders, ...fetchOptions } = options;

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    // spread fetchOptions first so method/headers/body below can't get clobbered by it
    ...fetchOptions,
    method,
    headers,
    credentials: "include",
    ...(body != null && { body: JSON.stringify(body) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      if (!skipAuthRedirect) redirectToLogin(true);
      throw Object.assign(new Error(data.error || "Session expired"), { status: 401, data });
    }
    if (res.status === 403 && !skipAuthRedirect) {
      // wrong role for this route, bounce them to their own home instead of a dead end
      const role = getStoredRole();
      if (role) window.location.href = homePathFor(role);
    }
    throw Object.assign(new Error(data.error || res.statusText), { status: res.status, data });
  }

  return data;
}

export const get = (path, options) => api("GET", path, null, options);
export const post = (path, body, options) => api("POST", path, body, options);
export const put = (path, body, options) => api("PUT", path, body, options);
export const del = (path, options) => api("DELETE", path, null, options);
