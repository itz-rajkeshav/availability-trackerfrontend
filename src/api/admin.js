import { get, post, put } from "./client.js";

export async function listUsers() {
  return get("/api/admin/users");
}

export async function listMentors() {
  return get("/api/admin/mentors");
}

export async function createUser(data) {
  return post("/api/admin/create-user", data);
}

// saving this re-embeds the mentor on the backend so search picks up the change
export async function updateMentorProfile(mentorId, data) {
  return put(`/api/admin/mentors/${mentorId}/profile`, data);
}

export async function listRequests(status = "PENDING") {
  return get(`/api/admin/requests?status=${encodeURIComponent(status)}`);
}

export async function getRecommendations(requestId, { days = 14, durationMinutes = 60 } = {}) {
  const q = new URLSearchParams({ days, durationMinutes }).toString();
  return get(`/api/admin/requests/${requestId}/recommendations?${q}`);
}

export async function getOverlap({ userId, mentorId, days = 14, durationMinutes = 60 }) {
  const q = new URLSearchParams({ userId, mentorId, days, durationMinutes }).toString();
  return get(`/api/admin/overlap?${q}`);
}

export async function bookCall({ requestId, mentorId, startTime, durationMinutes = 60, title }) {
  return post("/api/admin/bookings", { requestId, mentorId, startTime, durationMinutes, title });
}

export async function getAvailabilityForUser(userId, weekStart) {
  const q = weekStart ? `?weekStart=${weekStart}` : "";
  return get(`/api/admin/availability/${userId}${q}`);
}
