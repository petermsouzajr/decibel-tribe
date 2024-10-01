import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://stage.decibeltribe.com",
  },
});
