// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

//@ts-ignore
export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import("vite-tsconfig-paths");

  return {
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./setupTests.ts", // Add this line
    },
    plugins: [tsconfigPaths()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    esbuild: {
      jsx: "automatic", // Use the new JSX transform in Esbuild
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      loader: "tsx", // Ensure that .tsx files are processed correctly
    },
  };
});
