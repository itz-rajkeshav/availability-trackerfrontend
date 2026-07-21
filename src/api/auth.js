import { get, post } from "./client.js";

// expectedRole gets checked server-side, that's what makes the per-role login pages real
export async function login({ email, password, expectedRole }) {
  return post("/api/auth/login", { email, password, expectedRole }, { skipAuthRedirect: true });
}

export async function me() {
  return get("/api/auth/me", { skipAuthRedirect: true });
}
