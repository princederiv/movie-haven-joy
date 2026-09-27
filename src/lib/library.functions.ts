import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const movieInput = z.object({
  movie_id: z.string().min(1),
  title: z.string().min(1),
  poster_url: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  release_year: z.number().nullable().optional(),
});

export const getWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("watchlist")
      .select("movie_id, title, poster_url, rating, release_year, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addToWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => movieInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("watchlist").upsert(
      {
        user_id: context.userId,
        movie_id: data.movie_id,
        title: data.title,
        poster_url: data.poster_url ?? null,
        rating: data.rating ?? null,
        release_year: data.release_year ?? null,
      },
      { onConflict: "user_id,movie_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ movie_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("watchlist")
      .delete()
      .eq("movie_id", data.movie_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getContinueWatching = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("continue_watching")
      .select("movie_id, title, poster_url, progress_seconds, duration_seconds, last_watched_at")
      .order("last_watched_at", { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        movie_id: z.string(),
        title: z.string(),
        poster_url: z.string().nullable().optional(),
        progress_seconds: z.number().int().min(0),
        duration_seconds: z.number().int().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("continue_watching").upsert(
      {
        user_id: context.userId,
        movie_id: data.movie_id,
        title: data.title,
        poster_url: data.poster_url ?? null,
        progress_seconds: data.progress_seconds,
        duration_seconds: data.duration_seconds,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,movie_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
