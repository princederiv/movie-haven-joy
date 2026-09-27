import type { Movie } from "@/lib/movies";
import { MoviePoster } from "./MoviePoster";

export function PosterRail({ title, movies }: { title: string; movies: Movie[] }) {
  if (movies.length === 0) return null;
  return (
    <section className="mt-7">
      <h2 className="px-4 font-display text-xl tracking-wide text-foreground">{title}</h2>
      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {movies.map((m) => (
          <MoviePoster
            key={`${title}-${m.id}`}
            id={m.id}
            title={m.title}
            poster={m.poster}
            year={m.year}
            rating={m.rating}
            className="w-[116px] snap-start"
          />
        ))}
      </div>
    </section>
  );
}
