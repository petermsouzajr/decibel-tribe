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
        message: `${expiredVerifications.length} expired verification token(s) deleted.`,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting expired verification tokens:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
