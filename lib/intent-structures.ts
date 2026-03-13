// lib/intent-structures.ts

export type Intent = "date" | "professional" | "social" | "wedding_event" | "travel" | "pregnancy" | "seasonality";

export type SectionKey =
  | "intro"
  | "curated_looks"
  | "outfit_storybook"
  | "style_notes"
  | "editors_note"
  | "next_questions";

export type IntentSection = {
  key: SectionKey;
  label: string;
};

/**
 * OptionSlot = one outfit option in the response.
 * The LLM generates the option title + outfit details dynamically.
 * guidanceTags are guardrails that bias what the option should "be".
 */
export type OptionSlot = {
  slot: 1 | 2 | 3;
  guidanceTags: string[]; // e.g. ["tailored", "polished", "day_to_night"]
  purpose?: string;
};

export type IntentConstraints = {
  minOptions: 2;
  maxOptions: 3;
  mustAskFollowUpQuestion: boolean;
  mustIncludeStorybookPlaceholder: boolean;
};

export type IntentStructure = {
  intent: Intent;
  title: string; // e.g. "The Desk-to-Dinner Edit"
  sections: IntentSection[];
  optionSlots: OptionSlot[];
  constraints: IntentConstraints;
};

/* =========================================================
   NEW: LLM OUTPUT CONTRACT (what the model must return)
   ========================================================= */

export type ResponseType = "initial" | "followup" | "clarifying";

/**
 * Structured hint the LLM outputs per slot so the backend can look up
 * (or eventually generate) a matching flat-lay image.
 * Values are closed enums — keeps LLM output reliable.
 */
export type ImageHint = {
  clothingType: "dress" | "top-bottom" | "coat-look" | "set" | "suit" | "jumpsuit";
  aesthetic: "minimal" | "classic" | "edgy" | "romantic" | "maximalist" | "bohemian";
  colorStory: "monochromatic" | "neutral-tones" | "bold-color" | "mixed";
};

/**
 * One outfit option (ONLY used in initial responses).
 * Editorial format: flowing descriptions, not structured breakdowns
 * - Exactly one option sets isEditorsPick=true
 */
export type LlmOutfitOption = {
  slot: 1 | 2 | 3;
  title: string; // e.g., "The Silk Maxi"
  description: string; // flowing paragraph describing the complete outfit
  isEditorsPick: boolean;
  imageHint?: ImageHint; // backend uses this to look up the matching cached image
};

export type CuratedLooksInitialSection = {
  key: "curated_looks";
  options: LlmOutfitOption[]; // initial only
};

export type CuratedLooksFollowupChange = {
  title: string;
  changes: string[];
  slot?: 1 | 2 | 3; // present for refine_all (and can be present for refine_option too)
};

export type CuratedLooksFollowupSection = {
  key: "curated_looks";
  content: CuratedLooksFollowupChange[];
};


export type TextSection = {
  key: Exclude<SectionKey, "curated_looks">;
  content: string[];
};

export type InitialSection =
  | CuratedLooksInitialSection
  | TextSection;

export type FollowupSection =
  | CuratedLooksFollowupSection
  | TextSection;

export type InitialResponse = {
  responseType: "initial";
  intent: Intent;
  title: string; // e.g., "First Date in NYC"
  sections: InitialSection[];
};

export type FollowupResponse = {
  responseType: "followup";
  intent: Intent;
  title: string; // e.g., "Updated Looks"
  focus: {
    type:
      | "refine_option"
      | "swap_item"
      | "occasion_change"
      | "shopping"
      | "weather_adjust"
      | "refine_all";
    slot?: 1 | 2 | 3;
    userGoal: string;
  };
  sections: FollowupSection[];
};


/**
 * Clarifying response — used when a key signal is missing before we can show looks.
 * Currently used by: professional (industry unknown), potentially wedding_event (role unknown).
 * Renders as a short intro + one question. No curated_looks.
 */
export type ClarifyingResponse = {
  responseType: "clarifying";
  intent: Intent;
  title: string;
  sections: TextSection[]; // only intro + next_questions
};

export type LlmResponse = InitialResponse | FollowupResponse | ClarifyingResponse;

/* =========================================================
   EXISTING: Intent definitions
   ========================================================= */

