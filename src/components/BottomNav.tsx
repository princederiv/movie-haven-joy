import { Link } from "@tanstack/react-router";
import { Download, Home, Search, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/downloads", label: "Saved", icon: Download },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors active:scale-95"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="size-5" strokeWidth={2} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
