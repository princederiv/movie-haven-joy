import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MoviePoster } from "@/components/MoviePoster";
import { getGenres, searchCatalog } from "@/lib/tmdb.functions";

type SearchParams = { q?: string | undefined; genre?: string | undefined; year?: number | undefined };

const THIS_YEAR = 2026;
const YEARS = Array.from({ length: 30 }, (_, i) => THIS_YEAR - i);

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
    genre: typeof search["genre"] === "string" && search["genre"] ? (search["genre"] as string) : undefined,
    year: Number(search["year"]) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search films — StreamBox" },
      { name: "description", content: "Search films by title, filter by genre and release year." },
      { property: "og:title", content: "Search films — StreamBox" },
      {
        property: "og:description",
        content: "Search films by title, filter by genre and release year.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, genre, year } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [debounced, setDebounced] = useState(q ?? "");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q ?? ""), 350);
    return () => clearTimeout(t);
  }, [q]);
  const runSearch = useServerFn(searchCatalog);
  const fetchGenres = useServerFn(getGenres);
  const { data: GENRES = [] } = useQuery({ queryKey: ["genres"], queryFn: () => fetchGenres(), staleTime: Infinity });
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["search", debounced, genre, year],
    queryFn: () => runSearch({ data: { q: debounced || undefined, genre, year } }),
    placeholderData: keepPreviousData,
  });

  const update = (patch: Partial<SearchParams>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  return (
    <AppShell>
      <div className="sticky top-0 z-40 bg-background/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+16px)] backdrop-blur-xl">
        <h1 className="font-display text-3xl tracking-wide">Search</h1>
        <div className="relative mt-3">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q ?? ""}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Film title or keyword"
            autoComplete="off"
            className="w-full rounded-full border border-input bg-card py-3 pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          {q && (
            <button
              onClick={() => update({ q: "" })}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => update({ genre: undefined })}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              genre
                ? "border-border bg-card text-muted-foreground"
                : "border-primary bg-primary text-primary-foreground"
            }`}
          >
            All genres
          </button>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => update({ genre: genre === g ? undefined : g })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                genre === g
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => update({ year: undefined })}
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${
              year
                ? "border-border bg-card text-muted-foreground"
                : "border-primary/60 bg-accent text-foreground"
            }`}
          >
            Any year
          </button>
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => update({ year: year === y ? undefined : y })}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                year === y
                  ? "border-primary/60 bg-accent text-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <p className="px-4 pt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {results.length} {results.length === 1 ? "film" : "films"}
      </p>

      {results.length === 0 ? (
        <p className="px-4 pt-10 text-center text-sm text-muted-foreground">
          Nothing matched. Try another title or clear the filters.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 px-4 pt-3">
          {results.map((m) => (
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
      )}
    </AppShell>
  );
}
