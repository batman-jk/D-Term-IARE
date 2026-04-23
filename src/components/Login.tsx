import { useState } from "react";
import { Shield, GraduationCap, BookOpen } from "lucide-react";

export type Role = "Admin" | "Faculty" | "Student";

const ROLES: { key: Role; icon: typeof Shield; desc: string }[] = [
  { key: "Admin", icon: Shield, desc: "Manage exams & users" },
  { key: "Faculty", icon: BookOpen, desc: "Conduct practice tests" },
  { key: "Student", icon: GraduationCap, desc: "Study & take exams" },
];

export function Login({ onLogin }: { onLogin: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("Student");
  const [email, setEmail] = useState("arjun@college.edu");
  const [password, setPassword] = useState("demo");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) onLogin(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="font-mono font-bold text-6xl tracking-tight text-foreground">
            D-<span className="text-primary">Term</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground tracking-wide">
            Definition &amp; Terminology Assessment Platform
          </p>
        </div>

        <div className="border border-border bg-card p-6 rounded">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Select Role
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(({ key, icon: Icon, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  className={`p-4 rounded border text-left transition-colors ${
                    role === key
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${role === key ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="font-mono text-sm font-semibold text-foreground">{key}</div>
                  <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded hover:bg-primary/90 transition-colors"
            >
              Sign in as {role}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
          prototype build · no real authentication
        </p>
      </div>
    </div>
  );
}