/**
 * Value normalization utilities for dating preferences
 * 
 * These functions convert between UI format (user-friendly display) and DB format (consistent storage)
 * 
 * DB Format Benefits:
 * - Consistent storage format
 * - No normalization needed during matching
 * - Easier to query and maintain
 */

// UI to DB conversion functions
export function normalizeEducationToDB(uiValue: string): string {
  const mapping: Record<string, string> = {
    "High School": "high_school",
    "Some College": "some_college",
    "Bachelor's": "bachelors",
    "Master's": "masters",
    "PhD": "phd",
    "Professional": "professional",
  };
  return mapping[uiValue] || uiValue.toLowerCase().replace(/\s+/g, "_").replace(/'/g, "");
}

export function normalizeEducationArrayToDB(uiValues: string[]): string[] {
  return uiValues.map(normalizeEducationToDB);
}

export function normalizeRelationshipTypeToDB(uiValue: string): string {
  const mapping: Record<string, string> = {
    "Monogamous": "monogamous",
    "Open Relationship": "ethical_non_monogamous",
    "Casual Dating": "open_to_both",
    "Friends with Benefits": "open_to_both",
    "Long-term Relationship": "monogamous",
    "Short-term Fun": "open_to_both",
    "Not Sure Yet": "open_to_both",
  };
  return mapping[uiValue] || uiValue.toLowerCase().replace(/\s+/g, "_");
}

export function normalizeRelationshipTypeArrayToDB(uiValues: string[]): string[] {
  return uiValues.map(normalizeRelationshipTypeToDB);
}

export function normalizeValueToDB(uiValue: string): string {
  return uiValue.toLowerCase().trim();
}

export function normalizeValueArrayToDB(uiValues: string[]): string[] {
  return uiValues.map(normalizeValueToDB);
}

// DB to UI conversion functions (for display)
export function normalizeEducationToUI(dbValue: string): string {
  const mapping: Record<string, string> = {
    "high_school": "High School",
    "some_college": "Some College",
    "bachelors": "Bachelor's",
    "masters": "Master's",
    "phd": "PhD",
    "professional": "Professional",
  };
  return mapping[dbValue] || dbValue;
}

export function normalizeEducationArrayToUI(dbValues: string[]): string[] {
  return dbValues.map(normalizeEducationToUI);
}

export function normalizeRelationshipTypeToUI(dbValue: string): string {
  const mapping: Record<string, string> = {
    "monogamous": "Monogamous",
    "ethical_non_monogamous": "Open Relationship",
    "open_to_both": "Casual Dating",
  };
  // If not in mapping, try to format it nicely
  if (!mapping[dbValue]) {
    return dbValue
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  return mapping[dbValue];
}

export function normalizeRelationshipTypeArrayToUI(dbValues: string[]): string[] {
  return dbValues.map(normalizeRelationshipTypeToUI);
}

export function normalizeValueToUI(dbValue: string): string {
  // Capitalize first letter of each word
  return dbValue
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeValueArrayToUI(dbValues: string[]): string[] {
  return dbValues.map(normalizeValueToUI);
}
