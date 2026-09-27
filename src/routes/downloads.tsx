import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useOfflineLibrary } from "@/hooks/useOffline";
import { clearOffline, removeOffline } from "@/lib/offline";
import { formatRuntime } from "@/lib/movies";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Saved offline — StreamBox" },
      {
        name: "description",
        content: "Films saved on this device so you can browse them without a connection.",
      },
      { property: "og:title", content: "Saved offline — StreamBox" },
      {
        property: "og:description",
        content: "Films saved on this device for browsing without a connection.",
      },
    ],
  }),
  component: Downloads,
});

function Downloads() {
  const items = useOfflineLibrary();

  return (
    <AppShell>
      <div className="px-4 pb-2 pt-[calc(env(safe-area-inset-top)+16px)]">
        <h1 className="font-display text-3xl tracking-wide">Saved offline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These films stay on this device and open with no signal.
        </p>
        {items.length > 0 && (
          <button
            onClick={() => {
              clearOffline();
              toast.success("Offline library cleared");
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground active:scale-95"
          >
            <Trash2 className="size-3.5" />
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mx-4 mt-10 rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <WifiOff className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 font-display text-xl tracking-wide">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open any film and tap "Save offline" to keep it here.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
          >
            Browse films
          </Link>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Link to="/movie/$movieId" params={{ movieId: m.id }} className="shrink-0">
                <img
                  src={m.poster}
                  alt={m.title}
                  loading="lazy"
                  className="h-24 w-16 rounded-lg object-cover ring-1 ring-border"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to="/movie/$movieId" params={{ movieId: m.id }}>
                  <p className="line-clamp-1 font-semibold">{m.title}</p>
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.year} · {formatRuntime(m.runtime)} · {m.genres[0]}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-primary">
                  Available offline
                </p>
              </div>
              <button
                onClick={() => {
                  removeOffline(m.id);
                  toast.success(`${m.title} removed`);
                }}
                aria-label={`Remove ${m.title}`}
                className="rounded-full border border-border p-2 text-muted-foreground active:scale-95"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
