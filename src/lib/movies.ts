import posterA from "@/assets/poster-a.jpg";
import posterB from "@/assets/poster-b.jpg";
import posterC from "@/assets/poster-c.jpg";
import posterD from "@/assets/poster-d.jpg";
import posterE from "@/assets/poster-e.jpg";
import posterF from "@/assets/poster-f.jpg";

export type Movie = {
  id: string;
  title: string;
  year: number;
  runtime: number;
  rating: number;
  genres: string[];
  overview: string;
  poster: string;
  cast: string[];
  director: string;
};

/**
 * Sample catalogue. Swap for the live movie database once an API key is added.
 */
export const MOVIES: Movie[] = [
  {
    id: "nightfall-harbour",
    title: "Nightfall Harbour",
    year: 2025,
    runtime: 128,
    rating: 8.4,
    genres: ["Thriller", "Drama"],
    overview:
      "A dock inspector discovers a shipping manifest that should not exist, and spends one long night deciding who to hand it to.",
    poster: posterA,
    cast: ["Mara Kessler", "Tobias Lind", "Ayo Ferran", "Nell Okonjo"],
    director: "Ines Vardhan",
  },
  {
    id: "the-long-static",
    title: "The Long Static",
    year: 2024,
    runtime: 141,
    rating: 7.9,
    genres: ["Science Fiction", "Mystery"],
    overview:
      "Three technicians man a listening station at the edge of the map. On day two hundred, the noise answers back.",
    poster: posterB,
    cast: ["Dev Aranha", "Kit Salcedo", "Marguerite Roe"],
    director: "Owen Brathwaite",
  },
  {
    id: "salt-and-neon",
    title: "Salt and Neon",
    year: 2026,
    runtime: 106,
    rating: 8.1,
    genres: ["Crime", "Thriller"],
    overview:
      "A former getaway driver takes one last job through a coastal city that has already forgotten her name.",
    poster: posterC,
    cast: ["Rhea Castellan", "Jonas Petrov", "Sim Adeyemi"],
    director: "Clara Nwankwo",
  },
  {
    id: "paper-orchards",
    title: "Paper Orchards",
    year: 2023,
    runtime: 117,
    rating: 7.6,
    genres: ["Drama", "Romance"],
    overview:
      "Two estranged siblings return to a failing fruit farm and find their mother left instructions for everything except forgiveness.",
    poster: posterD,
    cast: ["Lena Marchetti", "Rafi Bekele", "Hana Yusuf"],
    director: "Pascal Duong",
  },
  {
    id: "the-quiet-rally",
    title: "The Quiet Rally",
    year: 2025,
    runtime: 94,
    rating: 7.2,
    genres: ["Documentary"],
    overview:
      "Over one season, a small-town racing crew rebuilds a car, a business, and a friendship that broke in the same year.",
    poster: posterE,
    cast: ["Featuring the Halberd Motors crew"],
    director: "Sofia Ekwueme",
  },
  {
    id: "cold-open",
    title: "Cold Open",
    year: 2024,
    runtime: 99,
    rating: 7.8,
    genres: ["Comedy", "Drama"],
    overview:
      "A failing late-night host loses his writers, his slot, and his composure — live, over four unforgettable broadcasts.",
    poster: posterF,
    cast: ["Gus Trevino", "Amara Bell", "Wes Okafor"],
    director: "Tilda Ruskin",
  },
  {
    id: "seventeen-winters",
    title: "Seventeen Winters",
    year: 2022,
    runtime: 133,
    rating: 8.6,
    genres: ["Drama", "History"],
    overview:
      "A mountain village keeps a single ledger of everyone it has lost. In 1954, a teacher decides to read it aloud.",
    poster: posterB,
    cast: ["Ilse Brandt", "Noor Hadid", "Emeka Danladi"],
    director: "Ines Vardhan",
  },
  {
    id: "glass-monsoon",
    title: "Glass Monsoon",
    year: 2026,
    runtime: 112,
    rating: 7.4,
    genres: ["Action", "Thriller"],
    overview:
      "A storm-chasing pilot is hired to fly into a weather system that only appears on one company's maps.",
    poster: posterC,
    cast: ["Nadia Serrano", "Kofi Mensah", "Bea Lindqvist"],
    director: "Owen Brathwaite",
  },
  {
    id: "the-understudy",
    title: "The Understudy",
    year: 2025,
    runtime: 121,
    rating: 8.0,
    genres: ["Mystery", "Drama"],
    overview:
      "When the lead vanishes two days before opening night, her replacement realises she has been rehearsing this role for years.",
    poster: posterA,
    cast: ["Juno Ferreira", "Alexei Stanek", "Priya Raman"],
    director: "Clara Nwankwo",
  },
  {
    id: "low-orbit-lullaby",
    title: "Low Orbit Lullaby",
    year: 2023,
    runtime: 88,
    rating: 7.1,
    genres: ["Animation", "Science Fiction"],
    overview:
      "A repair drone with one song in its memory crosses a junkyard sky looking for the child who wrote it.",
    poster: posterE,
    cast: ["Voices of Sana Whitlock and Idris Baye"],
    director: "Momo Tanaka",
  },
  {
    id: "burnt-sugar-county",
    title: "Burnt Sugar County",
    year: 2024,
    runtime: 126,
    rating: 7.7,
    genres: ["Crime", "Drama"],
    overview:
      "A sheriff's daughter runs the only bakery in a town built on a refinery, and both are hiding the same debt.",
    poster: posterD,
    cast: ["Coralie Duval", "Marcus Ide", "Yara Sabbagh"],
    director: "Pascal Duong",
  },
  {
    id: "the-second-reel",
    title: "The Second Reel",
    year: 2026,
    runtime: 104,
    rating: 8.2,
    genres: ["Drama", "Mystery"],
    overview:
      "A projectionist inherits a print of a film that was never finished, and starts screening it for an audience of one.",
    poster: posterF,
    cast: ["Hugo Marsden", "Talia Bright", "Ren Okada"],
    director: "Tilda Ruskin",
  },
];

export const GENRES = Array.from(new Set(MOVIES.flatMap((m) => m.genres))).sort();

export function getMovie(id: string): Movie | undefined {
  return MOVIES.find((m) => m.id === id);
}

export function similarTo(movie: Movie): Movie[] {
  return MOVIES.filter(
    (m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)),
  ).slice(0, 8);
}

export function byGenre(genre: string): Movie[] {
  return MOVIES.filter((m) => m.genres.includes(genre));
}

export function searchMovies(
  query: string,
  filters: { genre?: string; year?: number } = {},
): Movie[] {
  const q = query.trim().toLowerCase();
  return MOVIES.filter((m) => {
    if (q && !m.title.toLowerCase().includes(q) && !m.overview.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.genre && !m.genres.includes(filters.genre)) return false;
    if (filters.year && m.year !== filters.year) return false;
    return true;
  });
}

export const ROWS: { title: string; movies: Movie[] }[] = [
  { title: "Trending now", movies: [...MOVIES].sort((a, b) => b.year - a.year).slice(0, 8) },
  { title: "Popular", movies: [...MOVIES].slice(2, 10) },
  { title: "Top rated", movies: [...MOVIES].sort((a, b) => b.rating - a.rating).slice(0, 8) },
  { title: "Coming up", movies: MOVIES.filter((m) => m.year >= 2026) },
];

export const FEATURED = MOVIES[2]!;

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
