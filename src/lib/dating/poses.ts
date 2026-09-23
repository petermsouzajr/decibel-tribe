export type PoseId =
  | "peace"
  | "thumb"
  | "chin"
  | "ear"
  | "palm"
  | "point"
  | "forehead"
  | "fist"
  | "head"
  | "ok";

export type PosePrompt = {
  id: PoseId;
  label: string;
  instruction: string;
};

export const POSE_PROMPTS: PosePrompt[] = [
  { id: "peace", label: "Peace sign", instruction: "Hold a peace sign beside your cheek." },
  { id: "thumb", label: "Thumb up", instruction: "Hold a thumb up beside your cheek." },
  { id: "chin", label: "Hand under chin", instruction: "Rest your hand under your chin." },
  { id: "ear", label: "Touch your ear", instruction: "Touch one ear with your fingers." },
  { id: "palm", label: "Open palm", instruction: "Hold an open palm beside your cheek." },
  { id: "point", label: "Point", instruction: "Point at your cheek." },
  { id: "forehead", label: "Forehead", instruction: "Put two fingers on your forehead." },
  { id: "fist", label: "Fist under chin", instruction: "Hold a fist under your chin." },
  { id: "head", label: "Hand on head", instruction: "Rest your hand on top of your head." },
  { id: "ok", label: "OK sign", instruction: "Hold an OK sign beside your cheek." },
];

export const POSE_SECONDS = 30;
export const ATTEMPT_SECONDS = 120;
export const MAX_ATTEMPTS_PER_DAY = 5;
export const MIN_PROFILE_PHOTOS = 3;

export function pickPoses(count = 3, random: () => number = Math.random): PosePrompt[] {
  const pool = [...POSE_PROMPTS];
  const chosen: PosePrompt[] = [];
  while (chosen.length < count && pool.length) {
    const index = Math.floor(random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
}

export function poseById(id: string): PosePrompt | undefined {
  return POSE_PROMPTS.find((pose) => pose.id === id);
}
