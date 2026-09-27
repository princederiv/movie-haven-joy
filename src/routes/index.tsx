import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Play, Plus, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PosterRail } from "@/components/PosterRail";
import { MoviePoster } from "@/components/MoviePoster";
import { ShortsRail } from "@/components/Shorts";
import { FEATURED, ROWS, GENRES, byGenre, formatRuntime } from "@/lib/movies";
import { getContinueWatching } from "@/lib/library.functions";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
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
    ],
  }),
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

function Home() {
  return (
    <AppShell>
      <header className="relative">
        <img
          src={FEATURED.poster}
          alt={FEATURED.title}
          width={768}
          height={1152}
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
            <span>{FEATURED.year}</span>
            <span>{formatRuntime(FEATURED.runtime)}</span>
            <span>{FEATURED.genres.join(" · ")}</span>
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

      <ShortsRail />

      <ContinueWatchingRail />

      {ROWS.map((row) => (
        <PosterRail key={row.title} title={row.title} movies={row.movies} />
      ))}

      <section className="mt-9 px-4">
        <h2 className="font-display text-xl tracking-wide">Browse by genre</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {GENRES.map((genre) => (
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

      {GENRES.slice(0, 3).map((genre) => (
        <PosterRail key={genre} title={genre} movies={byGenre(genre)} />
      ))}

      <section className="mt-10 px-4">
        <h2 className="font-display text-lg tracking-wide">New releases</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {ROWS[0]!.movies.slice(0, 6).map((m) => (
            <MoviePoster
              key={m.id}
              id={m.id}
              title={m.title}
              poster={m.poster}
              year={m.year}
              rating={m.rating}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
