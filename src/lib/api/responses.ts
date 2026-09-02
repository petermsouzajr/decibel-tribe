import { NextResponse } from "next/server";

/**
 * Standard API error responses.
 *
 * These exist so the wire format is defined once. Before this, 98 call sites
 * spelled out the 500 body by hand and two of them drifted to
 * "Internal Server Error", giving clients two different strings for one
 * condition.
 */

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
