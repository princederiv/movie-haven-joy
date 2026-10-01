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
  .inputValidator((input: unknown) => z.object({ id: z.string().regex(/^(tv-)?\d+$/) }).parse(input))
  .handler(async ({ data }): Promise<{ movie: CatalogMovie; similar: CatalogMovie[] } | null> => {
    type Detail = TmdbListItem & {
      runtime?: number;
      genres?: { id: number; name: string }[];
      credits?: { cast: { name: string }[]; crew: { job: string; name: string }[] };
      videos?: { results: { site: string; type: string; key: string; official?: boolean }[] };
    };
    const isTv = data.id.startsWith("tv-");
    const rawId = data.id.replace("tv-", "");
    const base = isTv ? `/tv/${rawId}` : `/movie/${rawId}`;
    let d: Detail;
    try {
      const raw = await tmdb<Detail & { name?: string; first_air_date?: string; episode_run_time?: number[]; created_by?: { name: string }[] }>(base, { append_to_response: "credits,videos" });
      d = isTv
        ? { ...raw, title: raw.name ?? "", runtime: raw.episode_run_time?.[0] ?? 0, ...(raw.first_air_date ? { release_date: raw.first_air_date } : {}), credits: { cast: raw.credits?.cast ?? [], crew: (raw.created_by ?? []).map((c) => ({ job: "Director", name: c.name })) } }
        : raw;
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
      id: data.id,
      trailerKey: trailer?.key ?? null,
    };
    const similar = isTv
      ? await tvList(`${base}/recommendations`).then((r) => r.items).catch(() => [])
      : await list(`${base}/recommendations`).catch(() => []);
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

type TmdbTvItem = {
  id: number;
  name: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
};

let tvGenreCache: Map<number, string> | null = null;
async function tvGenreMap() {
  if (tvGenreCache) return tvGenreCache;
  const data = await tmdb<{ genres: { id: number; name: string }[] }>("/genre/tv/list");
  tvGenreCache = new Map(data.genres.map((g) => [g.id, g.name]));
  return tvGenreCache;
}

async function tvList(path: string, params: Record<string, string> = {}) {
  const [genres, data] = await Promise.all([
    tvGenreMap(),
    tmdb<{ results: TmdbTvItem[]; total_pages: number }>(path, params),
  ]);
  return {
    totalPages: data.total_pages,
    items: data.results
      .filter((m) => m.poster_path)
      .map((m) => ({
        ...mapItem(
          { ...m, title: m.name, ...(m.first_air_date ? { release_date: m.first_air_date } : {}) },
          genres,
        ),
        id: `tv-${m.id}`,
      })),
  };
}

async function movieListPaged(path: string, params: Record<string, string> = {}) {
  const [genres, data] = await Promise.all([
    genreMap(),
    tmdb<{ results: TmdbListItem[]; total_pages: number }>(path, params),
  ]);
  return {
    totalPages: data.total_pages,
    items: data.results.filter((m) => m.poster_path).map((m) => mapItem(m, genres)),
  };
}

export const CATEGORY_TYPES = ["all", "movies", "tv", "animation", "anime"] as const;

export const getDiscoverPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ type: z.enum(CATEGORY_TYPES), page: z.number().int().min(1).max(500) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const page = String(data.page);
    const sort = { sort_by: "popularity.desc", page };
    switch (data.type) {
      case "tv":
        return tvList("/discover/tv", { ...sort, without_genres: "16" });
      case "anime":
        return tvList("/discover/tv", { ...sort, with_genres: "16", with_original_language: "ja" });
      case "animation":
        return movieListPaged("/discover/movie", { ...sort, with_genres: "16" });
      case "movies":
        return movieListPaged("/discover/movie", sort);
      default:
        return movieListPaged("/trending/movie/day", { page });
    }
  });

export type TrailerShort = {
  movie: CatalogMovie;
  youtubeKey: string;
};

export const getTrailerShorts = createServerFn({ method: "GET" }).handler(
  async (): Promise<TrailerShort[]> => {
    const movies = (await list("/trending/movie/week")).slice(0, 16);
    const withKeys = await Promise.all(
      movies.map(async (movie) => {
        try {
          const v = await tmdb<{ results: { site: string; type: string; key: string }[] }>(
            `/movie/${movie.id}/videos`,
          );
          const yt = v.results.filter((r) => r.site === "YouTube");
          const pick = yt.find((r) => r.type === "Trailer") ?? yt.find((r) => r.type === "Teaser") ?? yt[0];
          return pick ? { movie, youtubeKey: pick.key } : null;
        } catch {
          return null;
        }
      }),
    );
    return withKeys.filter((x): x is TrailerShort => !!x);
  },
);
