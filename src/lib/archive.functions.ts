import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Free, legally streamable full-length films from the Internet Archive's
 * public-domain "feature_films" collection.
 */
export type FreeFilm = {
  id: string;
  title: string;
  year: number | null;
  poster: string;
};

export type FreeFilmDetail = FreeFilm & {
  description: string;
  sources: { label: string; height: number; url: string }[];
  subtitles: { label: string; url: string }[];
};

const idSchema = z.string().regex(/^[A-Za-z0-9._-]{1,120}$/);

export const listFreeFilms = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ page: z.number().int().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const url = new URL("https://archive.org/advancedsearch.php");
    url.searchParams.set("q", "collection:feature_films AND mediatype:movies AND year:[1900 TO 2030]");
    url.searchParams.append("fl[]", "identifier");
    url.searchParams.append("fl[]", "title");
    url.searchParams.append("fl[]", "year");
    url.searchParams.append("sort[]", "downloads desc");
    url.searchParams.set("rows", "24");
    url.searchParams.set("page", String(data.page));
    url.searchParams.set("output", "json");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Free film library request failed [${res.status}]`);
    const json = (await res.json()) as {
      response: { numFound: number; docs: { identifier: string; title?: string; year?: string | number }[] };
    };
    const items: FreeFilm[] = json.response.docs.map((d) => ({
      id: d.identifier,
      title: d.title ?? d.identifier,
      year: d.year ? Number(d.year) || null : null,
      poster: `https://archive.org/services/img/${d.identifier}`,
    }));
    return { items, totalPages: Math.ceil(json.response.numFound / 24) };
  });

export const getFreeFilm = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ data }): Promise<FreeFilmDetail | null> => {
    const res = await fetch(`https://archive.org/metadata/${data.id}`);
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      metadata?: { title?: string; year?: string; date?: string; description?: string | string[] };
      files?: { name: string; format?: string; height?: string }[];
    };
    if (!meta.files || !meta.metadata) return null;
    const base = `https://archive.org/download/${data.id}`;
    const sources = meta.files
      .filter((f) => f.name.toLowerCase().endsWith(".mp4"))
      .map((f) => {
        const height = Number(f.height) || (f.format?.includes("512Kb") ? 240 : 360);
        return { label: `${height}p`, height, url: `${base}/${encodeURIComponent(f.name)}` };
      })
      .sort((a, b) => b.height - a.height)
      .filter((s, i, arr) => arr.findIndex((x) => x.height === s.height) === i);
    if (sources.length === 0) return null;
    const subtitles = meta.files
      .filter((f) => /\.(srt|vtt)$/i.test(f.name))
      .map((f) => ({
        label: /asr/i.test(f.name) ? "English (auto)" : f.name.replace(/\.(srt|vtt)$/i, "").split(".").pop() || "Subtitles",
        url: `/api/public/subtitles?id=${encodeURIComponent(data.id)}&file=${encodeURIComponent(f.name)}`,
      }));
    const desc = Array.isArray(meta.metadata.description)
      ? meta.metadata.description.join(" ")
      : (meta.metadata.description ?? "");
    const yearRaw = meta.metadata.year ?? meta.metadata.date?.slice(0, 4);
    return {
      id: data.id,
      title: meta.metadata.title ?? data.id,
      year: yearRaw ? Number(yearRaw) || null : null,
      poster: `https://archive.org/services/img/${data.id}`,
      description: desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      sources,
      subtitles,
    };
  });
