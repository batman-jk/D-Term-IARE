export type UserRole = "Admin" | "Faculty" | "Student";

export interface AppUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  department?: string;
  sem?: string;
  section?: string;
  subject?: string;
}

const STORAGE_KEY = "dterm_users";

// ── Predefined seed users ─────────────────────────────────────────────────────
const SEED_USERS: AppUser[] = [
  {
    id: "admin-root",
    username: "D-TERM-IARE",
    password: "defter",
    role: "Admin",
    displayName: "D-Term Admin",
  },
];

// ── In-memory state ───────────────────────────────────────────────────────────
let users: AppUser[] = (() => {
  if (typeof window === "undefined") return [...SEED_USERS];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: AppUser[] = JSON.parse(stored);
      // Always ensure the root admin exists and can't be removed from storage
      const hasRoot = parsed.some((u) => u.id === "admin-root");
      return hasRoot ? parsed : [SEED_USERS[0], ...parsed];
    }
  } catch {
    /* ignore */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
  return [...SEED_USERS];
})();

let listeners: Array<() => void> = [];

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

// ── Public API ────────────────────────────────────────────────────────────────
export const userStore = {
  /** Authenticate — returns the user if credentials match, null otherwise. */
  authenticate(username: string, password: string): AppUser | null {
    return (
      users.find(
        (u) =>
          u.username.toLowerCase() === username.toLowerCase() &&
          u.password === password,
      ) ?? null
    );
  },

  getUsers(): AppUser[] {
    return users;
  },

  addUser(user: Omit<AppUser, "id">): { ok: boolean; error?: string } {
    const exists = users.some(
      (u) => u.username.toLowerCase() === user.username.toLowerCase(),
    );
    if (exists) return { ok: false, error: "Username already exists." };
    const newUser: AppUser = {
      ...user,
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    users = [...users, newUser];
    persist();
    emit();
    return { ok: true };
  },

  updateUser(
    id: string,
    patch: Partial<Pick<AppUser, "password" | "displayName" | "role">>,
  ): { ok: boolean; error?: string } {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return { ok: false, error: "User not found." };
    users = users.map((u) => (u.id === id ? { ...u, ...patch } : u));
    persist();
    emit();
    return { ok: true };
  },

  deleteUser(id: string): { ok: boolean; error?: string } {
    if (id === "admin-root")
      return { ok: false, error: "Cannot delete the root admin." };
    users = users.filter((u) => u.id !== id);
    persist();
    emit();
    return { ok: true };
  },

  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
