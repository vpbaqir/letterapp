import { createFileRoute } from "@tanstack/react-router";
import { WriteUnlockApp } from "@/components/write-unlock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Write & Unlock — Handwriting Adventure" },
      { name: "description", content: "A playful handwriting game where writing letters unlocks fun." },
      { property: "og:title", content: "Write & Unlock — Handwriting Adventure" },
      { property: "og:description", content: "Write it. Unlock it. Play it. A rewarding handwriting adventure for children." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WriteUnlockApp,
});
