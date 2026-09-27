import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Star, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/hooks/useSession";
import { useOfflineLibrary } from "@/hooks/useOffline";
import { getWatchlist } from "@/lib/library.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — StreamBox" },
      {
        name: "description",
        content: "Your StreamBox account, watchlist and films saved on this device.",
      },
      { property: "og:title", content: "Your profile — StreamBox" },
      {
        property: "og:description",
        content: "Your account, watchlist and offline films.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, loading } = useSession();
  const offline = useOfflineLibrary();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchWatchlist = useServerFn(getWatchlist);

  const { data: watchlist } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: () => fetchWatchlist(),
    enabled: !!user,
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell>
      <div className="px-4 pb-2 pt-[calc(env(safe-area-inset-top)+16px)]">
        <h1 className="font-display text-3xl tracking-wide">Profile</h1>
      </div>

      {loading ? (
        <p className="px-4 text-sm text-muted-foreground">Loading…</p>
      ) : !user ? (
        <div className="mx-4 mt-6 rounded-2xl border border-border bg-card p-6 text-center">
          <UserRound className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 font-display text-xl tracking-wide">Sign in to save films</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep a watchlist and pick up where you left off on any device. Browsing and search work
            without an account.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mx-4 mt-2 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 font-display text-xl text-primary">
              {(user.email ?? "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {watchlist?.length ?? 0} in watchlist · {offline.length} saved offline
              </p>
            </div>
          </div>

          <section className="mt-7">
            <h2 className="px-4 font-display text-xl tracking-wide">Your watchlist</h2>
            {!watchlist || watchlist.length === 0 ? (
              <p className="px-4 pt-2 text-sm text-muted-foreground">
                Nothing saved yet. Tap "Watchlist" on any film.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {watchlist.map((item) => (
                  <li key={item.movie_id}>
                    <Link
                      to="/movie/$movieId"
                      params={{ movieId: item.movie_id }}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      {item.poster_url && (
                        <img
                          src={item.poster_url}
                          alt={item.title}
                          loading="lazy"
                          className="h-20 w-14 rounded-lg object-cover ring-1 ring-border"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-1 font-semibold">{item.title}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {item.release_year}
                          {item.rating != null && (
                            <span className="flex items-center gap-0.5 text-primary">
                              <Star className="size-3 fill-current" />
                              {Number(item.rating).toFixed(1)}
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            onClick={signOut}
            className="mx-4 mt-8 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-semibold text-muted-foreground active:scale-[0.98]"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </>
      )}
    </AppShell>
  );
}
