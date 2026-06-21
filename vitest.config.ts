import { defineConfig } from "vitest/config";

// Vitest config — kept minimal so we don't pull in vite plugins that expect
// the full app build. We pin a non-UTC timezone for tests so the local-date
// helpers in src/lib/* are exercised under the exact conditions they were
// designed to handle (US Pacific, including DST).
export default defineConfig({
  test: {
    environment: "node",
    env: {
      TZ: "America/Los_Angeles",
    },
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
  },
});
