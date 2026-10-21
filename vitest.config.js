
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: "jsdom",

    setupFiles: ["./tests/setup.js"],

    include: [
      "tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}"
    ],

    exclude: [
      "node_modules/**",
      "tests/e2e/**"
    ],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],

      include: ["src/**/*.{js,jsx}"],

      exclude: [
        "src/main.jsx",
        "src/tests/**"
      ],

      thresholds: {
        statements: 80,
        functions: 80,
        branches: 75
      }
    }
  }
});
