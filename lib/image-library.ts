// lib/image-library.ts
// Week 6: Tag-based image cache + matching logic
//
// HOW TO ADD YOUR OWN IMAGES:
// 1. Add the image URL (local /public/lookbook/v1/ or CDN) to IMAGE_LIBRARY below
// 2. Fill in the tags — outfit-level descriptors, not individual pieces
// 3. Optional: set `slot: 1 | 2 | 3` to pin to a specific look option
//
// The LLM outputs an imageHint per slot (clothingType + aesthetic + colorStory).
// getImageForSlot() uses that hint to find the best match in the library.

import type { Intent, ImageHint } from "@/lib/intent-structures";

// ============================================
// TAG SCHEMA
// ============================================

export type Climate = "cold" | "mild" | "warm";

export type ClothingType =
  | "dress"        // full-length or midi dress, worn alone
  | "top-bottom"   // separate top + trouser/skirt combo
  | "coat-look"    // coat or jacket as the hero piece over an outfit
  | "set"          // matching two-piece
  | "suit"         // tailored suit (same fabric blazer + trouser)
  | "jumpsuit";    // one-piece

export type Aesthetic =
  | "minimal"
  | "classic"
  | "edgy"
  | "romantic"
  | "maximalist"
  | "bohemian";

export type ColorStory =
  | "monochromatic"  // head-to-toe one color (e.g. all-black, all-cream)
  | "neutral-tones"  // mixed neutrals (chocolate, camel, ivory, beige)
  | "bold-color"     // one or more saturated statement colors
  | "mixed";         // pattern, print, or color contrast

export interface ImageTag {
  occasion: Intent;
  clothingType: ClothingType;
  climate: Climate;
  aesthetic: Aesthetic;
  colorStory: ColorStory;
  // Optional: pin to a specific slot guidance profile
  slot?: 1 | 2 | 3;
  // Optional: city this skews toward
  cityStyle?: string;
  season?: "spring" | "summer" | "fall" | "winter";
}

export interface LookbookImage {
  id: string;
  url: string;
  alt: string;
  tags: ImageTag;
  version: string; // bump to "v2" etc. when replacing with AI-generated images
}

// ============================================
// IMAGE LIBRARY
// v1: curated Unsplash placeholders
// Replace any URL with your own image — keep the tags accurate
// ============================================

