import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Login, type Role } from "@/components/Login";
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { FacultyDashboard } from "@/components/faculty/FacultyDashboard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ToastHost } from "@/components/Toast";

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
  const [role, setRole] = useState<Role | null>(null);

  return (
    <>
      {role === null && <Login onLogin={setRole} />}
      {role === "Student" && <StudentDashboard onLogout={() => setRole(null)} />}
      {role === "Faculty" && <FacultyDashboard onLogout={() => setRole(null)} />}
      {role === "Admin" && <AdminDashboard onLogout={() => setRole(null)} />}
      <ToastHost />
    </>
  );
}
