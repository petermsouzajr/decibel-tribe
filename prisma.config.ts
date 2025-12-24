import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7-style configuration:
 * - Connection URLs are no longer defined in `schema.prisma`.
 * - Prisma CLI (migrate/introspect/etc.) reads the datasource URL from here.
 *
 * We prefer the direct/non-pooled URL for migrations.
 */
export default defineConfig({
  datasource: {
    // Prefer direct/non-pooled for migrations when available, otherwise fall back.
    url:
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      (() => {
        throw new Error(
          "No DB URL found for Prisma CLI. Set POSTGRES_URL_NON_POOLING, POSTGRES_PRISMA_URL, DATABASE_URL, or POSTGRES_URL.",
        );
      })(),
  },
});

