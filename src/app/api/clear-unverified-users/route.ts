import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Ensure authorization header is correct
    const authHeader = req.headers.get("Authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Find users who are not verified and were created more than two weeks ago
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        isVerified: false, // Assuming isVerified tracks email verification status
        googleId: null, // User has no Google ID
        createdAt: {
          lte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // Two weeks ago
        },
      },
      select: {
        id: true, // Only select what you need for deletion
      },
    });

    // Delete unverified users
    if (unverifiedUsers.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: unverifiedUsers.map((user) => user.id),
          },
        },
      });
    }

    // // Return a success response
    // return new Response(
    //   JSON.stringify({
    //     message: `${unverifiedUsers.length} unverified user(s) deleted.`,
    //   }),
    //   { status: 200 },
    // );
    ////////end cron1
    // const authHeader = req.headers.get("Authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const expiredVerifications = await prisma.emailVerification.findMany({
      where: {
        expiresAt: {
          lte: new Date(), // Expiration date is before the current date
        },
      },
      select: {
        id: true, // Only select what you need for deletion
      },
    });

    if (expiredVerifications.length > 0) {
      await prisma.emailVerification.deleteMany({
        where: {
          id: {
            in: expiredVerifications.map((verifications) => verifications.id),
          },
        },
      });
    }

    return new Response(
      JSON.stringify({
        message: `${expiredVerifications.length} expired verification token(s) and ${unverifiedUsers.length} unverified user(s) deleted..`,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting unverified users:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
