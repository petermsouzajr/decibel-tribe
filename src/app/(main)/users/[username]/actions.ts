"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { getUserDataSelect } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";

export async function updateUserProfile(values: UpdateUserProfileValues) {
  const validatedValues = updateUserProfileSchema.parse(values);

  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const updatedUser = await prisma.$transaction(async (tx) => {
    const instrumentIds = await Promise.all(
      validatedValues.instruments.map(async (instrumentName) => {
        const instrument = await tx.instrument.upsert({
          where: { name: instrumentName },
          update: {},
          create: { name: instrumentName },
        });
        return instrument.id;
      }),
    );

    // Find or create skills based on names
    const skillIds = await Promise.all(
      validatedValues.skills.map(async (skillName) => {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
        return skill.id;
      }),
    );

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        displayName: validatedValues.displayName,
        bio: validatedValues.bio,
        userInstruments: {
          deleteMany: {},
          create: instrumentIds.map((id) => ({ instrumentId: id })),
        },
        userSkills: {
          deleteMany: {},
          create: skillIds.map((id) => ({ skillId: id })),
        },
      },
      select: getUserDataSelect(user.id),
    });
    await streamServerClient.partialUpdateUser({
      id: user.id,
      set: {
        name: validatedValues.displayName,
      },
    });
    return updatedUser;
  });

  return updatedUser;
}
