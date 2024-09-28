"use server";

import { resendVerificationEmail } from "@/app/(auth)/sendVerification";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { getUserDataSelect } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";
import { hash, verify } from "@node-rs/argon2";

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
        userPreferences: {
          upsert: {
            create: { calendar: validatedValues.visibility },
            update: { calendar: validatedValues.visibility },
          },
        },
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

export async function updateUserPassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!userRecord || !userRecord.passwordHash) {
    throw new Error("Password not set for this user.");
  }

  const isPasswordValid = await verify(
    userRecord.passwordHash,
    currentPassword,
  );
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect.");
  }

  const hashedNewPassword = await hash(newPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedNewPassword },
  });

  return { message: "Password updated successfully" };
}

export async function updateUserEmail({
  currentPassword,
  newEmail,
}: {
  currentPassword: string;
  newEmail: string;
}) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, email: true },
  });

  if (!userRecord || !userRecord.passwordHash) {
    throw new Error("Password not set for this user.");
  }

  const isPasswordValid = await verify(
    userRecord.passwordHash,
    currentPassword,
  );
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect.");
  }

  const emailExists = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (emailExists) {
    throw new Error("Email is already taken.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { pendingEmail: newEmail } as any,
  });
  await resendVerificationEmail(newEmail);

  return { message: "Verification email sent to new email address." };
}
