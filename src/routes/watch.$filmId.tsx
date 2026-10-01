import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FilmPlayer } from "@/components/FilmPlayer";
import { getFreeFilm } from "@/lib/archive.functions";

export const Route = createFileRoute("/watch/$filmId")({
  loader: async ({ params }) => {
    const film = await getFreeFilm({ data: { id: params.filmId } });
    if (!film) throw notFound();
    return film;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Watch ${loaderData.title} free — StreamBox` : "Watch free film — StreamBox";
    const description =
      loaderData?.description.slice(0, 160) || "Watch a full-length public-domain film free on StreamBox.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "video.movie" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData
          ? [
              { property: "og:image", content: loaderData.poster },
              { name: "twitter:image", content: loaderData.poster },
            ]
          : []),
      ],
    };
  },
  component: WatchPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-muted-foreground" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">This film can't be played.</div>
  ),
});

function WatchPage() {
  const film = Route.useLoaderData();
  const router = useRouter();
  const [playing, setPlaying] = useState(false);

  return (
    <AppShell>
      <header className="relative">
        <img src={film.poster} alt={film.title} className="h-[52vh] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/60" />
        <button
          onClick={() => router.history.back()}
          aria-label="Back"
          className="absolute left-3 top-[calc(env(safe-area-inset-top)+14px)] rounded-full bg-background/70 p-2 backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
            Full film · Free
          </span>
          <h1 className="mt-2 font-display text-4xl leading-none">{film.title}</h1>
          {film.year && <p className="mt-1 text-xs font-semibold text-muted-foreground">{film.year}</p>}
        </div>
      </header>
      <div className="px-4">
        <button
          onClick={() => setPlaying(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground active:scale-[0.98]"
        >
          <Play className="size-4 fill-current" /> Play full film
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {film.sources.map((s) => s.label).join(" · ")}
          {film.subtitles.length > 0 ? " · Subtitles available" : ""}
        </p>
        {film.description && (
          <p className="mt-5 line-clamp-[12] text-sm leading-relaxed text-foreground/90">{film.description}</p>
        )}
        <Link to="/" search={{ type: "free" }} className="mt-6 block text-sm font-semibold text-primary">
          More free films
        </Link>
      </div>
      {playing && <FilmPlayer film={film} onClose={() => setPlaying(false)} />}
    </AppShell>
  );
}
