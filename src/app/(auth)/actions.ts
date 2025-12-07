"use server";

import {
  lucia as defaultLucia,
  validateRequest as defaultValidateRequest,
} from "@/auth";
import { cookies as defaultCookies } from "next/headers";
import { redirect as defaultRedirect } from "next/navigation";

export async function logout(dependencies?: {
  lucia?: typeof defaultLucia;
  validateRequest?: typeof defaultValidateRequest;
  cookies?: typeof defaultCookies;
  redirect?: typeof defaultRedirect;
}) {
  const {
    lucia = defaultLucia,
    validateRequest = defaultValidateRequest,
    cookies = defaultCookies,
    redirect = defaultRedirect,
  } = dependencies || {};

  const { session } = await validateRequest();

  if (!session) {
    throw new Error("Unauthorized");
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();

  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return redirect("/login");
}
