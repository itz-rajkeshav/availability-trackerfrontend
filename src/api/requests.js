import { get, post, del } from "./client.js";

export async function listMyRequests() {
  return get("/api/requests");
}

export async function createRequest({ callType, notes }) {
  return post("/api/requests", { callType, notes });
}

export async function cancelRequest(id) {
  return del(`/api/requests/${id}`);
}
