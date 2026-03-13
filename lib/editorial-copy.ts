// lib/editorial-copy.ts
// Week 7: Base editorial voice — persona-agnostic.
//
// HOW TO USE:
// - Edit the copy in EDITORIAL_COPY to lock in the product voice.
// - These examples are injected into the LLM prompt as few-shot references.
// - The persona layer (brutal-editor, hype-bestie, stealth-wealth) remixes tone on top.
//
// BRAND VOICE:
// - Direct, visual, specific. Write like a stylist who knows exactly what they want.
// - Describe the garment → styling → effect. In that order.
// - Use tactile vocabulary: satin, sculptural, matte, patent, ribbed, draped.
// - Avoid empty adjectives: beautiful, stunning, gorgeous, amazing, fussy.
// - One idea per sentence. No filler.

import type { Intent } from "@/lib/intent-structures";

export interface IntentEditorialCopy {
  /** 1–2 example intro creative briefs — mirrors what the LLM should output */
  introExamples: string[];
  /** 2–3 example look descriptions — mirrors the voice and sentence structure the LLM should use */
  lookExamples: string[];
}

export const EDITORIAL_COPY: Record<Intent, IntentEditorialCopy> = {

  // ---- DATE ----
  date: {
    introExamples: [
      "For a dinner date in the city, we are leaning into something sexy and magnetic. You want to feel like you, but dialed up.",
      "For a first date, we want confidence-forward looks in a palette that feels intentional.",
    ],
    lookExamples: [
      "Black mini skirt with a black bodysuit and knee-high black boots. One sculptural earring, a sleek bag. The monochrome keeps it modern and elevated.",
      "Jeans with a draped off-shoulder top. Patent leather mules, a small shoulder bag. The goal is a look that reads effortless but feels considered.",
      "A fluid satin slip in champagne or deep mocha. Strappy heels, a small clutch, and minimal jewelry.",
    ],
  },

  // ---- PROFESSIONAL ----
  professional: {
    introExamples: [
      "For a day full of meetings, we are building around polish and intention — tailored looks that feel modern and chic.",
      "For a full office day, we want something that reads executive. Elavated fabrics and a cohesive palette do a lot of the work here.",
    ],
    lookExamples: [
      "Straight-leg trousers with a clean tucked white button-down. Black loafer, structured bag. The proportions are classic but the details keep it modern.",
      "A knit midi dress — effortless to wear, entirely considered to look at. Minimal jewelry, booties or loafers.",
      "A wide-lapel blazer over a top with straight trousers. Try head-to-toe ivory or charcoal. The monochrome does the work.",
    ],
  },

  // ---- SOCIAL ----
  social: {
    introExamples: [
      "For dinner with the girls, we are looking for something with personality — a look that photographs well and is exciting to look at.",
      "For a night out, we want something that has an edge but stays wearable. This is the time to experiment with texture and silhouette, or to lean into a trend if it feels right.",
    ],
    lookExamples: [
      "Flared denim with an off-shoulder draped top in black. Kitten heel or boot, small structured bag. Effortless and elevated in the same breath.",
      "A lace top tucked into dark-wash wide-leg jeans. Lace mules, a baguette bag, gold accessories. The kind of look that works harder than it appears.",
      "Head-to-toe black — leather mini skirt, long-sleeve bodysuit, knee-high boots. One sculptural earring, a sleek bag. The monochrome keeps it modern and elevated.",
    ],
  },

  // ---- WEDDING / EVENT ----
  wedding_event: {
    introExamples: [
      "For the rehearsal dinner, we are pulling together something that is timeless and elevated, and a different fabric or silhouette from the wedding look.",
      "For the after-party, we want something that reads celebratory and fun, but still polished and chic.",
    ],
    lookExamples: [
      "A fluid midi in a warm ivory. Strappy heeled sandals, delicate jewelry. The goal is effortless elegance, not formality.",
      "A tea-length dress with one architectural detail — ruching, an asymmetric hem, a draped neckline. Something that reads intentional in photographs.",
      "For the bride: a slip dress in ivory or champagne satin. Simple, fluid, undeniable. Let the fabric and the moment do the work.",
    ],
  },

  // ---- TRAVEL ----
  travel: {
    introExamples: [
      "For a week in Europe, we are building a few looks for your days of sightseeing and nights out.",
      "For this trip, we'll plan looks for sightseeing and nights out. For sightseeing, we want something comfortable but still polished enough for photos. For dinners, we want to look chic and dress up the look with accessories.",
    ],
    lookExamples: [
      "Straight-leg denim, a fitted ribbed top, and a leather jacket that ties it together. White sneakers by day, a bootie by night. This is the backbone of the trip.",
      "A fluid midi wrap dress in a neutral print. It packs flat, recovers fast, and reads dressed-up with a heel or casual with a sandal.",
  
    ],
  },

  // ---- PREGNANCY ----
  pregnancy: {
    introExamples: [
      "For this stage, we are prioritizing silhouettes that move with your body — nothing restrictive with a focus on comfort and ease.",
      "We are looking for pieces that feel like you, just cut to accommodate. Confident, polished, and completely comfortable.",
    ],
    lookExamples: [
      "A ribbed wrap midi in a neutral tone — adjusts as your body changes and reads polished at every stage. Flat sandal or low heel, both work.",
      "A fitted empire-waist dress in stretch fabric. Simple, clean, lets the bump be the statement it is.",
      "Wide-leg trousers with an elastic waistband and a flowy blouse tucked loosely in the front. The proportions stay elongating throughout.",
    ],
  },

  // ---- SEASONALITY ----
  seasonality: {
    introExamples: [
      "For Fall, we are building around the season's best textures — rich wools, suede, leather — in a palette that feels warm",
      "For Spring, we are leaning into light layers and this season's colors: light pink, aqua, and soft yellow.",
    ],
    lookExamples: [
      "An oversized, wool coat over a turtleneck sweater and straight-leg trousers. Clean, architectural, and completely fall.",
      "For Winter, a dark grey or forest green knit. Low-heeled boots, a long wool coat, jeans, and a leather bag. The textures and colors do the work of making it seasonal.",
    ],
  },
};

// ============================================
// STYLE EXCLUSIONS
// Add anything you never want the LLM to recommend.
// These are injected as hard rules into every prompt.
// ============================================

export const STYLE_EXCLUSIONS = {
  // Silhouettes / clothing types to never suggest
  neverSuggest: [
    "jumpsuit",
    "romper",
  ],
};

/**
 * Returns formatted few-shot blocks + exclusion rules for injection into the LLM prompt.
 */
export function getEditorialExamples(intent: Intent): {
  introBlock: string;
  lookBlock: string;
  exclusionBlock: string;
} {
  const copy = EDITORIAL_COPY[intent];

  const introBlock = [
    "INTRO VOICE EXAMPLES (write your intro in this style, adapted to the user's context):",
    ...copy.introExamples.map((ex) => `- "${ex}"`),
  ].join("\n");

  const lookBlock = [
    "LOOK DESCRIPTION EXAMPLES (mirror this sentence structure and level of specificity):",
    ...copy.lookExamples.map((ex) => `- "${ex}"`),
  ].join("\n");

  const exclusionBlock =
    STYLE_EXCLUSIONS.neverSuggest.length > 0
      ? `NEVER SUGGEST: ${STYLE_EXCLUSIONS.neverSuggest.join(", ")}. Do not recommend these silhouettes under any circumstances.`
      : "";

  return { introBlock, lookBlock, exclusionBlock };
}
