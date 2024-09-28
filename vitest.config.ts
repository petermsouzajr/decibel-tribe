import { defineConfig } from "vitest/config";
import path from "path";

//@ts-ignore
export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import("vite-tsconfig-paths");

  return {
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./setupTests.ts",
    },
    plugins: [tsconfigPaths()],
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
