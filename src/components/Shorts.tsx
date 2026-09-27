import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, Play, Star, Volume2, VolumeX, X } from "lucide-react";
import { MOVIES, type Movie } from "@/lib/movies";
import reelAsset from "@/assets/reel-placeholder.mp4.asset.json";

/** Placeholder clip shared by every reel until real trailer clips are ready. */
const REEL_SRC = reelAsset.url;

export type Short = { movie: Movie; seconds: number };

export const SHORTS: Short[] = MOVIES.map((movie, i) => ({
  movie,
  seconds: 18 + ((i * 7) % 42),
}));

function clock(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function ShortCard({ short, onOpen }: { short: Short; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <button
      onClick={onOpen}
      className="relative w-[128px] shrink-0 snap-start overflow-hidden rounded-xl bg-card text-left ring-1 ring-border/60 active:scale-[0.96] transition-transform"
    >
      <video
        ref={ref}
        src={REEL_SRC}
        poster={short.movie.poster}
        muted
        loop
        playsInline
        preload="metadata"
        className="aspect-[9/16] w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent p-2 pt-8">
        <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">
          {short.movie.title}
        </p>
      </div>
      <span className="absolute right-1.5 top-1.5 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-bold text-foreground backdrop-blur">
        {clock(short.seconds)}
      </span>
    </button>
  );
}

export function ShortsRail() {
  const [openAt, setOpenAt] = useState<number | null>(null);
  return (
    <section className="mt-7">
      <h2 className="px-4 font-display text-xl tracking-wide text-foreground">Shorts</h2>
      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SHORTS.map((s, i) => (
          <ShortCard key={s.movie.id} short={s} onOpen={() => setOpenAt(i)} />
        ))}
      </div>
      {openAt !== null && <ReelPlayer startIndex={openAt} onClose={() => setOpenAt(null)} />}
    </section>
  );
}

function Reel({
  short,
  active,
  preload,
  muted,
  onToggleMute,
}: {
  short: Short;
  active: boolean;
  preload: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const m = short.movie;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) {
      el.currentTime = 0;
      el.play().catch(() => {});
    } else el.pause();
  }, [active]);

  return (
    <div className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden">
      {preload || active ? (
        <video
          ref={ref}
          src={REEL_SRC}
          poster={m.poster}
          muted={muted}
          loop
          playsInline
          preload="auto"
          onClick={onToggleMute}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <img src={m.poster} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

      <button
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute left-4 top-[calc(env(safe-area-inset-top)+14px)] rounded-full bg-background/60 p-2.5 text-foreground backdrop-blur"
      >
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+120px)] right-3 flex flex-col items-center gap-5">
        <button
          onClick={() => setLiked((v) => !v)}
          aria-label="Like"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-foreground"
        >
          <Heart className={`size-7 ${liked ? "fill-primary text-primary" : ""}`} />
          Like
        </button>
        <button
          onClick={() => setSaved((v) => !v)}
          aria-label="Save"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-foreground"
        >
          <Bookmark className={`size-7 ${saved ? "fill-primary text-primary" : ""}`} />
          Save
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pr-20">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span className="flex items-center gap-1 text-primary">
            <Star className="size-3 fill-current" />
            {m.rating.toFixed(1)}
          </span>
          <span>{m.year}</span>
        </div>
        <h3 className="mt-1 font-display text-4xl leading-none text-foreground">{m.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.genres.map((g) => (
            <span
              key={g}
              className="rounded-full border border-border bg-background/50 px-2.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur"
            >
              {g}
            </span>
          ))}
        </div>
        <Link
          to="/movie/$movieId"
          params={{ movieId: m.id }}
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.98]"
        >
          <Play className="size-4 fill-current" />
          Play full film
        </Link>
      </div>
    </div>
  );
}

export function ReelPlayer({ startIndex, onClose }: { startIndex: number; onClose: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = startIndex * el.clientHeight;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [startIndex, onClose]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== active) setActive(i);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background">
      <div
        ref={scroller}
        onScroll={onScroll}
        onTouchStart={(e) => {
          touchY.current = scroller.current?.scrollTop === 0 ? (e.touches[0]?.clientY ?? null) : null;
        }}
        onTouchEnd={(e) => {
          const start = touchY.current;
          const end = e.changedTouches[0]?.clientY;
          if (start != null && end != null && end - start > 90) onClose();
          touchY.current = null;
        }}
        className="mx-auto h-[100dvh] max-w-md snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SHORTS.map((s, i) => (
          <Reel
            key={s.movie.id}
            short={s}
            active={i === active}
            preload={i > active && i <= active + 2}
            muted={muted}
            onToggleMute={() => setMuted((v) => !v)}
          />
        ))}
      </div>
      <button
        onClick={onClose}
        aria-label="Close shorts"
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+14px)] rounded-full bg-background/60 p-2.5 text-foreground backdrop-blur"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
