import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, Check, Download, Play, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MoviePoster } from "@/components/MoviePoster";
import { TrailerPlayer } from "@/components/TrailerPlayer";
import { formatRuntime, getMovie, similarTo } from "@/lib/movies";
import { isSavedOffline, removeOffline, saveOffline, subscribeOffline } from "@/lib/offline";
import { useSession } from "@/hooks/useSession";
import {
  addToWatchlist,
  getContinueWatching,
  getWatchlist,
  removeFromWatchlist,
  saveProgress,
} from "@/lib/library.functions";

export const Route = createFileRoute("/movie/$movieId")({
  validateSearch: (search: Record<string, unknown>) => ({ play: search.play === true || search.play === "true" }),
  loader: ({ params }) => {
    const movie = getMovie(params.movieId);
    if (!movie) throw notFound();
    return { movieId: movie.id };
  },
  head: ({ params }) => {
    const movie = getMovie(params.movieId);
    const title = movie ? `${movie.title} (${movie.year}) — StreamBox` : "Film — StreamBox";
    const description = movie?.overview ?? "Film details on StreamBox.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: MovieDetail,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-muted-foreground" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">We couldn't find that film.</div>
  ),
});

function MovieDetail() {
  const { movieId } = Route.useLoaderData();
  const { play } = Route.useSearch();
  const navigate = useNavigate({ from: "/movie/$movieId" });
  const movie = getMovie(movieId)!;
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [offline, setOffline] = useState(false);
  const [showPlayer, setShowPlayer] = useState(play);

  useEffect(() => {
    const sync = () => setOffline(isSavedOffline(movie.id));
    sync();
    return subscribeOffline(sync);
  }, [movie.id]);

  const fetchWatchlist = useServerFn(getWatchlist);
  const fetchContinue = useServerFn(getContinueWatching);
  const add = useServerFn(addToWatchlist);
  const remove = useServerFn(removeFromWatchlist);
  const persistProgress = useServerFn(saveProgress);

  const { data: watchlist } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: () => fetchWatchlist(),
    enabled: !!user,
  });
  const { data: continueRows } = useQuery({
    queryKey: ["continue-watching", user?.id],
    queryFn: () => fetchContinue(),
    enabled: !!user,
  });

  const inWatchlist = !!watchlist?.some((w) => w.movie_id === movie.id);
  const resumeAt =
    continueRows?.find((r) => r.movie_id === movie.id)?.progress_seconds ?? 0;

  const toggleWatchlist = useMutation({
    mutationFn: async () => {
      if (inWatchlist) {
        await remove({ data: { movie_id: movie.id } });
        return "removed" as const;
      }
      await add({
        data: {
          movie_id: movie.id,
          title: movie.title,
          poster_url: movie.poster,
          rating: movie.rating,
          release_year: movie.year,
        },
      });
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(result === "added" ? "Added to your watchlist" : "Removed from your watchlist");
    },
    onError: () => toast.error("Couldn't update your watchlist. Please try again."),
  });

  const handleProgress = useCallback(
    (seconds: number, duration: number) => {
      if (!user) return;
      persistProgress({
        data: {
          movie_id: movie.id,
          title: movie.title,
          poster_url: movie.poster,
          progress_seconds: Math.floor(seconds),
          duration_seconds: Math.floor(duration),
        },
      })
        .then(() => queryClient.invalidateQueries({ queryKey: ["continue-watching"] }))
        .catch(() => undefined);
    },
    [user, persistProgress, movie, queryClient],
  );

  const toggleOffline = () => {
    if (offline) {
      removeOffline(movie.id);
      toast.success("Removed from your offline library");
      return;
    }
    saveOffline({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      rating: movie.rating,
      runtime: movie.runtime,
      poster: movie.poster,
      genres: movie.genres,
      overview: movie.overview,
    });
    toast.success("Saved for offline browsing");
  };

  return (
    <AppShell>
      <header className="relative">
        <img
          src={movie.poster}
          alt={movie.title}
          width={768}
          height={1152}
          className="h-[62vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60" />
        <Link
          to="/"
          aria-label="Back"
          className="absolute left-3 top-[calc(env(safe-area-inset-top)+14px)] rounded-full bg-background/70 p-2 backdrop-blur active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
          <h1 className="font-display text-4xl leading-none">{movie.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="flex items-center gap-1 text-primary">
              <Star className="size-3 fill-current" />
              {movie.rating.toFixed(1)}
            </span>
            <span>{movie.year}</span>
            <span>{formatRuntime(movie.runtime)}</span>
          </div>
        </div>
      </header>

      <div className="px-4">
        <div className="mt-3 flex flex-wrap gap-2">
          {movie.genres.map((g) => (
            <span
              key={g}
              className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold"
            >
              {g}
            </span>
          ))}
        </div>

        <button
          onClick={() => setShowPlayer(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground active:scale-[0.98]"
        >
          <Play className="size-4 fill-current" />
          {resumeAt > 30 ? "Resume preview" : "Play preview"}
        </button>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (!user) {
                toast.info("Sign in to keep a watchlist");
                navigate({ to: "/auth" });
                return;
              }
              toggleWatchlist.mutate();
            }}
            disabled={toggleWatchlist.isPending}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-semibold active:scale-[0.98] disabled:opacity-60"
          >
            {inWatchlist ? (
              <BookmarkCheck className="size-4 text-primary" />
            ) : (
              <Bookmark className="size-4" />
            )}
            {inWatchlist ? "In watchlist" : "Watchlist"}
          </button>
          <button
            onClick={toggleOffline}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-semibold active:scale-[0.98]"
          >
            {offline ? <Check className="size-4 text-primary" /> : <Download className="size-4" />}
            {offline ? "Saved offline" : "Save offline"}
          </button>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-foreground/90">{movie.overview}</p>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-muted-foreground">Director</dt>
            <dd className="font-medium">{movie.director}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-muted-foreground">Cast</dt>
            <dd className="font-medium">{movie.cast.join(", ")}</dd>
          </div>
        </dl>
      </div>

      <section className="mt-8">
        <h2 className="px-4 font-display text-xl tracking-wide">More like this</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 px-4">
          {similarTo(movie).map((m) => (
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

      {showPlayer && (
        <TrailerPlayer
          movie={movie}
          startAt={resumeAt}
          onProgress={handleProgress}
          onClose={() => {
            setShowPlayer(false);
            navigate({ search: { play: false }, replace: true });
          }}
        />
      )}
    </AppShell>
  );
}
