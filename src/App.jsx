import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import { ROLE, ROLE_LOGIN_PATH, homePathFor } from "./constants/roles.js";

import UserLogin from "./pages/login/UserLogin";
import MentorLogin from "./pages/login/MentorLogin";
import AdminLogin from "./pages/login/AdminLogin";

import UserDashboard from "./pages/UserDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminRequestDetail from "./pages/admin/AdminRequestDetail";
import AdminMentors from "./pages/admin/AdminMentors";
import AdminPeople from "./pages/admin/AdminPeople";
import AdminMeetings from "./pages/admin/AdminMeetings";

function FullScreenMessage({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-ink-500">{children}</div>
    </div>
  );
}

// route guard, but just for UX - the API enforces roles independently so messing
// with localStorage doesn't actually get you anywhere
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenMessage>Loading…</FullScreenMessage>;

  if (!user) {
    // send to whichever login page matches the area they were trying to reach
    const target = location.pathname.startsWith("/admin")
      ? ROLE_LOGIN_PATH[ROLE.ADMIN]
      : location.pathname.startsWith("/mentor")
        ? ROLE_LOGIN_PATH[ROLE.MENTOR]
        : ROLE_LOGIN_PATH[ROLE.USER];
    return <Navigate to={target} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenMessage>Loading…</FullScreenMessage>;
  return <Navigate to={user ? homePathFor(user.role) : ROLE_LOGIN_PATH[ROLE.USER]} replace />;
}

/** Already signed in? Skip the login page. */
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenMessage>Loading…</FullScreenMessage>;
  if (user) return <Navigate to={homePathFor(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login/user" element={<PublicOnly><UserLogin /></PublicOnly>} />
      <Route path="/login/mentor" element={<PublicOnly><MentorLogin /></PublicOnly>} />
      <Route path="/login/admin" element={<PublicOnly><AdminLogin /></PublicOnly>} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLE.USER]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor"
          element={
            <ProtectedRoute allowedRoles={[ROLE.MENTOR]}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={[ROLE.ADMIN]}>
              <AdminRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/requests/:requestId"
          element={
            <ProtectedRoute allowedRoles={[ROLE.ADMIN]}>
              <AdminRequestDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/mentors"
          element={
            <ProtectedRoute allowedRoles={[ROLE.ADMIN]}>
              <AdminMentors />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/mentees"
          element={
            <ProtectedRoute allowedRoles={[ROLE.ADMIN]}>
              <AdminPeople />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/meetings"
          element={
            <ProtectedRoute allowedRoles={[ROLE.ADMIN]}>
              <AdminMeetings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
