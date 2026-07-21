import { get, del } from "./client.js";

// server scopes this by role - users/mentors get their own calls only, admin sees all
export async function listMeetings() {
  return get("/api/meetings");
}

// admin only, reopens the linked request
export async function deleteMeeting(id) {
  return del(`/api/meetings/${id}`);
}