export const INTENT_STRUCTURES: Record<Intent, IntentStructure> = {
  date: {
    intent: "date",
    title: "The Date Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks" },
      { key: "outfit_storybook", label: "The Outfit Storybook" },
      { key: "editors_note", label: "Editor’s Note" },
      { key: "next_questions", label: "Next Questions" },
    ],
    optionSlots: [
      {
        slot: 1,
        guidanceTags: ["effortless", "cool", "flattering"],
        purpose: "Easy confidence; low effort, high impact.",
      },
      {
        slot: 2,
        guidanceTags: ["elevated", "intentional", "sharp"],
        purpose: "More polished; a bit more edge/structure.",
      },
      {
        slot: 3,
        guidanceTags: ["one_and_done", "sleek", "comfortable"],
        purpose: "Simple silhouette; chic and streamlined.",
      },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
      mustIncludeStorybookPlaceholder: true,
    },
  },

  professional: {
    intent: "professional",
    title: "The Work Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks" },
      { key: "outfit_storybook", label: "The Outfit Storybook" },
      { key: "style_notes", label: "Style Notes" },
      { key: "next_questions", label: "Next Questions" },
    ],
    optionSlots: [
      {
        slot: 1,
        guidanceTags: ["tailored", "polished", "professional"],
        purpose: "Structured, office-first look that still reads chic at dinner.",
      },
      {
        slot: 2,
        guidanceTags: ["layering", "versatile", "day_to_night"],
        purpose: "A look that changes vibe with one styling move (blazer/drape/shoe).",
      },
      {
        slot: 3,
        guidanceTags: ["comfort", "quiet_luxury", "elevated_basics"],
        purpose: "Comfortable through the day; elevated in dim dinner lighting.",
      },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
      mustIncludeStorybookPlaceholder: true,
    },
  },

  social: {
    intent: "social",
    title: "The Social Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks" },
      { key: "outfit_storybook", label: "The Outfit Storybook" },
      { key: "style_notes", label: "Style Notes" },
      { key: "next_questions", label: "Next Questions" },
    ],
    optionSlots: [
      {
        slot: 1,
        guidanceTags: ["minimal", "cool", "night_out"],
        purpose: "Sleek option with clean lines and a confident vibe.",
      },
      {
        slot: 2,
        guidanceTags: ["glam", "flattering", "fun"],
        purpose: "More playful / statement energy while staying wearable.",
      },
      {
        slot: 3,
        guidanceTags: ["effortless", "comfortable", "chic"],
        purpose: "Relaxed, easy option that still looks intentional.",
      },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
      mustIncludeStorybookPlaceholder: true,
    },
  },

  wedding_event: {
    intent: "wedding_event",
    title: "The Wedding Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks" },
      { key: "outfit_storybook", label: "The Outfit Storybook" },
      { key: "editors_note", label: "Editor's Note" },
      { key: "next_questions", label: "Next Questions" },
    ],
    optionSlots: [
      {
        slot: 1,
        guidanceTags: ["guest_appropriate", "elegant", "classic"],
        purpose: "Timeless guest look that works across venues.",
      },
      {
        slot: 2,
        guidanceTags: ["modern", "refined", "photogenic"],
        purpose: "More directional silhouette; still tasteful and event-appropriate.",
      },
      {
        slot: 3,
        guidanceTags: ["classic", "elevated", "modern"],
        purpose:
          "Classic, elevated, and modern look that still fits the wedding event's etiquette.",
      },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
      mustIncludeStorybookPlaceholder: true,
    },
  },

  travel: {
    intent: "travel",
    title: "The Travel Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks" },
      { key: "outfit_storybook", label: "The Itinerary" },
      { key: "style_notes", label: "Style Notes" },
      { key: "next_questions", label: "Next Questions" },
    ],
    optionSlots: [
      {
        slot: 1,
        guidanceTags: ["versatile", "packable", "day_to_night"],
        purpose: "Multi-purpose pieces that work across activities.",
      },
      {
        slot: 2,
        guidanceTags: ["destination_appropriate", "comfortable", "stylish"],
        purpose: "Climate and activity-appropriate with style.",
      },
      {
        slot: 3,
        guidanceTags: ["elevated", "photogenic", "vacation"],
        purpose: "Statement pieces for special moments and photos.",
      },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
      mustIncludeStorybookPlaceholder: true,
    },
  },

  pregnancy: {
    intent: "pregnancy",
    title: "The Maternity Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks" },
      { key: "outfit_storybook", label: "The Moment" },
      { key: "style_notes", label: "Style Notes" },
      { key: "next_questions", label: "Next Questions" },
    ],
    optionSlots: [
      {
        slot: 1,
        guidanceTags: ["comfortable", "flattering", "accommodating"],
        purpose: "Comfort-first with flattering silhouettes for changing body.",
      },
      {
        slot: 2,
        guidanceTags: ["elevated", "maternity_friendly", "polished"],
        purpose: "Polished looks that work through multiple trimesters.",
      },
      {
        slot: 3,
        guidanceTags: ["versatile", "nursing_friendly", "practical"],
        purpose: "Practical pieces that transition postpartum.",
      },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
      mustIncludeStorybookPlaceholder: true,
    },
  },

  seasonality: {
    intent: "seasonality",
    title: "The Seasonal Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks" },
      { key: "outfit_storybook", label: "The Vibe" },
      { key: "style_notes", label: "Style Notes" },
      { key: "next_questions", label: "Next Questions" },
    ],
    optionSlots: [
      {
        slot: 1,
        guidanceTags: ["trend_forward", "seasonal", "current"],
        purpose: "On-trend seasonal pieces that feel fresh.",
      },
      {
        slot: 2,
        guidanceTags: ["classic", "seasonal_staple", "versatile"],
        purpose: "Seasonal staples that work across occasions.",
      },
      {
        slot: 3,
        guidanceTags: ["playful", "seasonal_statement", "fun"],
        purpose: "Statement seasonal pieces for special moments.",
      },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
      mustIncludeStorybookPlaceholder: true,
    },
  },
} as const;

export function getIntentStructure(intent: Intent): IntentStructure {
  return INTENT_STRUCTURES[intent];
}
