import { useEffect, useState } from "react";

type ToastEvent = { msg: string; id: number };
let listeners: ((t: ToastEvent) => void)[] = [];
let counter = 0;

export function showToast(msg: string) {
  const ev = { msg, id: ++counter };
  listeners.forEach((l) => l(ev));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);
  useEffect(() => {
    const l = (t: ToastEvent) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 1800);
    };
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-destructive text-destructive-foreground font-mono text-xs px-4 py-2 rounded border border-destructive shadow-lg"
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}