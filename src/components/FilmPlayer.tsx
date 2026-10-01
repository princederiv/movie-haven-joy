import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Captions,
  Gauge,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings2,
  Smartphone,
} from "lucide-react";
import type { FreeFilmDetail } from "@/lib/archive.functions";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function clock(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return h ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

type Menu = "quality" | "speed" | "subs" | null;

export function FilmPlayer({ film, onClose }: { film: FreeFilmDetail; onClose: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [quality, setQuality] = useState(film.sources[0]!);
  const [speed, setSpeed] = useState(1);
  const [subIndex, setSubIndex] = useState(-1);
  const [landscape, setLandscape] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [menu, setMenu] = useState<Menu>(null);
  const [showUi, setShowUi] = useState(true);
  const pendingSeek = useRef<number | null>(null);

  const poke = () => {
    setShowUi(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowUi(false), 3500);
  };

  useEffect(() => {
    poke();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(hideTimer.current);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (video.current) video.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const tracks = video.current?.textTracks;
    if (!tracks) return;
    for (let i = 0; i < tracks.length; i++) tracks[i]!.mode = i === subIndex ? "showing" : "hidden";
  }, [subIndex]);

  const changeQuality = (q: typeof quality) => {
    pendingSeek.current = video.current?.currentTime ?? 0;
    setQuality(q);
    setMenu(null);
  };

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleOrientation = async () => {
    const next = !landscape;
    setLandscape(next);
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    try {
      if (next) {
        if (!document.fullscreenElement) await wrap.current?.requestFullscreen();
        await orientation.lock?.("landscape");
      } else {
        await orientation.lock?.("portrait");
      }
    } catch {
      // Orientation lock isn't available on every browser; the layout still rotates.
    }
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else wrap.current?.requestFullscreen().catch(() => {});
  };

  const menuBtn = "flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur";

  return (
    <div
      ref={wrap}
      onPointerMove={poke}
      onClick={poke}
      className="fixed inset-0 z-[100] overflow-hidden bg-background"
    >
      <div
        className={
          landscape
            ? "absolute left-1/2 top-1/2 h-[100vw] w-[100dvh] -translate-x-1/2 -translate-y-1/2 rotate-90 landscape:h-full landscape:w-full landscape:rotate-0"
            : "absolute inset-0"
        }
      >
        <video
          ref={video}
          key={quality.url}
          src={quality.url}
          poster={film.poster}
          autoPlay
          playsInline
          crossOrigin="anonymous"
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setDuration(v.duration);
            v.playbackRate = speed;
            if (pendingSeek.current != null) {
              v.currentTime = pendingSeek.current;
              pendingSeek.current = null;
            }
            for (let i = 0; i < v.textTracks.length; i++)
              v.textTracks[i]!.mode = i === subIndex ? "showing" : "hidden";
          }}
          className="size-full object-contain"
        >
          {film.subtitles.map((s) => (
            <track key={s.url} kind="subtitles" label={s.label} src={s.url} srcLang="en" />
          ))}
        </video>

        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            showUi || !playing ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-background/90 to-transparent p-4 pt-[calc(env(safe-area-inset-top)+12px)]">
            <button onClick={onClose} aria-label="Close player" className="rounded-full bg-background/70 p-2">
              <ArrowLeft className="size-5" />
            </button>
            <p className="min-w-0 flex-1 truncate font-display text-xl tracking-wide">{film.title}</p>
          </div>

          <div className="pointer-events-auto absolute inset-0 m-auto flex h-16 w-64 items-center justify-between">
            <button
              aria-label="Back 10 seconds"
              onClick={() => video.current && (video.current.currentTime -= 10)}
              className="rounded-full bg-background/60 p-3"
            >
              <RotateCcw className="size-6" />
            </button>
            <button
              aria-label={playing ? "Pause" : "Play"}
              onClick={toggle}
              className="rounded-full bg-primary p-4 text-primary-foreground"
            >
              {playing ? <Pause className="size-7 fill-current" /> : <Play className="size-7 fill-current" />}
            </button>
            <button
              aria-label="Forward 10 seconds"
              onClick={() => video.current && (video.current.currentTime += 10)}
              className="rounded-full bg-background/60 p-3"
            >
              <RotateCw className="size-6" />
            </button>
          </div>

          <div className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-10">
            <div className="flex items-center gap-3 text-[11px] font-semibold tabular-nums text-muted-foreground">
              <span>{clock(time)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={1}
                value={time}
                onChange={(e) => video.current && (video.current.currentTime = Number(e.target.value))}
                aria-label="Seek"
                className="h-1 flex-1 accent-primary"
              />
              <span>{clock(duration)}</span>
            </div>

            {menu && (
              <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-card/95 p-3">
                {menu === "quality" &&
                  film.sources.map((q) => (
                    <button
                      key={q.url}
                      onClick={() => changeQuality(q)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${q.url === quality.url ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                    >
                      {q.label}
                    </button>
                  ))}
                {menu === "speed" &&
                  SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSpeed(s);
                        setMenu(null);
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${s === speed ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                    >
                      {s === 1 ? "Normal" : `${s}x`}
                    </button>
                  ))}
                {menu === "subs" && (
                  <>
                    <button
                      onClick={() => {
                        setSubIndex(-1);
                        setMenu(null);
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${subIndex === -1 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                    >
                      Off
                    </button>
                    {film.subtitles.length === 0 && (
                      <span className="px-1 py-1.5 text-xs text-muted-foreground">No subtitles for this film</span>
                    )}
                    {film.subtitles.map((s, i) => (
                      <button
                        key={s.url}
                        onClick={() => {
                          setSubIndex(i);
                          setMenu(null);
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${subIndex === i ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => setMenu(menu === "quality" ? null : "quality")} className={menuBtn}>
                <Settings2 className="size-4" /> {quality.label}
              </button>
              <button onClick={() => setMenu(menu === "speed" ? null : "speed")} className={menuBtn}>
                <Gauge className="size-4" /> {speed === 1 ? "1x" : `${speed}x`}
              </button>
              <button onClick={() => setMenu(menu === "subs" ? null : "subs")} className={menuBtn}>
                <Captions className="size-4" /> {subIndex === -1 ? "Subtitles off" : "Subtitles on"}
              </button>
              <button onClick={toggleOrientation} className={menuBtn}>
                <Smartphone className={`size-4 transition-transform ${landscape ? "rotate-90" : ""}`} />
                {landscape ? "Landscape" : "Portrait"}
              </button>
              <button onClick={fullscreen} aria-label="Full screen" className={`${menuBtn} ml-auto`}>
                <Maximize className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
