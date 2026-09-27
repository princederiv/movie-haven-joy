import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import type { Movie } from "@/lib/movies";

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  movie: Movie;
  startAt?: number;
  onClose: () => void;
  onProgress?: (seconds: number, duration: number) => void;
};

/**
 * Full-screen player surface. Plays the film's preview and tracks the resume
 * point; swap the surface for the catalogue's official trailer embed once a
 * catalogue key is connected.
 */
export function TrailerPlayer({ movie, startAt = 0, onClose, onProgress }: Props) {
  const duration = movie.runtime * 60;
  const [position, setPosition] = useState(Math.min(startAt, duration - 1));
  const [playing, setPlaying] = useState(true);
  const lastSaved = useRef(position);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setPosition((p) => {
        const next = p + 1;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, duration]);

  useEffect(() => {
    if (Math.abs(position - lastSaved.current) >= 10) {
      lastSaved.current = position;
      onProgress?.(position, duration);
    }
  }, [position, duration, onProgress]);

  const handleClose = () => {
    onProgress?.(position, duration);
    onClose();
  };

  const pct = (position / duration) * 100;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
        <p className="font-display text-lg tracking-wide text-foreground">{movie.title}</p>
        <button onClick={handleClose} aria-label="Close player" className="p-2 text-foreground">
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <img
          src={movie.poster}
          alt={movie.title}
          className="absolute inset-0 size-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="relative flex size-20 items-center justify-center rounded-full bg-primary/90 text-primary-foreground active:scale-95"
        >
          {playing ? (
            <Pause className="size-8 fill-current" />
          ) : (
            <Play className="size-8 fill-current" />
          )}
        </button>
      </div>

      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+22px)]">
        <input
          type="range"
          min={0}
          max={duration}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label="Seek"
          className="w-full accent-[var(--primary)]"
        />
        <div className="mt-1 flex justify-between text-[11px] font-semibold text-muted-foreground">
          <span>{clock(position)}</span>
          <span>{Math.round(pct)}%</span>
          <span>{clock(duration)}</span>
        </div>
      </div>
    </div>
  );
}
