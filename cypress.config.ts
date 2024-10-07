import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    supportFile: "cypress/support/e2e.ts",
    baseUrl: "http://localhost:3000/",
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
  },
});
