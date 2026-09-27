import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

type Props = {
  id: string;
  title: string;
  poster: string;
  year?: number;
  rating?: number | null;
  className?: string;
};

export function MoviePoster({ id, title, poster, year, rating, className }: Props) {
  return (
    <Link
      to="/movie/$movieId"
      params={{ movieId: id }}
      className={`group block shrink-0 transition-transform active:scale-[0.96] ${className ?? ""}`}
    >
      <div className="relative overflow-hidden rounded-xl bg-card shadow-lg shadow-black/50 ring-1 ring-border/60">
        <img
          src={poster}
          alt={title}
          loading="lazy"
          width={768}
          height={1152}
          className="aspect-[2/3] w-full object-cover"
        />
        {rating != null && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-bold text-primary backdrop-blur">
            <Star className="size-2.5 fill-current" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-[13px] font-semibold text-foreground">{title}</p>
      {year != null && <p className="text-[11px] text-muted-foreground">{year}</p>}
    </Link>
  );
}
