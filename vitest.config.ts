import { defineConfig } from "vitest/config";

// Vitest config — kept minimal so we don't pull in vite plugins that expect
// the full app build. Pin TZ so the local-date helpers in src/lib/* are
// exercised under the exact conditions they were designed for.
export default defineConfig({
  test: {
    environment: "node",
    env: {
      TZ: "America/Los_Angeles",
    },
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
