export interface StyleProfile {
  styleDescriptors: string[];
  weeklyLifestyle: string[];
  wardrobeGap: string;
  completedAt: string;
}

const STORAGE_KEY = "drape_style_profile";

export function getStyleProfile(): StyleProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StyleProfile) : null;
  } catch {
    return null;
  }
}

export function saveStyleProfile(
  profile: Omit<StyleProfile, "completedAt">
): StyleProfile {
  const full: StyleProfile = {
    ...profile,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  return full;
}

export function hasCompletedOnboarding(): boolean {
  return getStyleProfile() !== null;
}

/** Format for injection into the LLM prompt */
export function formatStyleProfileForPrompt(profile: StyleProfile): string {
  const parts: string[] = [];
  if (profile.styleDescriptors.length > 0) {
    parts.push(`Style: ${profile.styleDescriptors.join(", ")}`);
  }
  if (profile.weeklyLifestyle.length > 0) {
    parts.push(`Lifestyle: ${profile.weeklyLifestyle.join(", ")}`);
  }
  if (profile.wardrobeGap) {
    parts.push(`Wardrobe gap: ${profile.wardrobeGap}`);
  }
  return parts.join(" | ");
}
