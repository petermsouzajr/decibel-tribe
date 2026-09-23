import crypto from "crypto";
import prisma from "@/lib/prisma";
import {
  APPEARANCE_OPTIONS,
  CLOTHING_OPTIONS,
  EYE_COLOR_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  SETTING_OPTIONS,
} from "./appearanceCatalog";
import {
  acceptedProposals,
  parseAppearanceResponse,
  type AppearanceKind,
  type AppearanceProposal,
} from "./appearanceLabels";

const KINDS: AppearanceKind[] = [
  "eyeColor",
  "hairColor",
  "hairStyle",
  "facialHair",
  "appearance",
  "clothing",
  "setting",
];

const SINGLE = new Set<AppearanceKind>(["eyeColor", "facialHair"]);

const SEED: Record<AppearanceKind, { slug: string; label: string }[]> = {
  eyeColor: EYE_COLOR_OPTIONS,
  hairColor: HAIR_COLOR_OPTIONS,
  hairStyle: HAIR_STYLE_OPTIONS,
  facialHair: FACIAL_HAIR_OPTIONS,
  appearance: APPEARANCE_OPTIONS,
  clothing: CLOTHING_OPTIONS,
  setting: SETTING_OPTIONS,
};

let seedPromise: Promise<void> | null = null;

function samePhotoSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sorted = [...left].sort();
  return [...right].sort().every((id, index) => id === sorted[index]);
}

