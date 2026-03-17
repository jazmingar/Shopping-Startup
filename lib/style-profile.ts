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

const INDUSTRY_KEY = "drape_user_industry";

const INDUSTRY_SIGNALS = [
  "finance", "banking", "law", "legal", "consulting", "corporate",
  "tech", "startup", "software", "engineering", "creative", "design",
  "media", "marketing", "medical", "healthcare", "education", "retail",
  "hospitality", "government",
];

/** Extract an industry mention from a free-text message, if any. */
export function extractIndustryFromMessage(message: string): string | null {
  const lower = message.toLowerCase();
  const found = INDUSTRY_SIGNALS.find((sig) => lower.includes(sig));
  return found ?? null;
}

export function getSavedIndustry(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(INDUSTRY_KEY) ?? undefined;
}

export function saveIndustry(industry: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INDUSTRY_KEY, industry);
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
    parts.push(`Style focus: ${profile.wardrobeGap}`);
  }
  return parts.join(" | ");
}