export const IMAGE_LIBRARY: LookbookImage[] = [

  // ---- DATE ----
  {
    id: "date-mild-topbottom-edgy-mono",
    url: "/lookbook/v1/date-all-black-leather-skirt.jpg",
    alt: "All black date night look with leather skirt",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "edgy", colorStory: "monochromatic" },
    version: "v1",
  },
  {
    id: "date-mild-topbottom-romantic-neutral-champagne",
    url: "/lookbook/v1/date-jeans-champagne-top.jpg",
    alt: "Jeans + backless silk champagne top — date",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "romantic", colorStory: "neutral-tones" },
    version: "v1",
  },
  {
    id: "date-mild-topbottom-minimal-neutral-bodysuit",
    url: "/lookbook/v1/date-jeans-bodysuit.jpg",
    alt: "Jeans + bodysuit — date night",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "minimal", colorStory: "neutral-tones" },
    version: "v1",
  },
  {
    id: "date-mild-topbottom-romantic-neutral-sheer",
    url: "/lookbook/v1/date-jeans-sheer-top.jpg",
    alt: "Jeans + sheer off shoulder top — date",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "romantic", colorStory: "neutral-tones" },
    version: "v1",
  },
  {
    id: "date-mild-coatlook-edgy-mono-leather",
    url: "/lookbook/v1/date-leather-pants.jpg",
    alt: "Leather pants + jacket + bodysuit — date night",
    tags: { occasion: "date", clothingType: "coat-look", climate: "mild", aesthetic: "edgy", colorStory: "monochromatic" },
    version: "v1",
  },
  {
    id: "date-mild-dress-romantic-neutral-maxi",
    url: "/lookbook/v1/date-maxi-dress.jpg",
    alt: "Maxi dress — date night",
    tags: { occasion: "date", clothingType: "dress", climate: "mild", aesthetic: "romantic", colorStory: "neutral-tones" },
    version: "v1",
  },
  {
    id: "date-mild-dress-minimal-neutral-slip",
    url: "/lookbook/v1/date-slip-dress.jpg",
    alt: "Slip dress — date night",
    tags: { occasion: "date", clothingType: "dress", climate: "mild", aesthetic: "minimal", colorStory: "neutral-tones" },
    version: "v1",
  },

  // ---- DATE (new batch) ----
  {
    id: "date-mild-topbottom-edgy-mono-leather-skirt",
    url: "/lookbook/v1/date-leather-skirt-knee-highs.jpg",
    alt: "Black bodysuit + patent leather mini skirt + knee-high boots",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "edgy", colorStory: "monochromatic" },
    version: "v1",
  },
  {
    id: "date-mild-topbottom-edgy-mono-offshoulder",
    url: "/lookbook/v1/date-offshoulder-dark-jeans.jpg",
    alt: "Black off-shoulder top + dark grey jeans + ankle boots",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "edgy", colorStory: "monochromatic" },
    version: "v1",
  },
  {
    id: "date-mild-dress-romantic-bold-mint-slip",
    url: "/lookbook/v1/mint-lace-slip-dress.jpg",
    alt: "Mint lace slip dress + ivory heels",
    tags: { occasion: "date", clothingType: "dress", climate: "mild", aesthetic: "romantic", colorStory: "bold-color" },
    version: "v1",
  },
  {
    id: "date-mild-topbottom-edgy-mixed-asymmetric",
    url: "/lookbook/v1/date-asymmetric-top-flare-jeans.jpg",
    alt: "Black asymmetric draped top + blue flare jeans",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "edgy", colorStory: "mixed" },
    version: "v1",
  },
  {
    id: "date-mild-topbottom-romantic-mixed-brown-ruffle",
    url: "/lookbook/v1/date-brown-ruffle-flare-jeans.jpg",
    alt: "Brown ruffle crop top + blue flare jeans + brown slingbacks",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "romantic", colorStory: "mixed" },
    version: "v1",
  },
  {
    id: "date-mild-topbottom-romantic-mixed-lace-top",
    url: "/lookbook/v1/date-lace-top-flare-jeans.jpg",
    alt: "Black lace top + blue flare jeans + lace slingbacks",
    tags: { occasion: "date", clothingType: "top-bottom", climate: "mild", aesthetic: "romantic", colorStory: "mixed" },
    version: "v1",
  },

  // ---- SOCIAL ----
  {
    id: "social-mild-topbottom-edgy-mono-allblack",
    url: "/lookbook/v1/date-all-black-leather-skirt.jpg",
    alt: "All black leather skirt look — night out",
    tags: { occasion: "social", clothingType: "top-bottom", climate: "mild", aesthetic: "edgy", colorStory: "monochromatic" },
    version: "v1",
  },
  {
    id: "social-mild-topbottom-romantic-neutral-champagne",
    url: "/lookbook/v1/date-jeans-champagne-top.jpg",
    alt: "Jeans + backless silk champagne top — social",
    tags: { occasion: "social", clothingType: "top-bottom", climate: "mild", aesthetic: "romantic", colorStory: "neutral-tones" },
    version: "v1",
  },
  {
    id: "social-mild-topbottom-minimal-neutral-bodysuit",
    url: "/lookbook/v1/date-jeans-bodysuit.jpg",
    alt: "Jeans + bodysuit — social",
    tags: { occasion: "social", clothingType: "top-bottom", climate: "mild", aesthetic: "minimal", colorStory: "neutral-tones" },
    version: "v1",
  },
  {
    id: "social-mild-coatlook-edgy-mono-leather",
    url: "/lookbook/v1/date-leather-pants.jpg",
    alt: "Leather pants + jacket + bodysuit — social night out",
    tags: { occasion: "social", clothingType: "coat-look", climate: "mild", aesthetic: "edgy", colorStory: "monochromatic" },
    version: "v1",
  },
  {
    id: "social-mild-topbottom-edgy-mixed-asymmetric",
    url: "/lookbook/v1/date-asymmetric-top-flare-jeans.jpg",
    alt: "Black asymmetric draped top + blue flare jeans — social",
    tags: { occasion: "social", clothingType: "top-bottom", climate: "mild", aesthetic: "edgy", colorStory: "mixed" },
    version: "v1",
  },
  {
    id: "social-mild-topbottom-romantic-mixed-brown-ruffle",
    url: "/lookbook/v1/date-brown-ruffle-flare-jeans.jpg",
    alt: "Brown ruffle crop top + blue flare jeans — social",
    tags: { occasion: "social", clothingType: "top-bottom", climate: "mild", aesthetic: "romantic", colorStory: "mixed" },
    version: "v1",
  },
  {
    id: "social-mild-topbottom-romantic-mixed-lace-top",
    url: "/lookbook/v1/date-lace-top-flare-jeans.jpg",
    alt: "Black lace top + blue flare jeans — night out",
    tags: { occasion: "social", clothingType: "top-bottom", climate: "mild", aesthetic: "romantic", colorStory: "mixed" },
    version: "v1",
  },
  {
    id: "social-mild-dress-romantic-bold-mint-slip",
    url: "/lookbook/v1/mint-lace-slip-dress.jpg",
    alt: "Mint lace slip dress + ivory heels — dinner, social",
    tags: { occasion: "social", clothingType: "dress", climate: "mild", aesthetic: "romantic", colorStory: "bold-color" },
    version: "v1",
  },

  // ---- PROFESSIONAL ----
  {
    id: "pro-mild-topbottom-classic-mixed-blueblouse",
    url: "/lookbook/v1/work-blue-blouse-pinstripe.jpg",
    alt: "Blue blouse + pinstriped pants — work",
    tags: { occasion: "professional", clothingType: "top-bottom", climate: "mild", aesthetic: "classic", colorStory: "mixed" },
    version: "v1",
  },
  {
    id: "pro-mild-topbottom-classic-mono-brown",
    url: "/lookbook/v1/work-bow-blouse-brown.jpg",
    alt: "Bow blouse + monochromatic brown — work",
    tags: { occasion: "professional", clothingType: "top-bottom", climate: "mild", aesthetic: "classic", colorStory: "monochromatic" },
    version: "v1",
  },
  {
    id: "pro-mild-coatlook-minimal-mono-grey",
    url: "/lookbook/v1/work-grey-blazer.jpg",
    alt: "Grey blazer + monochromatic — work",
    tags: { occasion: "professional", clothingType: "coat-look", climate: "mild", aesthetic: "minimal", colorStory: "monochromatic" },
    version: "v1",
  },
  {
    id: "pro-mild-topbottom-minimal-neutral-jeans",
    url: "/lookbook/v1/work-jeans-white-shirt.jpg",
    alt: "Jeans + white button down — casual work",
    tags: { occasion: "professional", clothingType: "top-bottom", climate: "mild", aesthetic: "minimal", colorStory: "neutral-tones" },
    version: "v1",
  },
  {
    id: "pro-mild-dress-minimal-neutral-polo",
    url: "/lookbook/v1/work-knit-polo-dress.jpg",
    alt: "Knit polo dress — work",
    tags: { occasion: "professional", clothingType: "dress", climate: "mild", aesthetic: "minimal", colorStory: "neutral-tones" },
    version: "v1",
  },
  {
    id: "pro-mild-topbottom-minimal-mono",
    url: "/lookbook/v1/work-monochromatic.jpg",
    alt: "Monochromatic work look",
    tags: { occasion: "professional", clothingType: "top-bottom", climate: "mild", aesthetic: "minimal", colorStory: "monochromatic" },
    version: "v1",
  },
];

