export interface UploadedFile {
  id: string;
  filename: string;
  course: string;
  module: string | number;
  date: string;
}

let files: UploadedFile[] = [];
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

try {
  const stored = localStorage.getItem("dterm_uploaded_files");
  if (stored) {
    files = JSON.parse(stored);
  } else {
    // initialize with mock data structure if needed, or leave empty
  }
} catch (e) {
  console.error("Failed to load files from local storage", e);
}

export const fileStore = {
  addFile(file: UploadedFile) {
    files = [file, ...files];
    try {
      localStorage.setItem("dterm_uploaded_files", JSON.stringify(files));
    } catch (e) {}
    emitChange();
  },
  removeFile(id: string) {
    files = files.filter((f) => f.id !== id);
    try {
      localStorage.setItem("dterm_uploaded_files", JSON.stringify(files));
    } catch (e) {}
    emitChange();
  },
  getFiles() {
    return files;
  },
  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
