export type GrokVerdict = {
  samePersonAcrossPoses: boolean;
  posesMatched: boolean[];
  samePersonAsProfile: boolean;
};

export function parseGrokVerdict(text: string, poseCount: number): GrokVerdict | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const poses = Array.isArray(parsed.posesMatched) ? parsed.posesMatched.map((value) => value === true) : [];
  if (poses.length !== poseCount) return null;
  return {
    samePersonAcrossPoses: parsed.samePersonAcrossPoses === true,
    posesMatched: poses,
    samePersonAsProfile: parsed.samePersonAsProfile === true,
  };
}

export function verdictPasses(verdict: GrokVerdict): boolean {
  return (
    verdict.samePersonAcrossPoses &&
    verdict.samePersonAsProfile &&
    verdict.posesMatched.every(Boolean)
  );
}

type ImagePart = { label: string; base64: string; mediaType: string };

export async function judgePosesWithGrok(input: {
  apiKey: string;
  model: string;
  poses: ImagePart[];
  profiles: ImagePart[];
}): Promise<GrokVerdict> {
  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: [
        "You check dating-profile photos. Reply with JSON only:",
        '{"samePersonAcrossPoses":boolean,"posesMatched":boolean[],"samePersonAsProfile":boolean}',
        "posesMatched must have one boolean per pose photo, in the order shown.",
        "samePersonAcrossPoses is true only if every pose photo is the same real person.",
        "A pose matches only if the face is visible and the described hand pose is present.",
        "samePersonAsProfile is true only if that person is the person in the profile photos.",
        "If you are unsure, answer false.",
      ].join(" "),
    },
  ];

  input.poses.forEach((pose, index) => {
    content.push({ type: "text", text: `Pose photo ${index + 1}: ${pose.label}` });
    content.push({
      type: "image_url",
      image_url: { url: `data:${pose.mediaType};base64,${pose.base64}` },
    });
  });
  input.profiles.forEach((photo, index) => {
    content.push({ type: "text", text: `Profile photo ${index + 1}` });
    content.push({
      type: "image_url",
      image_url: { url: `data:${photo.mediaType};base64,${photo.base64}` },
    });
  });

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Grok vision failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content ?? "";
  const verdict = parseGrokVerdict(text, input.poses.length);
  if (!verdict) {
    throw new Error("Grok did not return a verification result.");
  }
  return verdict;
}
