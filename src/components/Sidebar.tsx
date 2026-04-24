import { LogOut } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({
  items,
  active,
  onSelect,
  role,
  user,
  onLogout,
}: {
  items: NavItem[];
  active: string;
  onSelect: (k: string) => void;
  role: string;
  user: string;
  onLogout: () => void;
}) {
  return (
    <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-5 border-b border-sidebar-border">
        <div className="font-mono font-bold text-2xl text-sidebar-foreground">
          D-<span className="text-primary">Term</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
          {role} Console
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
              active === key
                ? "bg-primary/15 text-primary border-l-2 border-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs text-muted-foreground">Signed in as</div>
          <div className="text-sm font-mono text-sidebar-foreground truncate">{user}</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
