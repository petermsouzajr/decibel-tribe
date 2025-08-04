// prisma/seedUtils.ts
import { PrismaClient, GroupRole, NotificationType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { StreamChat } from "stream-chat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { generateIdFromEntropySize as luciaGenerateId } from "lucia";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var envPath = path.resolve(__dirname, "../.env");
console.log(`Attempting to load .env from: ${envPath}`);
dotenv.config({ path: envPath });
var cypressEnvPath = path.resolve(__dirname, "../cypress.env.json");
console.log(`Attempting to load cypress.env.json from: ${cypressEnvPath}`);
var cypressEnv = JSON.parse(fs.readFileSync(cypressEnvPath, "utf-8"));
var prisma = new PrismaClient();
var streamKey = process.env.NEXT_PUBLIC_STREAM_KEY;
var streamSecret = process.env.STREAM_SECRET;
var streamChatClientInstance = null;
if (streamKey && streamSecret) {
  streamChatClientInstance = StreamChat.getInstance(streamKey, streamSecret);
} else {
  console.warn(
    "Stream Chat key or secret not found in environment variables. Stream Chat client not initialized."
  );
}
var streamChatClient = streamChatClientInstance;
var generateIdFromEntropySize = luciaGenerateId;
var random = (min, max) => faker.number.int({ min, max });
var weightedRandom = (base, factor = 1) => {
  return Math.floor(base * factor * faker.number.float({ min: 0.5, max: 1.5 }));
};
var proportionateRandom = (users, factor) => {
  return random(
    Math.ceil(users * factor * 0.5),
    Math.ceil(users * factor * 1.5)
  );
};
var accountDataGenerator = (value, users, factor) => {
  if (value === "random") {
    return proportionateRandom(users, factor);
  }
  const numValue = Number(value);
  return isNaN(numValue) ? 0 : numValue;
};
var passwordHash = async (password, hasher) => {
  if (hasher) {
    return hasher(password);
  } else {
    const bcryptModule = await import("bcryptjs");
    const salt = await bcryptModule.default.genSalt(10);
    return bcryptModule.default.hash(password, salt);
  }
};

export {
  GroupRole,
  NotificationType,
  faker,
  cypressEnv,
  prisma,
  streamChatClient,
  generateIdFromEntropySize,
  random,
  weightedRandom,
  proportionateRandom,
  accountDataGenerator,
  passwordHash
};
