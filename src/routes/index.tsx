import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { MoviePoster } from "@/components/MoviePoster";
import { getDiscoverPage } from "@/lib/tmdb.functions";
import { listFreeFilms } from "@/lib/archive.functions";
import { useServerFn } from "@tanstack/react-start";
import { Play, Plus, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PosterRail } from "@/components/PosterRail";
import { getHomeCatalog } from "@/lib/tmdb.functions";
import { getContinueWatching } from "@/lib/library.functions";
import { useSession } from "@/hooks/useSession";

const TYPES = [
  { id: "all", label: "For you" },
  { id: "free", label: "Full films" },
  { id: "movies", label: "Movies" },
  { id: "tv", label: "TV shows" },
  { id: "animation", label: "Animation" },
  { id: "anime", label: "Anime" },
] as const;
type TypeId = (typeof TYPES)[number]["id"];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { type?: TypeId } => {
    const t = search["type"];
    return TYPES.some((x) => x.id === t) && t !== "all" ? { type: t as TypeId } : {};
  },
  loader: () => getHomeCatalog(),
  staleTime: 5 * 60_000,
  head: () => ({
    meta: [
      { title: "StreamBox — tonight's films" },
      {
        name: "description",
        content:
          "A poster-led home for film discovery: trending, popular and top rated titles, plus what you were watching.",
      },
      { property: "og:title", content: "StreamBox — tonight's films" },
      {
        property: "og:description",
        content: "Trending, popular and top rated films, plus what you were watching.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground" role="alert">
      Couldn't load films right now. Please try again.
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center text-sm">Not found.</div>,
  component: Home,
});

function ContinueWatchingRail() {
  const { user } = useSession();
  const fetchContinue = useServerFn(getContinueWatching);
  const { data } = useQuery({
    queryKey: ["continue-watching", user?.id],
    queryFn: () => fetchContinue(),
    enabled: !!user,
  });

  if (!user || !data || data.length === 0) return null;

  return (
    <section className="mt-7">
      <h2 className="px-4 font-display text-xl tracking-wide text-foreground">Continue watching</h2>
      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.map((item) => {
          const pct = item.duration_seconds
            ? Math.min(100, Math.round((item.progress_seconds / item.duration_seconds) * 100))
            : 0;
          return (
            <Link
              key={item.movie_id}
              to="/movie/$movieId"
              params={{ movieId: item.movie_id }}
              className="w-[150px] shrink-0 snap-start active:scale-[0.97]"
            >
              <div className="relative overflow-hidden rounded-xl ring-1 ring-border/60">
                {item.poster_url && (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover"
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-background/30">
                  <Play className="size-8 fill-foreground text-foreground drop-shadow" />
                </span>
                <span className="absolute inset-x-0 bottom-0 h-1 bg-border">
                  <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                </span>
              </div>
              <p className="mt-2 line-clamp-1 text-[13px] font-semibold">{item.title}</p>
              <p className="text-[11px] text-muted-foreground">{pct}% watched</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CategoryBar({ active }: { active: TypeId }) {
  return (
    <nav className="sticky top-0 z-40 flex gap-2 overflow-x-auto bg-background/85 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TYPES.map((t) => (
        <Link
          key={t.id}
          to="/"
          search={t.id === "all" ? {} : { type: t.id }}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
            active === t.id
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

function useEndReached(onEnd: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && onEnd(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [onEnd, enabled]);
  return ref;
}

function InfiniteCatalog({ type, title }: { type: Exclude<TypeId, "free">; title: string }) {
  const fetchPage = useServerFn(getDiscoverPage);
  const q = useInfiniteQuery({
    queryKey: ["discover", type],
    queryFn: ({ pageParam }) => fetchPage({ data: { type, page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (all.length < Math.min(last.totalPages, 500) ? all.length + 1 : undefined),
  });
  const sentinel = useEndReached(() => {
    if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
  }, !!q.hasNextPage);
  const seen = new Set<string>();
  const items = (q.data?.pages ?? []).flatMap((p) => p.items).filter((m) => !seen.has(m.id) && seen.add(m.id));
  return (
    <section className="mt-6 px-4">
      <h2 className="font-display text-xl tracking-wide">{title}</h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {items.map((m) => (
          <MoviePoster key={m.id} id={m.id} title={m.title} poster={m.poster} year={m.year || undefined} rating={m.rating} />
        ))}
      </div>
      <div ref={sentinel} className="py-6 text-center text-xs text-muted-foreground">
        {q.isFetching ? "Loading more…" : q.hasNextPage ? "" : "You've reached the end"}
      </div>
    </section>
  );
}

function FreeFilmsCatalog() {
  const fetchPage = useServerFn(listFreeFilms);
  const q = useInfiniteQuery({
    queryKey: ["free-films"],
    queryFn: ({ pageParam }) => fetchPage({ data: { page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (all.length < Math.min(last.totalPages, 200) ? all.length + 1 : undefined),
  });
  const sentinel = useEndReached(() => {
    if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
  }, !!q.hasNextPage);
  const items = (q.data?.pages ?? []).flatMap((p) => p.items);
  return (
    <section className="mt-4 px-4">
      <h2 className="font-display text-xl tracking-wide">Full films, free to watch</h2>
      <p className="mt-1 text-xs text-muted-foreground">Classic public-domain films you can play from start to finish.</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {items.map((f) => (
          <Link key={f.id} to="/watch/$filmId" params={{ filmId: f.id }} className="block active:scale-[0.96]">
            <img src={f.poster} alt={f.title} loading="lazy" className="aspect-[2/3] w-full rounded-xl bg-card object-cover ring-1 ring-border/60" />
            <p className="mt-2 line-clamp-1 text-[13px] font-semibold">{f.title}</p>
            {f.year && <p className="text-[11px] text-muted-foreground">{f.year}</p>}
          </Link>
        ))}
      </div>
      <div ref={sentinel} className="py-6 text-center text-xs text-muted-foreground">
        {q.isFetching ? "Loading more…" : ""}
      </div>
    </section>
  );
}

function Home() {
  const { type = "all" } = Route.useSearch();
  if (type === "free")
    return (
      <AppShell>
        <CategoryBar active="free" />
        <FreeFilmsCatalog />
      </AppShell>
    );
  if (type !== "all") {
    const label = TYPES.find((t) => t.id === type)!.label;
    return (
      <AppShell>
        <CategoryBar active={type} />
        <InfiniteCatalog key={type} type={type} title={`Popular ${label.toLowerCase()}`} />
      </AppShell>
    );
  }
  return <ForYou />;
}

function ForYou() {
  const { featured: FEATURED, rows } = Route.useLoaderData();
  const genres = Array.from(new Set(rows.flatMap((r) => r.movies.flatMap((m) => m.genres)))).sort();
  if (!FEATURED) return <AppShell><p className="p-8 text-center text-sm">No films available.</p></AppShell>;
  return (
    <AppShell>
      <CategoryBar active="all" />
      <header className="relative -mt-[calc(env(safe-area-inset-top)+50px)]">
        <img
          src={FEATURED.poster}
          alt={FEATURED.title}
          width={500}
          height={750}
          className="h-[78vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
          <span className="font-display text-2xl tracking-[0.18em] text-primary">STREAMBOX</span>
          <Link
            to="/search"
            className="rounded-full bg-background/60 px-3 py-1.5 text-xs font-semibold backdrop-blur"
          >
            Search
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="flex items-center gap-1 text-primary">
              <Star className="size-3 fill-current" />
              {FEATURED.rating.toFixed(1)}
            </span>
            {FEATURED.year > 0 && <span>{FEATURED.year}</span>}
            <span>{FEATURED.genres.slice(0, 3).join(" · ")}</span>
          </div>
          <h1 className="mt-1 font-display text-5xl leading-none text-foreground">
            {FEATURED.title}
          </h1>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{FEATURED.overview}</p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/movie/$movieId"
              params={{ movieId: FEATURED.id }}
              search={{ play: true }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]"
            >
              <Play className="size-4 fill-current" />
              Play
            </Link>
            <Link
              to="/movie/$movieId"
              params={{ movieId: FEATURED.id }}
              className="flex items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-5 py-3 text-sm font-semibold backdrop-blur active:scale-[0.98]"
            >
              <Plus className="size-4" />
              Details
            </Link>
          </div>
        </div>
      </header>

      <ContinueWatchingRail />

      {rows.map((row) => (
        <PosterRail key={row.title} title={row.title} movies={row.movies} />
      ))}

      <section className="mt-9 px-4 pb-4">
        <h2 className="font-display text-xl tracking-wide">Browse by genre</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Link
              key={genre}
              to="/search"
              search={{ q: "", genre }}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground active:scale-95"
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>

      <InfiniteCatalog type="all" title="Keep scrolling" />
    </AppShell>
  );
}
