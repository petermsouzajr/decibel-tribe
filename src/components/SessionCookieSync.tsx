"use client";

import { useEffect } from "react";

/**
 * Calls a Route Handler that is allowed to refresh/clear cookies.
 * This prevents dev-overlay errors from cookie mutation attempts inside Server Components.
 */
export default function SessionCookieSync() {
  useEffect(() => {
    // Best-effort: don't block rendering, ignore failures.
    void fetch("/api/auth/session", {
      method: "POST",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  return null;
}

