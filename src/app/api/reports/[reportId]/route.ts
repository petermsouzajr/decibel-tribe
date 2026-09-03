import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { Prisma, ReportStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ reportId: string }> },
) {
  const params = await props.params;
  try {
    await requireAdmin();
    const body = await req.json();
    const { status, adminNotes } = body || {};

    if (!status && !adminNotes) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const data: Prisma.ReportUpdateInput = {
      adminNotes: adminNotes ?? undefined,
    };
    if (status) {
      data.status = status as ReportStatus;
      data.resolvedAt = new Date();
    }

    const updated = await prisma.report.update({
      where: { id: params.reportId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating report:", error);
    return serverError();
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ reportId: string }> },
) {
  // Support form submissions using method override
  const method = req.nextUrl.searchParams.get("_method");
  if (method === "PATCH") {
    const formData = await req.formData();
    const status = formData.get("status") as string | null;
    const adminNotes = formData.get("adminNotes") as string | null;
    const body = JSON.stringify({ status, adminNotes });
    const patched = new NextRequest(req.url, { method: "PATCH", body });
    return PATCH(patched, ctx as any);
  }
  return NextResponse.json({ error: "Unsupported" }, { status: 405 });
}