// ============================================
// CLIMATE INFERENCE
// ============================================

const WARM_CITIES = ["miami", "dubai", "singapore", "los angeles", "la"];
const MILD_CITIES = ["spain", "mexico city", "cdmx", "tokyo", "paris"];
const COLD_CITIES = ["new york", "nyc", "london", "milan", "copenhagen", "chicago"];

function inferClimate(location?: string | null): Climate {
  const loc = (location || "").toLowerCase();

  if (WARM_CITIES.some((c) => loc.includes(c))) return "warm";
  if (MILD_CITIES.some((c) => loc.includes(c))) {
    const month = new Date().getMonth();
    if (month >= 11 || month <= 1) return "cold";
    return "mild";
  }
  if (COLD_CITIES.some((c) => loc.includes(c))) {
    const month = new Date().getMonth();
    if (month >= 11 || month <= 3) return "cold";
    if (month >= 4 && month <= 9) return "mild";
    return "cold";
  }

  // Default: season-based
  const month = new Date().getMonth();
  if (month >= 11 || month <= 1) return "cold";
  if (month >= 2 && month <= 9) return "mild";
  return "cold";
}

// ============================================
// SCORING
// ============================================

function scoreImage(
  img: LookbookImage,
  intent: Intent,
  targetSlot: 1 | 2 | 3 | undefined,
  climate: Climate,
  hint: Partial<ImageHint>,
  location?: string | null
): number {
  if (img.tags.occasion !== intent) return -1; // hard filter

  let score = 0;

  // Slot pin — highest priority
  if (targetSlot !== undefined && img.tags.slot === targetSlot) score += 5;

  // Climate match
  const climateOrder: Climate[] = ["cold", "mild", "warm"];
  const diff = Math.abs(climateOrder.indexOf(img.tags.climate) - climateOrder.indexOf(climate));
  if (diff === 0) score += 4;
  else if (diff === 1) score += 1;

  // LLM hint matching
  if (hint.clothingType && img.tags.clothingType === hint.clothingType) score += 3;
  if (hint.aesthetic && img.tags.aesthetic === hint.aesthetic) score += 2;
  if (hint.colorStory && img.tags.colorStory === hint.colorStory) score += 2;

  // City style bonus
  if (location && img.tags.cityStyle) {
    const loc = location.toLowerCase().replace(/\s+/g, "-");
    if (loc.includes(img.tags.cityStyle) || img.tags.cityStyle.includes(loc)) score += 1;
  }

  return score;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Find the best-matching image URL for a single slot.
 * Uses the LLM's imageHint for precise matching.
 * Returns an empty string if no match is found.
 */
export function getImageForSlot(
  intent: Intent,
  location: string | null | undefined,
  slot: 1 | 2 | 3,
  hint?: Partial<ImageHint>
): string {
  const climate = inferClimate(location);

  const scored = IMAGE_LIBRARY
    .map((img) => ({
      img,
      score: scoreImage(img, intent, slot, climate, hint ?? {}, location),
    }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.img.id.localeCompare(b.img.id);
    });

  // Only return an image if it meets a minimum confidence threshold.
  // Score 8 = climate match (4) + clothingType match (3) + aesthetic or colorStory match (1+).
  // Below this, the image won't match the text well enough to show.
  const MIN_SCORE = 8;
  const best = scored[0];
  if (!best || best.score < MIN_SCORE) return "";
  return best.img.url;
}
