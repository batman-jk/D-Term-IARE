import { supabase } from "@/lib/supabase";

export interface CourseAssignment {
  id: string;
  department: string;
  semester: string;
  regulation: string;
  section: string;
  subject: string;
  facultyId: string;
}

const mapAssignment = (row: any): CourseAssignment => ({
  id: row.id,
  department: row.department,
  semester: row.semester,
  regulation: row.regulation,
  section: row.section,
  subject: row.subject,
  facultyId: row.faculty_id,
});

class DepartmentStore {
  private listeners: Set<() => void> = new Set();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getAssignments = async (): Promise<CourseAssignment[]> => {
    const { data, error } = await supabase.from("course_assignments").select("*");
    if (error || !data) return [];
    return data.map(mapAssignment);
  };

  addAssignment = async (data: Omit<CourseAssignment, "id">): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await supabase.from("course_assignments").insert([{
      department: data.department,
      semester: data.semester,
      regulation: data.regulation,
      section: data.section,
      subject: data.subject,
      faculty_id: data.facultyId,
    }]);
    
    if (error) {
      if (error.code === '23503') return { ok: false, error: "Invalid Faculty selected." };
      return { ok: false, error: error.message };
    }
    
    this.notify();
    return { ok: true };
  };

  deleteAssignment = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await supabase.from("course_assignments").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    
    this.notify();
    return { ok: true };
  };

  updateAssignment = async (id: string, data: Omit<CourseAssignment, "id">): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await supabase.from("course_assignments").update({
      department: data.department,
      semester: data.semester,
      regulation: data.regulation,
      section: data.section,
      subject: data.subject,
      faculty_id: data.facultyId,
    }).eq("id", id);
    
    if (error) {
      if (error.code === '23503') return { ok: false, error: "Invalid Faculty selected." };
      return { ok: false, error: error.message };
    }
    
    this.notify();
    return { ok: true };
  };
}

export const departmentStore = new DepartmentStore();
