import { get, put } from "./client.js";

export async function getMyProfile() {
  return get("/api/profiles/me");
}

// USER only, mentor profiles are admin-controlled
export async function updateMyProfile(data) {
  return put("/api/profiles/me", data);
}
