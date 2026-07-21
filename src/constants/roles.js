// role constants + the role -> home path map, one place instead of scattered
// string literals across App.jsx / Layout.jsx / client.js

export const ROLE = {
  USER: "USER",
  MENTOR: "MENTOR",
  ADMIN: "ADMIN",
};

export const ROLE_HOME = {
  [ROLE.USER]: "/dashboard",
  [ROLE.MENTOR]: "/mentor",
  [ROLE.ADMIN]: "/admin",
};

export const ROLE_LABEL = {
  [ROLE.USER]: "User",
  [ROLE.MENTOR]: "Mentor",
  [ROLE.ADMIN]: "Admin",
};

/** Each role signs in on its own page. */
export const ROLE_LOGIN_PATH = {
  [ROLE.USER]: "/login/user",
  [ROLE.MENTOR]: "/login/mentor",
  [ROLE.ADMIN]: "/login/admin",
};

export function homePathFor(role) {
  return ROLE_HOME[role] ?? "/login/user";
}
