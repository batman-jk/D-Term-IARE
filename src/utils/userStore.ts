import { supabase } from "../lib/supabase";

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
  firstLogin?: boolean;
}

// Map from Supabase row to AppUser
const mapUser = (row: any): AppUser => ({
  id: row.id,
  username: row.username,
  password: row.password,
  role: row.role as UserRole,
  displayName: row.display_name,
  department: row.department || undefined,
  sem: row.sem || undefined,
  section: row.section || undefined,
  subject: row.subject || undefined,
  firstLogin: row.first_login,
});

let listeners: Array<() => void> = [];

function emit() {
  listeners.forEach((l) => l());
}

export const userStore = {
  async authenticate(username: string, password: string): Promise<AppUser | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("username", username)
      .eq("password", password)
      .maybeSingle();

    if (error || !data) return null;
    return mapUser(data);
  },

  async getUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase.from("users").select("*");
    if (error || !data) return [];
    return data.map(mapUser);
  },

  async addUser(user: Omit<AppUser, "id">): Promise<{ ok: boolean; error?: string }> {
    const newUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: user.username,
      password: user.password,
      role: user.role,
      display_name: user.displayName,
      department: user.department || null,
      sem: user.sem || null,
      section: user.section || null,
      subject: user.subject || null,
      first_login: user.firstLogin !== undefined ? user.firstLogin : true,
    };

    const { error } = await supabase.from("users").insert([newUser]);
    if (error) {
      if (error.code === '23505') {
         return { ok: false, error: "Username already exists." };
      }
      return { ok: false, error: error.message };
    }
    emit();
    return { ok: true };
  },

  async updateUser(
    id: string,
    patch: Partial<Pick<AppUser, "password" | "displayName" | "role" | "firstLogin">>,
  ): Promise<{ ok: boolean; error?: string }> {
    const updateData: any = {};
    if (patch.password !== undefined) updateData.password = patch.password;
    if (patch.displayName !== undefined) updateData.display_name = patch.displayName;
    if (patch.role !== undefined) updateData.role = patch.role;
    if (patch.firstLogin !== undefined) updateData.first_login = patch.firstLogin;

    const { error } = await supabase.from("users").update(updateData).eq("id", id);
    if (error) return { ok: false, error: error.message };
    emit();
    return { ok: true };
  },

  async deleteUser(id: string): Promise<{ ok: boolean; error?: string }> {
    if (id === "admin-root") return { ok: false, error: "Cannot delete the root admin." };
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
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
