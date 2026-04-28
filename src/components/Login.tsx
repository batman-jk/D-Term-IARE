import { useState } from "react";
import { Eye, EyeOff, LogIn, Lock } from "lucide-react";
import { userStore, type AppUser } from "@/utils/userStore";

export type Role = "Admin" | "Faculty" | "Student";

export function Login({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // New states for first-time login
  const [requirePasswordChange, setRequirePasswordChange] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    // Brief artificial delay for UX
    setTimeout(() => {
      const user = userStore.authenticate(username.trim(), password);
      setLoading(false);
      if (user) {
        if (user.firstLogin) {
          setRequirePasswordChange(user);
        } else {
          onLogin(user);
        }
      } else {
        setError("Invalid username or password.");
      }
    }, 400);
  };

  const submitPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newPassword || !confirmPassword) {
      setError("Please fill out both fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    if (requirePasswordChange) {
      setLoading(true);
      setTimeout(() => {
        userStore.updateUser(requirePasswordChange.id, { 
          password: newPassword,
          firstLogin: false 
        });
        
        // Retrieve updated user to pass to onLogin
        const updatedUser = userStore.getUsers().find(u => u.id === requirePasswordChange.id);
        setLoading(false);
        if (updatedUser) {
          onLogin(updatedUser);
        } else {
          setError("Failed to update password.");
        }
      }, 400);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-mono font-bold text-6xl tracking-tight text-foreground">
            D-<span className="text-primary">Term</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground tracking-wide">
            Definition &amp; Terminology Assessment Platform
          </p>
        </div>

        {/* Card */}
        <div className="border border-border bg-card p-6 rounded-lg shadow-sm">
          {!requirePasswordChange ? (
            <>
              <h2 className="font-mono text-lg font-semibold text-foreground mb-5">
                Sign in
              </h2>

              <form onSubmit={submit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    Username
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-input border border-border rounded px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-xs text-destructive font-mono">{error}</p>
                )}

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="font-mono text-sm">Signing in…</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign in
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-mono text-lg font-semibold text-foreground mb-5">
                Change Password
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Welcome {requirePasswordChange.displayName}! This is your first time logging in. Please set a new password.
              </p>

              <form onSubmit={submitPasswordChange} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-input border border-border rounded px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-xs text-destructive font-mono">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="font-mono text-sm">Saving…</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Set Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
          Credentials managed by your institution admin
        </p>
      </div>
    </div>
  );
}
