import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  // Prisma 7-style runtime config: use a driver adapter instead of datasource URLs in schema.
  // Prefer pooled URL for runtime if present, otherwise fall back to direct.
  const connectionString =
    process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "Missing DB connection env. Set POSTGRES_PRISMA_URL (pooled) or POSTGRES_URL_NON_POOLING (direct).",
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
