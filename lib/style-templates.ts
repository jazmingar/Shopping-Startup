// lib/style-templates.ts

import type { Intent, SectionKey } from "./intent-structures";

export const __STYLE_TEMPLATES_LOADED = true;


export type TemplateMode = "initial" | "refine";

/**
 * A style template is a "locked" editorial layout for an intent,
 * with two modes:
 * - initial: show 2–3 options
 * - refine: focus on 1 option and apply tweaks
 */
export type StyleTemplate = {
  id: string; // stable identifier for caching/versioning, e.g. "date_v1"
  intent: Intent;
  mode: TemplateMode;

  title: string; // editorial title for this mode
  sections: Array<{
    key: SectionKey;
    label: string;
    // Optional: short internal guidance for your LLM / future maintainers
    description?: string;
  }>;

  constraints: {
    minOptions: 1 | 2 | 3;
    maxOptions: 1 | 2 | 3;

    /**
     * For refine mode, force a single look that corresponds to a chosen slot
     * (the user liked slot 1, etc.)
     */
    requireFocusSlot?: boolean;

    /**
     * You can keep this true for initial, false for refine if you want.
     * (In refine mode, you'd typically ask fewer questions.)
     */
    mustAskFollowUpQuestion: boolean;
  };
};

export const STYLE_TEMPLATES: StyleTemplate[] = [
  // --------------------
  // DATE
  // --------------------
  {
    id: "date_initial_v1",
    intent: "date",
    mode: "initial",
    title: "The Date Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks", description: "2–3 distinct, hot outfit options" },
      { key: "outfit_storybook", label: "The Outfit Storybook", description: "Short scene-setting vibe" },
      { key: "style_notes", label: "Style Notes", description: "Practical tips + fit guidance" },
      { key: "editors_note", label: "Editor’s Note", description: "High-level framing" },
      { key: "next_questions", label: "Next Questions", description: "1–3 clarifying/refinement questions" },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
    },
  },
  {
    id: "date_refine_v1",
    intent: "date",
    mode: "refine",
    title: "Refine the Look",
    sections: [
      { key: "curated_looks", label: "Your Look", description: "Exactly 1 refined option" },
      { key: "style_notes", label: "Tweak Notes", description: "What changed + how to wear it" },
      { key: "editors_note", label: "Editor’s Note", description: "Confidence + final polish" },
      { key: "next_questions", label: "One More Detail?", description: "0–2 quick refinements if needed" },
    ],
    constraints: {
      minOptions: 1,
      maxOptions: 1,
      requireFocusSlot: true,
      mustAskFollowUpQuestion: false,
    },
  },

  // --------------------
  // WORK DAY
  // --------------------
  {
    id: "professional_initial_v1",
    intent: "professional",
    mode: "initial",
    title: "Today’s Work Edit",
    sections: [
      { key: "curated_looks", label: "Polished Options", description: "2–3 professional looks" },
      { key: "style_notes", label: "Style Notes", description: "Proportion + practicality" },
      { key: "editors_note", label: "Editor’s Note", description: "Workplace-appropriate framing" },
      { key: "next_questions", label: "Next Questions", description: "1–3 clarifiers" },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
    },
  },
  {
    id: "professional_refine_v1",
    intent: "professional",
    mode: "refine",
    title: "Refine for Your Day",
    sections: [
      { key: "curated_looks", label: "Your Look", description: "Exactly 1 refined option" },
      { key: "style_notes", label: "Adjustment Notes", description: "Why the tweak works" },
      { key: "editors_note", label: "Editor’s Note", description: "Final polish + confidence" },
      { key: "next_questions", label: "One Detail?", description: "0–2 quick refinements" },
    ],
    constraints: {
      minOptions: 1,
      maxOptions: 1,
      requireFocusSlot: true,
      mustAskFollowUpQuestion: false,
    },
  },

  // --------------------
  // SOCIAL
  // --------------------
  {
    id: "social_initial_v1",
    intent: "social",
    mode: "initial",
    title: "The Social Edit",
    sections: [
      { key: "curated_looks", label: "Outfit Options", description: "2–3 fun, confident looks" },
      { key: "outfit_storybook", label: "The Moment", description: "How it shows up socially" },
      { key: "style_notes", label: "Style Notes", description: "Comfort + movement + details" },
      { key: "editors_note", label: "Editor’s Note", description: "Permission + vibe" },
      { key: "next_questions", label: "Next Questions", description: "1–3 refiners" },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
    },
  },
  {
    id: "social_refine_v1",
    intent: "social",
    mode: "refine",
    title: "Refine the Vibe",
    sections: [
      { key: "curated_looks", label: "Your Look", description: "Exactly 1 refined option" },
      { key: "style_notes", label: "Tweak Notes", description: "What changed + how to wear it" },
      { key: "editors_note", label: "Editor's Note", description: "Final confidence framing" },
      { key: "next_questions", label: "One More Detail?", description: "0–2 quick refinements" },
    ],
    constraints: {
      minOptions: 1,
      maxOptions: 1,
      requireFocusSlot: true,
      mustAskFollowUpQuestion: false,
    },
  },

  // --------------------
  // WEDDING_EVENT
  // --------------------
  {
    id: "wedding_event_initial_v1",
    intent: "wedding_event",
    mode: "initial",
    title: "The Wedding Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks", description: "2–3 elegant, event-appropriate options" },
      { key: "outfit_storybook", label: "The Occasion", description: "Scene-setting for the event" },
      { key: "style_notes", label: "Style Notes", description: "Dress code + etiquette guidance" },
      { key: "editors_note", label: "Editor's Note", description: "Confidence + appropriateness framing" },
      { key: "next_questions", label: "Next Questions", description: "1–3 clarifying questions" },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
    },
  },
  {
    id: "wedding_event_refine_v1",
    intent: "wedding_event",
    mode: "refine",
    title: "Refine for the Occasion",
    sections: [
      { key: "curated_looks", label: "Your Look", description: "Exactly 1 refined option" },
      { key: "style_notes", label: "Adjustment Notes", description: "Why the tweak works for this event" },
      { key: "editors_note", label: "Editor's Note", description: "Final polish + confidence" },
      { key: "next_questions", label: "One Detail?", description: "0–2 quick refinements" },
    ],
    constraints: {
      minOptions: 1,
      maxOptions: 1,
      requireFocusSlot: true,
      mustAskFollowUpQuestion: false,
    },
  },

  // --------------------
  // TRAVEL
  // --------------------
  {
    id: "travel_initial_v1",
    intent: "travel",
    mode: "initial",
    title: "The Travel Edit",
    sections: [
      { key: "curated_looks", label: "Your Itinerary", description: "Day-by-day outfit plan" },
      { key: "outfit_storybook", label: "The Trip", description: "Setting the scene for your destination" },
      { key: "style_notes", label: "Packing Notes", description: "Versatility + practical tips" },
      { key: "editors_note", label: "Editor's Note", description: "High-level packing philosophy" },
      { key: "next_questions", label: "Next Questions", description: "1–3 trip clarifiers" },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
    },
  },
  {
    id: "travel_refine_v1",
    intent: "travel",
    mode: "refine",
    title: "Refine Your Itinerary",
    sections: [
      { key: "curated_looks", label: "Updated Looks", description: "Refined day-by-day plan" },
      { key: "style_notes", label: "Adjustment Notes", description: "What changed + why it works" },
      { key: "editors_note", label: "Editor's Note", description: "Final confidence framing" },
      { key: "next_questions", label: "One More Detail?", description: "0–2 quick refinements" },
    ],
    constraints: {
      minOptions: 1,
      maxOptions: 1,
      requireFocusSlot: true,
      mustAskFollowUpQuestion: false,
    },
  },

  // --------------------
  // PREGNANCY
  // --------------------
  {
    id: "pregnancy_initial_v1",
    intent: "pregnancy",
    mode: "initial",
    title: "The Maternity Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks", description: "2–3 comfortable, flattering options" },
      { key: "outfit_storybook", label: "The Moment", description: "Dressing for this stage" },
      { key: "style_notes", label: "Style Notes", description: "Fit + comfort guidance" },
      { key: "editors_note", label: "Editor's Note", description: "Embracing this chapter" },
      { key: "next_questions", label: "Next Questions", description: "1–3 clarifiers" },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
    },
  },
  {
    id: "pregnancy_refine_v1",
    intent: "pregnancy",
    mode: "refine",
    title: "Refine for Comfort",
    sections: [
      { key: "curated_looks", label: "Your Look", description: "Exactly 1 refined option" },
      { key: "style_notes", label: "Adjustment Notes", description: "Why this works for your body" },
      { key: "editors_note", label: "Editor's Note", description: "Final confidence framing" },
      { key: "next_questions", label: "One Detail?", description: "0–2 quick refinements" },
    ],
    constraints: {
      minOptions: 1,
      maxOptions: 1,
      requireFocusSlot: true,
      mustAskFollowUpQuestion: false,
    },
  },

  // --------------------
  // SEASONALITY
  // --------------------
  {
    id: "seasonality_initial_v1",
    intent: "seasonality",
    mode: "initial",
    title: "The Seasonal Edit",
    sections: [
      { key: "curated_looks", label: "Curated Looks", description: "2–3 seasonal trend options" },
      { key: "outfit_storybook", label: "The Vibe", description: "Seasonal mood + context" },
      { key: "style_notes", label: "Style Notes", description: "Trend guidance + how to wear" },
      { key: "editors_note", label: "Editor's Note", description: "Seasonal perspective" },
      { key: "next_questions", label: "Next Questions", description: "1–3 refiners" },
    ],
    constraints: {
      minOptions: 2,
      maxOptions: 3,
      mustAskFollowUpQuestion: true,
    },
  },
  {
    id: "seasonality_refine_v1",
    intent: "seasonality",
    mode: "refine",
    title: "Refine the Seasonal Look",
    sections: [
      { key: "curated_looks", label: "Your Look", description: "Exactly 1 refined option" },
      { key: "style_notes", label: "Tweak Notes", description: "What changed + how to style it" },
      { key: "editors_note", label: "Editor's Note", description: "Final confidence framing" },
      { key: "next_questions", label: "One More Detail?", description: "0–2 quick refinements" },
    ],
    constraints: {
      minOptions: 1,
      maxOptions: 1,
      requireFocusSlot: true,
      mustAskFollowUpQuestion: false,
    },
  },
];

export const getStyleTemplate = (intent: Intent, mode: TemplateMode): StyleTemplate => {
  const t = STYLE_TEMPLATES.find((x) => x.intent === intent && x.mode === mode);
  if (!t) throw new Error(`Missing style template for intent="${intent}" mode="${mode}"`);
  return t;
};
