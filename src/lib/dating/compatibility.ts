/**
 * Calculate music compatibility score between two users
 * Returns a score from 0-100 based on instrument and skill overlap
 */
export function calculateMusicCompatibility(
  user1Instruments: string[],
  user1Skills: string[],
  user2Instruments: string[],
  user2Skills: string[],
): number {
  if (
    user1Instruments.length === 0 &&
    user1Skills.length === 0 &&
    user2Instruments.length === 0 &&
    user2Skills.length === 0
  ) {
    return 50; // Neutral score if neither user has music data
  }

  // Calculate instrument overlap
  const instrumentOverlap = calculateOverlap(
    user1Instruments,
    user2Instruments,
  );
  const instrumentScore = instrumentOverlap * 50; // 50% weight for instruments

  // Calculate skill overlap
  const skillOverlap = calculateOverlap(user1Skills, user2Skills);
  const skillScore = skillOverlap * 50; // 50% weight for skills

  // Total score (0-100)
  const totalScore = instrumentScore + skillScore;

  return Math.round(totalScore);
}

/**
 * Calculate overlap percentage between two arrays
 * Returns 0-1 (0 = no overlap, 1 = perfect overlap)
 */
function calculateOverlap(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 0.5; // Neutral if both empty
  if (arr1.length === 0 || arr2.length === 0) return 0; // No overlap if one is empty

  const set1 = new Set(arr1.map((item) => item.toLowerCase()));
  const set2 = new Set(arr2.map((item) => item.toLowerCase()));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  // Jaccard similarity coefficient
  return intersection.size / union.size;
}

/**
 * Calculate overall compatibility score
 * Factors:
 * - Music compatibility (40% if enabled, 0% if disabled)
 * - Profile completeness (20%)
 * - Activity level (15%)
 * - Distance (15%)
 * - Mutual connections (10%)
 */
export function calculateOverallCompatibility(
  musicScore: number,
  profileCompleteness: number,
  activityLevel: number,
  distanceScore: number,
  mutualConnections: number,
  matchMusicTastes: boolean,
): number {
  const weights = matchMusicTastes
    ? {
        music: 0.4,
        profile: 0.2,
        activity: 0.15,
        distance: 0.15,
        connections: 0.1,
      }
    : {
        music: 0,
        profile: 0.3,
        activity: 0.25,
        distance: 0.25,
        connections: 0.2,
      };

  const totalScore =
    musicScore * weights.music +
    profileCompleteness * weights.profile +
    activityLevel * weights.activity +
    distanceScore * weights.distance +
    Math.min(mutualConnections * 10, 100) * weights.connections;

  return Math.round(totalScore);
}

/**
 * Calculate profile completeness score (0-100)
 */
export function calculateProfileCompleteness(profile: {
  bio?: string | null;
  age?: number | null;
  height?: number | null;
  gender?: string | null;
  location?: string | null;
  photos?: number;
}): number {
  let score = 0;
  let maxScore = 0;

  // Bio (20 points)
  maxScore += 20;
  if (profile.bio && profile.bio.trim().length > 0) {
    score += 20;
  }

  // Age (15 points)
  maxScore += 15;
  if (profile.age && profile.age >= 18) {
    score += 15;
  }

  // Height (15 points)
  maxScore += 15;
  if (profile.height && profile.height >= 12) {
    score += 15;
  }

  // Gender (15 points)
  maxScore += 15;
  if (profile.gender) {
    score += 15;
  }

  // Location (15 points)
  maxScore += 15;
  if (profile.location && profile.location.trim().length > 0) {
    score += 15;
  }

  // Photos (20 points - at least 1 required)
  maxScore += 20;
  if (profile.photos && profile.photos >= 1) {
    score += Math.min(20, profile.photos * 4); // Up to 5 photos = 20 points
  }

  return Math.round((score / maxScore) * 100);
}

/**
 * Calculate activity level score (0-100)
 * Based on recent posts, likes, comments, etc.
 */
export function calculateActivityLevel(
  postCount: number,
  recentActivityDays: number = 30,
): number {
  // Normalize to 0-100 scale
  // Active users: 10+ posts in last 30 days = 100
  const normalized = Math.min((postCount / 10) * 100, 100);
  return Math.round(normalized);
}

/**
 * Calculate distance score (0-100)
 * Closer = higher score
 */
export function calculateDistanceScore(
  distanceKm: number | null,
  maxDistanceKm: number,
): number {
  if (distanceKm === null) return 50; // Neutral if no distance data

  // Closer = higher score
  // At max distance = 50, at 0 distance = 100
  const score = 100 - (distanceKm / maxDistanceKm) * 50;
  return Math.max(0, Math.round(score));
}













