import "server-only";

export async function geocodeZipCode(zipCode: string): Promise<{ lat: number; lon: number; city?: string } | null> {
  const normalized = String(zipCode || "").trim();
  if (!normalized) return null;

  // OpenStreetMap Nominatim (same approach used in dating routes)
  const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(
    normalized,
  )}&countrycodes=us&limit=1`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DecibelTribe/1.0 (support@decibeltribe.com)",
        Accept: "application/json",
      },
      cache: "no-store",
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return null;
    const data = (await res.json()) as Array<any>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0];
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const displayName = typeof first.display_name === "string" ? first.display_name : undefined;
    const city = displayName ? displayName.split(",")[0]?.trim() : undefined;
    return { lat, lon, city };
  } catch {
    return null;
  }
}


