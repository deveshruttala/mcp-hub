import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    globals: false,
    reporters: ["verbose"],
    testTimeout: 60_000,
    hookTimeout: 90_000,
    // Integration tests spawn a real dev server — keep them serial.
    pool: "forks",
    fileParallelism: false,
  },
});
