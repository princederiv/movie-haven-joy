import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Movie } from "@/lib/movies";

const IMG = "https://image.tmdb.org/t/p";

type TmdbListItem = {
  id: number;
  title: string;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
};

export type CatalogMovie = Movie & { backdrop: string | null; trailerKey?: string | null };

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env["TMDB_API_KEY"];
  if (!key) throw new Error("Movie catalogue key is missing");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  const headers: Record<string, string> = { accept: "application/json" };
  if (key.length > 40) headers["Authorization"] = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    console.error(`TMDB ${path} failed [${res.status}]: ${body}`);
    throw new Error(`Movie catalogue request failed [${res.status}]`);
  }
  return (await res.json()) as T;
}

let genreCache: Map<number, string> | null = null;
async function genreMap() {
  if (genreCache) return genreCache;
  const data = await tmdb<{ genres: { id: number; name: string }[] }>("/genre/movie/list");
  genreCache = new Map(data.genres.map((g) => [g.id, g.name]));
  return genreCache;
}

function mapItem(m: TmdbListItem, genres: Map<number, string>): CatalogMovie {
  return {
    id: String(m.id),
    title: m.title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : 0,
    runtime: 0,
    rating: Math.round((m.vote_average ?? 0) * 10) / 10,
    genres: (m.genre_ids ?? []).map((g) => genres.get(g)).filter((g): g is string => !!g),
    overview: m.overview ?? "",
    poster: m.poster_path ? `${IMG}/w500${m.poster_path}` : "",
    backdrop: m.backdrop_path ? `${IMG}/w1280${m.backdrop_path}` : null,
    cast: [],
    director: "",
  };
}

async function list(path: string, params: Record<string, string> = {}) {
  const [genres, data] = await Promise.all([
    genreMap(),
    tmdb<{ results: TmdbListItem[] }>(path, params),
  ]);
  return data.results.filter((m) => m.poster_path).map((m) => mapItem(m, genres));
}

export const getGenres = createServerFn({ method: "GET" }).handler(async () => {
  const g = await genreMap();
  return Array.from(g.values()).sort();
});

export const getHomeCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const [trending, popular, topRated, upcoming, action, comedy, drama] = await Promise.all([
    list("/trending/movie/week"),
    list("/movie/popular"),
    list("/movie/top_rated"),
    list("/movie/upcoming"),
    list("/discover/movie", { with_genres: "28", sort_by: "popularity.desc" }),
    list("/discover/movie", { with_genres: "35", sort_by: "popularity.desc" }),
    list("/discover/movie", { with_genres: "18", sort_by: "popularity.desc" }),
  ]);
  return {
    featured: trending.find((m) => m.backdrop) ?? trending[0] ?? null,
    rows: [
      { title: "Trending now", movies: trending },
      { title: "Popular", movies: popular },
      { title: "Top rated", movies: topRated },
      { title: "Coming up", movies: upcoming },
      { title: "Action", movies: action },
      { title: "Comedy", movies: comedy },
      { title: "Drama", movies: drama },
    ],
  };
});

export const getMovieDetail = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().regex(/^\d+$/) }).parse(input))
  .handler(async ({ data }): Promise<{ movie: CatalogMovie; similar: CatalogMovie[] } | null> => {
    type Detail = TmdbListItem & {
      runtime?: number;
      genres?: { id: number; name: string }[];
      credits?: { cast: { name: string }[]; crew: { job: string; name: string }[] };
      videos?: { results: { site: string; type: string; key: string; official?: boolean }[] };
    };
    let d: Detail;
    try {
      d = await tmdb<Detail>(`/movie/${data.id}`, { append_to_response: "credits,videos" });
    } catch {
      return null;
    }
    const vids = (d.videos?.results ?? []).filter((v) => v.site === "YouTube");
    const trailer =
      vids.find((v) => v.type === "Trailer" && v.official) ??
      vids.find((v) => v.type === "Trailer") ??
      vids[0];
    const genres = await genreMap();
    const movie: CatalogMovie = {
      ...mapItem({ ...d, genre_ids: d.genres?.map((g) => g.id) ?? [] }, genres),
      runtime: d.runtime ?? 0,
      cast: (d.credits?.cast ?? []).slice(0, 6).map((c) => c.name),
      director: d.credits?.crew.find((c) => c.job === "Director")?.name ?? "",
      trailerKey: trailer?.key ?? null,
    };
    const similar = await list(`/movie/${data.id}/recommendations`).catch(() => []);
    return { movie, similar: similar.slice(0, 9) };
  });

export const searchCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().max(100).optional(),
        genre: z.string().max(50).optional(),
        year: z.number().int().min(1900).max(2100).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const genres = await genreMap();
    const genreId = data.genre
      ? Array.from(genres.entries()).find(([, n]) => n === data.genre)?.[0]
      : undefined;
    const q = data.q?.trim();
    if (q) {
      let results = await list("/search/movie", {
        query: q,
        ...(data.year ? { primary_release_year: String(data.year) } : {}),
      });
      if (data.genre) results = results.filter((m) => m.genres.includes(data.genre!));
      return results;
    }
    return list("/discover/movie", {
      sort_by: "popularity.desc",
      ...(genreId ? { with_genres: String(genreId) } : {}),
      ...(data.year ? { primary_release_year: String(data.year) } : {}),
    });
  });
