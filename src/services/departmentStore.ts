import { userStore } from "@/utils/userStore";

export interface CourseAssignment {
  id: string;
  department: string;
  semester: string;
  regulation: string;
  section: string;
  subject: string;
  facultyId: string;
}

const STORAGE_KEY = "dterm_course_assignments";

class DepartmentStore {
  private assignments: CourseAssignment[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.assignments = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load course assignments", e);
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.assignments));
      this.notify();
    } catch (e) {
      console.error("Failed to save course assignments", e);
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getAssignments = (): CourseAssignment[] => {
    return this.assignments;
  };

  addAssignment = (data: Omit<CourseAssignment, "id">): { ok: boolean; error?: string } => {
    // Check if faculty exists
    const faculty = userStore.getUsers().find(u => u.id === data.facultyId && u.role === "Faculty");
    if (!faculty) {
      return { ok: false, error: "Invalid Faculty selected." };
    }

    const newAssignment: CourseAssignment = {
      ...data,
      id: crypto.randomUUID(),
    };
    
    this.assignments = [...this.assignments, newAssignment];
    this.save();
    return { ok: true };
  };

  deleteAssignment = (id: string): { ok: boolean; error?: string } => {
    const prevLen = this.assignments.length;
    this.assignments = this.assignments.filter((a) => a.id !== id);
    if (this.assignments.length === prevLen) {
      return { ok: false, error: "Assignment not found." };
    }
    this.save();
    return { ok: true };
  };

  updateAssignment = (id: string, data: Omit<CourseAssignment, "id">): { ok: boolean; error?: string } => {
    const faculty = userStore.getUsers().find(u => u.id === data.facultyId && u.role === "Faculty");
    if (!faculty) {
      return { ok: false, error: "Invalid Faculty selected." };
    }

    this.assignments = this.assignments.map(a => 
      a.id === id ? { ...a, ...data } : a
    );
    this.save();
    return { ok: true };
  };
}

export const departmentStore = new DepartmentStore();
