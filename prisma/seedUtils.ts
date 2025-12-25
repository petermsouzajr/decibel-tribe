import { PrismaClient, GroupRole, NotificationType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { faker } from "@faker-js/faker";
import { StreamChat } from "stream-chat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url"; // Import url helpers
import { generateIdFromEntropySize as luciaGenerateId } from "lucia";

// ESM way to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars using the derived __dirname
const envPath = path.resolve(__dirname, "../.env"); // Path relative to dist/seedUtils.mjs will be dist/
console.log(`Attempting to load .env from: ${envPath}`); // Add logging
dotenv.config({ path: envPath });
const cypressEnvPath = path.resolve(__dirname, "../cypress.env.json"); // Path relative to dist/seedUtils.mjs
console.log(`Attempting to load cypress.env.json from: ${cypressEnvPath}`); // Add logging
export const cypressEnv = JSON.parse(fs.readFileSync(cypressEnvPath, "utf-8"));

// Prisma Client
const connectionString =
  process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error(
    "Missing DB connection env. Set POSTGRES_PRISMA_URL (pooled) or POSTGRES_URL_NON_POOLING (direct).",
  );
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

// Faker
export { faker };

// Stream Chat Client Singleton
const streamKey = process.env.NEXT_PUBLIC_STREAM_KEY;
const streamSecret = process.env.STREAM_SECRET;

let streamChatClientInstance: StreamChat | null = null;
if (streamKey && streamSecret) {
  streamChatClientInstance = StreamChat.getInstance(streamKey, streamSecret);
} else {
  console.warn(
    "Stream Chat key or secret not found in environment variables. Stream Chat client not initialized.",
  );
}
export const streamChatClient = streamChatClientInstance;

// Lucia ID generation
export const generateIdFromEntropySize = luciaGenerateId;

// Type for the hashing function dependency
export type Hasher = (password: string) => Promise<string>;

// --- Helper Functions ---

// Random Helpers
export const random = (min: number, max: number): number =>
  faker.number.int({ min, max });

export const weightedRandom = (base: number, factor = 1): number => {
  return Math.floor(base * factor * faker.number.float({ min: 0.5, max: 1.5 }));
};

export const proportionateRandom = (users: number, factor: number): number => {
  return random(
    Math.ceil(users * factor * 0.5),
    Math.ceil(users * factor * 1.5),
  );
};

// AccountData Generator
export const accountDataGenerator = (
  value: string | number,
  users: number,
  factor: number,
): number => {
  if (value === "random") {
    return proportionateRandom(users, factor);
  }
  // Ensure conversion happens correctly
  const numValue = Number(value);
  return isNaN(numValue) ? 0 : numValue; // Return 0 if conversion fails
};

// Password Hashing Helper (using bcryptjs)
export const passwordHash = async (
  password: string,
  // Optional dependency injection for testing
  hasher?: Hasher,
): Promise<string> => {
  if (hasher) {
    // Use injected hasher if provided (for tests)
    return hasher(password);
  } else {
    // Default behavior: dynamically import and use bcryptjs
    // Use dynamic import inside the function
    // @ts-ignore - Suppress persistent type error for bcryptjs import
    const bcryptModule = await import("bcryptjs");
    // Access functions via the .default property
    const salt = await bcryptModule.default.genSalt(10);
    return bcryptModule.default.hash(password, salt);
  }
};

// Export Prisma Enums if needed elsewhere
export { GroupRole, NotificationType };
