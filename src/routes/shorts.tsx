import { useCallback } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ReelPlayer } from "@/components/Shorts";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts — StreamBox" },
      { name: "description", content: "Swipe through quick vertical film previews on StreamBox." },
      { property: "og:title", content: "Shorts — StreamBox" },
      { property: "og:description", content: "Swipe through quick vertical film previews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShortsPage,
});

function ShortsPage() {
  const router = useRouter();
  const onClose = useCallback(() => {
    if (window.history.length > 1) router.history.back();
    else router.navigate({ to: "/" });
  }, [router]);
  return <ReelPlayer startIndex={0} onClose={onClose} />;
}
