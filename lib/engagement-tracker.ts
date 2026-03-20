const STORAGE_KEY = "drape_engagement";

export type JourneyStage = "discovering" | "exploring" | "developing" | "confident";

export interface EngagementData {
  sessionCount: number;
  totalMessages: number;
  photoUploads: number;
  fashionTermsSeen: string[];
  lastSessionAt: string;
}

const FASHION_TERMS = [
  "bodysuit", "mockneck", "midi", "slip dress", "maxi", "mini skirt",
  "leather pants", "straight leg", "wide leg", "straight-leg", "wide-leg",
  "blazer", "turtleneck", "lace top", "knee highs", "knee-highs",
  "booties", "loafers", "kitten heels", "monochromatic", "silhouette",
  "proportion", "texture", "fitted", "oversized", "tailored", "capsule",
  "structured", "layered", "palette", "trousers", "bodycon", "wrap dress",
  "cut out", "cutout", "sheer", "satin", "knit dress", "cargo", "cargos",
  "two piece", "two-piece", "co-ord", "coord",
];

function defaultData(): EngagementData {
  return {
    sessionCount: 0,
    totalMessages: 0,
    photoUploads: 0,
    fashionTermsSeen: [],
    lastSessionAt: new Date().toISOString(),
  };
}

export function getEngagementData(): EngagementData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EngagementData) : defaultData();
  } catch {
    return defaultData();
  }
}

function saveEngagementData(data: EngagementData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/** Call once per app load (after hydration). */
export function trackSession(): void {
  const data = getEngagementData();
  data.sessionCount += 1;
  data.lastSessionAt = new Date().toISOString();
  saveEngagementData(data);
}

/** Call on every user message send. */
export function trackMessage(userText: string, hasImage: boolean): void {
  const data = getEngagementData();
  data.totalMessages += 1;
  if (hasImage) data.photoUploads += 1;

  const lower = userText.toLowerCase();
  for (const term of FASHION_TERMS) {
    if (lower.includes(term) && !data.fashionTermsSeen.includes(term)) {
      data.fashionTermsSeen.push(term);
    }
  }

  saveEngagementData(data);
}

/**
 * Score-based journey stage.
 *
 * Score components:
 *   sessions:      min(sessionCount, 6) × 1     → max 6
 *   messages:      min(floor(totalMessages/5),4) → max 4
 *   photos:        min(photoUploads, 3) × 2      → max 6
 *   vocabulary:    min(fashionTermsSeen, 5) × 1  → max 5
 *
 * Thresholds:
 *   0–3  → discovering
 *   4–8  → exploring
 *   9–14 → developing
 *   15+  → confident
 */
export function computeJourneyStage(data?: EngagementData): JourneyStage {
  const d = data ?? getEngagementData();
  const score =
    Math.min(d.sessionCount, 6) +
    Math.min(Math.floor(d.totalMessages / 5), 4) +
    Math.min(d.photoUploads, 3) * 2 +
    Math.min(d.fashionTermsSeen.length, 5);

  if (score >= 15) return "confident";
  if (score >= 9) return "developing";
  if (score >= 4) return "exploring";
  return "discovering";
}
