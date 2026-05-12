import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: true,
    env: {
      AUTH_SECRET: "test_secret_for_vitest",
    },
  },
});
