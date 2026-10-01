import { createFileRoute } from "@tanstack/react-router";

const ID = /^[A-Za-z0-9._-]{1,120}$/;
const FILE = /^[^/\\]{1,200}\.(srt|vtt)$/i;

function srtToVtt(srt: string) {
  return (
    "WEBVTT\n\n" +
    srt
      .replace(/\r/g, "")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
      .trim()
  );
}

export const Route = createFileRoute("/api/public/subtitles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const id = u.searchParams.get("id") ?? "";
        const file = u.searchParams.get("file") ?? "";
        if (!ID.test(id) || !FILE.test(file)) return new Response("Bad request", { status: 400 });
        const res = await fetch(
          `https://archive.org/download/${id}/${encodeURIComponent(file)}`,
        );
        if (!res.ok) return new Response("Not found", { status: 404 });
        const text = await res.text();
        const vtt = file.toLowerCase().endsWith(".vtt") ? text : srtToVtt(text);
        return new Response(vtt, {
          headers: { "content-type": "text/vtt; charset=utf-8", "cache-control": "public, max-age=86400" },
        });
      },
    },
  },
});
