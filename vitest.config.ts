import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

//@ts-ignore
export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import("vite-tsconfig-paths");

  return {
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "tests/setupTests.ts",
      testTimeout: 15000,
      coverage: {
        provider: "istanbul",
        reporter: ["text", "json-summary", "json", "html"],
        reportsDirectory: "./coverage/vitest",
        all: true,
        include: ["src/**"],
        exclude: [
          "src/**/index.ts",
          "src/**/*.d.ts",
          "src/**/*.test.ts",
          "src/**/*.test.tsx",
          "src/**/*.stories.tsx",
          "src/**/constants.ts",
          "src/lib/utils.ts",
        ],
      },
    },
    plugins: [react(), tsconfigPaths()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    esbuild: {
      jsx: "automatic",
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      loader: "tsx",
    },
  };
});
