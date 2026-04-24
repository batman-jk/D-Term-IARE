import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Login } from "@/components/Login";
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { FacultyDashboard } from "@/components/faculty/FacultyDashboard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ToastHost } from "@/components/Toast";
import type { AppUser } from "@/utils/userStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "D-Term — Definition & Terminology Assessment Platform" },
      {
        name: "description",
        content:
          "D-Term is a serious dark-academic exam platform for Definition & Terminology tests in college courses.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [user, setUser] = useState<AppUser | null>(null);

  const logout = () => setUser(null);

  return (
    <>
      {user === null && <Login onLogin={setUser} />}
      {user?.role === "Student" && (
        <StudentDashboard user={user} onLogout={logout} />
      )}
      {user?.role === "Faculty" && (
        <FacultyDashboard user={user} onLogout={logout} />
      )}
      {user?.role === "Admin" && (
        <AdminDashboard user={user} onLogout={logout} />
      )}
      <ToastHost />
    </>
  );
}
