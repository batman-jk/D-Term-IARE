// Tiny global store for the DT exam launch toggle (admin → student)
type Listener = () => void;
let dtLaunched = false;
const listeners = new Set<Listener>();

export function getDtLaunched() {
  return dtLaunched;
}
export function setDtLaunched(v: boolean) {
  dtLaunched = v;
  listeners.forEach((l) => l());
}
export function subscribeDt(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}