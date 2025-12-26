import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Google } from "arctic";
import { Lucia, Session, User } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "./lib/prisma";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(databaseUserAttributes) {
    return {
      id: databaseUserAttributes.id,
      username: databaseUserAttributes.username,
      displayName: databaseUserAttributes.displayName,
      avatarUrl: databaseUserAttributes.avatarUrl,
      googleId: databaseUserAttributes.googleId,
      isDatingActive: databaseUserAttributes.isDatingActive,
      isAdmin: databaseUserAttributes.isAdmin,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
  isDatingActive: boolean;
  isAdmin: boolean;
}

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`,
);

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    let result:
      | { user: User; session: Session }
      | { user: null; session: null };
    try {
      result = await lucia.validateSession(sessionId);
    } catch (error) {
      console.error("Error validating session:", error);
      // IMPORTANT (Next.js App Router):
      // Server Components (layouts/sidebars) cannot mutate cookies.
      // Cookie clearing/refresh must happen in a Route Handler or Server Action.
      return {
        user: null,
        session: null,
      };
    }

    // No cookie mutation here by design.
    // Use `validateRequestWithCookieMutation()` from Route Handlers / Server Actions
    // (or call the /api/auth/session endpoint) to refresh/clear cookies.

    return result;
  },
);

/**
 * Variant for Route Handlers / Server Actions where cookie mutation is allowed.
 * Use this if you need to refresh/clear the session cookie without dev overlay errors.
 */
export async function validateRequestWithCookieMutation(): Promise<
  { user: User; session: Session } | { user: null; session: null }
> {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return { user: null, session: null };
  }

  try {
    const result = await lucia.validateSession(sessionId);

      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }

      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
    }

    return result;
  } catch (error) {
    console.error("Error validating session:", error);
    // Clear potentially invalid cookie
    const sessionCookie = lucia.createBlankSessionCookie();
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
);
    return { user: null, session: null };
  }
}
