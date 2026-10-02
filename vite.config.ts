// @lovable.dev/vite-tanstack-config already includes the required TanStack Start,
// React, Tailwind, Nitro and path-alias plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: {
      enabled: true,
      failOnError: true,
    },
  },
});
