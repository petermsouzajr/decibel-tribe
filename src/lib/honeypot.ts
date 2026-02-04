export const honeypotFields = ["website", "url", "phone"];

export function validateHoneypot(
    data: Record<string, any>,
): { error: string } | null {
    for (const field of honeypotFields) {
        const value = data[field];
        if (value && String(value).trim().length > 0) {
            return { error: "Spam detected" };
        }
    }

    // Time validation
    // We expect formLoadedAt to be passed in data
    const formLoadedAt = data.formLoadedAt;
    if (formLoadedAt) {
        const loadedAt = Number(formLoadedAt);
        const now = Date.now();
        // If the form was submitted too quickly (e.g., less than 2 seconds)
        if (now - loadedAt < 2000) {
            return { error: "Please wait a moment before submitting" };
        }
        // If the timestamp is from the future (sanity check)
        if (loadedAt > now) {
            return { error: "Invalid form submission time" };
        }
    }

    return null;
}
