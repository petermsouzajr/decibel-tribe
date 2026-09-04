"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export interface DeleteAccountFormData {
  password: string;
  confirmDeletion: boolean;
}

export async function deleteUserAccount(
  formData: DeleteAccountFormData,
  userId?: string,
) {
  try {
    let user: {
      id: string;
      passwordHash: string | null;
      deletedAt: Date | null;
    } | null;

    if (userId) {
      // If userId is provided, fetch user directly (for reactivation flow)
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          passwordHash: true,
          deletedAt: true,
        },
      });
    } else {
      // Otherwise use session validation
      const { user: sessionUser } = await validateRequest();
      user = sessionUser as {
        id: string;
        passwordHash: string | null;
        deletedAt: Date | null;
      } | null;
    }

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Validate form data
    if (!formData.confirmDeletion) {
      throw new Error("You must confirm that you want to delete your account");
    }

    if (!formData.password) {
      throw new Error("Password is required to delete your account");
    }

    // Verify password
    if (user.passwordHash) {
      const isValidPassword = await bcrypt.compare(
        formData.password,
        user.passwordHash,
      );
      if (!isValidPassword) {
        throw new Error("Invalid password");
      }
    }

    // Check if user is already deleted
    if (user.deletedAt) {
      throw new Error("Account is already deleted");
    }

    // Perform soft delete - just mark as deleted
    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    // Note: StreamChat user is NOT deleted immediately
    // User data in StreamChat will be preserved during grace period
    // Permanent deletion will be handled by background cleanup job after grace period

    // Revalidate relevant paths
    revalidatePath("/");
    revalidatePath("/users/[username]");
    revalidatePath("/posts");
    revalidatePath("/events");

    return { success: true, message: "Account deleted successfully" };
  } catch (error) {
    console.error("Error deleting user account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}

/**
 * Reactivates a soft-deleted account.
 *
 * Runs for a logged-out caller by design — the account is deleted, so there is
 * no session to validate. Ownership is therefore proved with the account
 * password. Without that check this function would restore any account from a
 * bare id, and the id was obtainable from the login form.
 */
export async function reactivateUserAccount(userId: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // No password set (OAuth-only account) cannot be reactivated this way.
    if (!user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    if (!user.deletedAt) {
      throw new Error("Account is not deleted");
    }

    // Check if within grace period (90 days)
    const gracePeriod = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
    const timeSinceDeletion = Date.now() - user.deletedAt.getTime();

    if (timeSinceDeletion > gracePeriod) {
      throw new Error("Account reactivation period has expired");
    }

    // Reactivate account
    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: null },
    });

    // Note: StreamChat user should still exist since we don't delete it immediately
    // No need to reactivate - the user should still be active in StreamChat

    // Revalidate relevant paths
    revalidatePath("/");
    revalidatePath("/users/[username]");

    return { success: true, message: "Account reactivated successfully" };
  } catch (error) {
    console.error("Error reactivating user account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reactivate account",
    };
  }
}

export async function exportUserData() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        posts: {
          include: {
            attachments: true,
            comments: true,
            likes: true,
            dislikes: true,
            bookmarks: true,
          },
        },
        events: {
          include: {
            attendees: true,
          },
        },
        groups: {
          include: {
            group: true,
          },
        },
        following: {
          include: {
            following: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        followers: {
          include: {
            follower: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        userInstruments: {
          include: {
            instrument: true,
          },
        },
        userSkills: {
          include: {
            skill: true,
          },
        },
        userPreferences: true,
        receivedNotifications: true,
        issuedNotifications: true,
        bookmarks: {
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userData) {
      throw new Error("User data not found");
    }

    // Remove sensitive information
    const exportData = {
      ...userData,
      passwordHash: undefined,
      sessions: undefined,
      EmailVerification: undefined,
    };

    return {
      success: true,
      data: exportData,
      message: "Data exported successfully",
    };
  } catch (error) {
    console.error("Error exporting user data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export data",
    };
  }
}