async function ensureAppearanceSeed() {
  if (!seedPromise) {
    seedPromise = seedAppearanceTables().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function seedAppearanceTables() {
  await prisma.eyeColor.createMany({
    data: SEED.eyeColor.map(seedRow),
    skipDuplicates: true,
  });
  await prisma.hairColor.createMany({ data: SEED.hairColor.map(seedRow), skipDuplicates: true });
  await prisma.hairStyle.createMany({ data: SEED.hairStyle.map(seedRow), skipDuplicates: true });
  await prisma.facialHair.createMany({ data: SEED.facialHair.map(seedRow), skipDuplicates: true });
  await prisma.appearanceTag.createMany({ data: SEED.appearance.map(seedRow), skipDuplicates: true });
  await prisma.clothing.createMany({ data: SEED.clothing.map(seedRow), skipDuplicates: true });
  await prisma.setting.createMany({ data: SEED.setting.map(seedRow), skipDuplicates: true });
}

function seedRow(item: { slug: string; label: string }) {
  return { id: `seed:${item.slug}`, slug: item.slug, label: item.label, source: "seed" };
}

async function categoryId(kind: AppearanceKind, slug: string, label: string): Promise<string> {
  const seeded = SEED[kind].some((item) => item.slug === slug);
  if (seeded) return `seed:${slug}`;
  const id = crypto.randomUUID();
  if (kind === "eyeColor") {
    const row = await prisma.eyeColor.upsert({ where: { slug }, update: {}, create: { id, slug, label, source: "model" } });
    return row.id;
  }
  if (kind === "hairColor") {
    const row = await prisma.hairColor.upsert({ where: { slug }, update: {}, create: { id, slug, label, source: "model" } });
    return row.id;
  }
  if (kind === "hairStyle") {
    const row = await prisma.hairStyle.upsert({ where: { slug }, update: {}, create: { id, slug, label, source: "model" } });
    return row.id;
  }
  if (kind === "facialHair") {
    const row = await prisma.facialHair.upsert({ where: { slug }, update: {}, create: { id, slug, label, source: "model" } });
    return row.id;
  }
  if (kind === "appearance") {
    const row = await prisma.appearanceTag.upsert({ where: { slug }, update: {}, create: { id, slug, label, source: "model" } });
    return row.id;
  }
  if (kind === "clothing") {
    const row = await prisma.clothing.upsert({ where: { slug }, update: {}, create: { id, slug, label, source: "model" } });
    return row.id;
  }
  const row = await prisma.setting.upsert({ where: { slug }, update: {}, create: { id, slug, label, source: "model" } });
  return row.id;
}

async function replaceGroup(
  userId: string,
  kind: AppearanceKind,
  rows: { id: string; confidence: number }[],
  photoIds: string[],
) {
  await prisma.$transaction(async (tx) => {
    if (kind === "eyeColor") {
      await tx.userEyeColor.deleteMany({ where: { userId } });
      if (rows[0]) {
        await tx.userEyeColor.create({
          data: { userId, eyeColorId: rows[0].id, confidence: rows[0].confidence, photoIds },
        });
      }
      return;
    }
    if (kind === "hairColor") {
      await tx.userHairColor.deleteMany({ where: { userId } });
      if (rows.length) {
        await tx.userHairColor.createMany({
          data: rows.map((row) => ({ userId, hairColorId: row.id, confidence: row.confidence, photoIds })),
        });
      }
      return;
    }
    if (kind === "hairStyle") {
      await tx.userHairStyle.deleteMany({ where: { userId } });
      if (rows.length) {
        await tx.userHairStyle.createMany({
          data: rows.map((row) => ({ userId, hairStyleId: row.id, confidence: row.confidence, photoIds })),
        });
      }
      return;
    }
    if (kind === "facialHair") {
      await tx.userFacialHair.deleteMany({ where: { userId } });
      if (rows[0]) {
        await tx.userFacialHair.create({
          data: { userId, facialHairId: rows[0].id, confidence: rows[0].confidence, photoIds },
        });
      }
      return;
    }
    if (kind === "appearance") {
      await tx.userAppearance.deleteMany({ where: { userId } });
      if (rows.length) {
        await tx.userAppearance.createMany({
          data: rows.map((row) => ({ userId, appearanceId: row.id, confidence: row.confidence, photoIds })),
        });
      }
      return;
    }
    if (kind === "clothing") {
      await tx.userClothing.deleteMany({ where: { userId } });
      if (rows.length) {
        await tx.userClothing.createMany({
          data: rows.map((row) => ({ userId, clothingId: row.id, confidence: row.confidence, photoIds })),
        });
      }
      return;
    }
    await tx.userSetting.deleteMany({ where: { userId } });
    if (rows.length) {
      await tx.userSetting.createMany({
        data: rows.map((row) => ({ userId, settingId: row.id, confidence: row.confidence, photoIds })),
      });
    }
  });
}

function promptFor(photoCount: number): string {
  const lists = KINDS.map((kind) => `${kind}: ${SEED[kind].map((item) => item.label).join(", ")}`).join("\n");
  return [
    `Look at these ${photoCount} dating photos of one person.`,
    "Reply with JSON only. Keys: eyeColor, hairColor, hairStyle, facialHair, appearance, clothing, setting.",
    'Each value is an array of {"label": string, "confidence": number from 0 to 1}.',
    "Use a known label when it fits. You may add a short new style label when none fits.",
    "Do not mention race, ethnicity, skin tone, body size, weight, age, health, disability, or attractiveness.",
    "Eye color and facial hair: at most one label. If a trait is unclear, use an empty array.",
    lists,
  ].join("\n");
}

async function askGrok(apiKey: string, model: string, photoUrls: string[]): Promise<string> {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: promptFor(photoUrls.length) }];
  photoUrls.forEach((url, index) => {
    content.push({ type: "text", text: `Photo ${index + 1}` });
    content.push({ type: "image_url", image_url: { url } });
  });
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [{ role: "user", content }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Appearance model returned ${response.status}`);
  }
  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return body.choices?.[0]?.message?.content ?? "";
}

function pickRows(kind: AppearanceKind, items: AppearanceProposal[]) {
  const accepted = acceptedProposals(items);
  if (!SINGLE.has(kind)) return accepted;
  return accepted.sort((a, b) => b.confidence - a.confidence).slice(0, 1);
}

export async function evaluateAppearance(userId: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error("Appearance evaluation skipped: XAI_API_KEY is not set");
    return;
  }
  const photos = await prisma.userDatingPhoto.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true },
  });
  if (photos.length === 0) return;

  const photoIds = photos.map((photo) => photo.id);
  const latest = await prisma.appearanceRun.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { photoIds: true, groups: { select: { status: true } } },
  });
  const latestSucceeded = latest?.groups.every((group) => group.status !== "failed") ?? false;
  if (latest && latestSucceeded && samePhotoSet(latest.photoIds, photoIds)) return;

  await ensureAppearanceSeed();
  const model = process.env.XAI_VISION_MODEL || "grok-2-vision-1212";
  const parsed = parseAppearanceResponse(await askGrok(apiKey, model, photos.map((photo) => photo.url)));
  const statuses: { kind: AppearanceKind; status: string }[] = [];

  for (const kind of KINDS) {
    if (!parsed) {
      statuses.push({ kind, status: "failed" });
      continue;
    }
    const rows = pickRows(kind, parsed[kind]);
    if (rows.length === 0) {
      statuses.push({ kind, status: "empty" });
      continue;
    }
    const saved = [];
    for (const row of rows) {
      saved.push({
        id: await categoryId(kind, row.slug, row.label),
        confidence: row.confidence,
      });
    }
    await replaceGroup(userId, kind, saved, photoIds);
    statuses.push({ kind, status: "saved" });
  }

  await prisma.appearanceRun.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      model,
      photoIds,
      groups: {
        create: statuses.map((group) => ({
          id: crypto.randomUUID(),
          kind: group.kind,
          status: group.status,
        })),
      },
    },
  });
}

export function scheduleAppearanceEvaluation(userId: string) {
  void evaluateAppearance(userId).catch((error) => {
    console.error("Appearance evaluation failed:", error);
  });
}
