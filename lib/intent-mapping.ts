// lib/intent-mapping.ts

import {
  getIntentStructure,
  type Intent,
  type IntentStructure,
} from "./intent-structures";

import { getStyleTemplate } from "./style-templates";
import { getEditorialExamples } from "./editorial-copy";

/**
 * Keep the assistant outputs consistent and easy to render:
 * - Always return JSON only (no markdown)
 * - Sections should map to your SectionKey list
 * - Options correspond to optionSlots (1..3)
 */

export type IntentPromptConfig = {
  /** A short “bias” paragraph unique to the intent */
  intentBias: string;

  /**
   * Context/practicality constraints (weather, terrain, travel, comfort, etc.)
   * Keep this about real-world feasibility, not social norms.
   */
  contextualConstraints?: string;

  /**
   * Etiquette + dress code norms (wedding rules, workplace norms, cultural constraints, etc.)
   * Keep this about appropriateness and social rules.
   */
  etiquetteAndDressCode?: string;

  /**
   * If you later add more intents, this is where you can add:
   * - required user attributes
   * - question templates
   * - seasonality rules, etc.
   */
  followUpQuestionBank: string[];
};

/**
 * Intent-specific biases and follow-up question banks.
 * These are *not* the full prompt; they get stitched into a single prompt pack below.
 */
export const INTENT_PROMPTS: Record<Intent, IntentPromptConfig> = {
  date: {
    intentBias:
      "Prioritize flattering silhouettes, intentional details, and a confident vibe. Keep it chic and slightly elevated without feeling overdone.",
    contextualConstraints: `Ensure outfits are comfortable and appropriate for the occasion, venue, and weather.

Weather rules:
- If temperature < 50°F or location is cold (e.g., winter in NYC), prioritize warmth: coats, layers, closed-toe shoes, heavier fabrics.
- If temperature > 75°F or destination is warm, prioritize breathability: lightweight fabrics, fewer layers, heat-appropriate footwear.

Venue/practicality rules:
- Match the formality of the venue (casual, work, formal, outdoor).
- Avoid recommendations that would be impractical for the venue (e.g., heels for cobblestones, heavy coats indoors).
- If there’s lots of walking, prioritize supportive shoes and comfortable silhouettes.

Always favor practicality and comfort over trend when there is a conflict.`,
    followUpQuestionBank: [
      "What are your plans (drinks, dinner, or an activity), and what is the vibe of the venue?",
      "Do you want to stand out or keep it understated?",
      "Who are you meeting, and what impression do you want to leave on them?",
      "Are there any specific pieces you’re dying to wear?",
      "How are you feeling in your body today — do you want something structured or something oversized and effortless?",
    ],
  },

  professional: {
    intentBias:
      "Aim for polished, professional, and modern. Think tailored pieces and elevated basics that still feel stylish after-hours.",
    etiquetteAndDressCode:
      "Avoid anything that reads too sheer, too short, or too tight unless the user explicitly wants that.",
    followUpQuestionBank: [
      "What is your workplace dress code: corporate, tech, business casual?",
      "Are you doing a lot of video calls today, or are you mostly in-person?",
      "Do you need the outfit to transition to dinner or an event after work?",
      "Who is the most 'important' person you're seeing today — leadership, a peer, a direct report, or a high-stakes client?",
      "For shoes, is your office formal (heels/flats) or more casual (sneakers/boots)?",
      "Any pieces you want to wear today, such as a blazer, cardigan, or loafers?",
    ],
  },

  social: {
    intentBias:
      "Prioritize fun, confident energy with wearable statement choices. The look should feel intentional.",
    contextualConstraints:
      "Keep the outfit venue-appropriate and practical for the conditions (temperature, walking, dancing, being outside).",
    followUpQuestionBank: [
      "What are your plans (dinner, drinks with friends, or a concert)?",
      "What is the vibe of where you are heading — casual, fun, or formal?",
      "Do you want to stand out or keep it understated?",
      "What’s the weather and will you be outside at all?",
    ],
  },

  wedding_event: {
    intentBias:
      "First determine the user's role: wedding guest vs bride/partner getting married vs bridal-event attendee. Then prioritize elegance and appropriateness for the role and dress code. Keep the look refined, photogenic, and comfortable enough for the event timeline.",
    etiquetteAndDressCode:
      "Role etiquette: If the user is a wedding guest, avoid white/ivory/cream unless explicitly allowed. If the user is the bride/partner getting married, white/ivory is prioritized and encouraged. Always match dress code (black tie/formal/cocktail/beach/daytime) and venue formality.",
    contextualConstraints:
      "Practicality: Consider terrain and mobility (grass/sand/cobblestones), weather, and time-on-feet. Suggest shoes and layers accordingly.",
    followUpQuestionBank: [
      "Are you the bride/partner getting married, or a guest?",
      "Where is the wedding and what is the dress code: black tie, formal, cocktail, beach?",
      "What is the venue: outdoor, church, garden, ballroom? What will the weather be like?",
      "Any color constraints, cultural expectations, or comfort needs, like heels or warmth?",
      "Is there any challenging terrain, like sand, grass, or old cobblestones?",
    ],
  },

  travel: {
    intentBias:
      "Prioritize versatile, packable pieces that work across multiple activities and occasions. Think day-to-night transitions, destination-appropriate climate, and photogenic moments.",
    contextualConstraints: `IMPORTANT: For multi-day trips, provide ONE outfit per day, not three options per day.

Weather and destination rules:
- Match climate to destination (beach warmth, ski cold, city variable)
- Consider activities (hiking, beach, fine dining, sightseeing)
- Prioritize packable, wrinkle-resistant fabrics
- Suggest layering for variable climates

Practicality rules:
- Comfortable for walking and long days
- Easy to mix and match across the itinerary
- Minimize luggage — suggest versatile pieces that work multiple ways`,
    followUpQuestionBank: [
      "Where are you traveling to and for how many days?",
      "What kind of trip is this: beach, city, ski, adventure?",
      "What activities do you have planned: dining, sightseeing, outdoor activities, events?",
      "What's your packing style: carry-on only or checked bag?",
      "Any specific events or nice dinners planned that need a dressier option?",
    ],
  },

  pregnancy: {
    intentBias:
      "Prioritize comfort, ease of movement, and flattering silhouettes that accommodate a changing body. Focus on pieces that feel confident and polished while being practical for this life stage.",
    contextualConstraints: `Fit and comfort rules:
- Suggest stretchy, accommodating fabrics
- Avoid anything restrictive at the waist or bust
- Prioritize empire waists, wrap styles, and A-line silhouettes
- Consider nursing-friendly options if the user is in late pregnancy or postpartum

Trimester considerations:
- First trimester: Regular clothes with slight room
- Second trimester: Maternity cuts or sized-up pieces
- Third trimester: Full maternity with maximum comfort
- Postpartum: Nursing access, comfortable waistbands`,
    followUpQuestionBank: [
      "How far along are you, and are you showing yet?",
      "What's the occasion: everyday wear, work, or a special event?",
      "Do you prefer maternity-specific pieces or regular clothes sized up?",
      "Are there any comfort issues: swelling, back pain, temperature sensitivity?",
      "Are you planning to nurse, and do you need nursing-friendly options?",
    ],
  },

  seasonality: {
    intentBias:
      "Keep it trend-forward and seasonally relevant. Reference current seasonal trends (Fall layers, Summer linens, Winter textures) while staying grounded in wearability. This is about embracing the season's aesthetic.",
    contextualConstraints: `Seasonal appropriateness:
- Match the current season or the season the user is asking about
- Reference seasonal trends (Fall 2026, Summer 2026, etc.)
- Suggest weather-appropriate fabrics and silhouettes
- Balance trend with timelessness — avoid overly trendy pieces that won't last

Seasonal trend examples:
- Fall: Layering, rich textures, boots, structured coats
- Winter: Cozy knits, long coats, deep colors, luxe textures
- Spring: Light layers, pastels, florals, transitional pieces
- Summer: Breathable fabrics, sandals, bright colors, minimal silhouettes`,
    followUpQuestionBank: [
      "What season are you dressing for: Fall, Winter, Spring, or Summer?",
      "Are you looking for everyday seasonal staples or statement trend pieces?",
      "What's your climate: cold winters, mild year-round, hot summers?",
      "Any specific seasonal occasions coming up: holiday parties, summer weddings, spring events?",
      "Do you prefer classic seasonal pieces or more trend-forward options?",
    ],
  },
};

/**
 * This builds the full prompt text for the OpenAI API call.
 * You can pass `system` and `user` into chat.completions / responses.
 */
export function buildIntentPromptPack(args: {
  intent: Intent;
  userQuery: string;
  mode?: "initial" | "refine";
  focusSlot?: 1 | 2 | 3;
  refineScope?: "one" | "all";
  userContext?: {
    location?: string;
    isTravel?: boolean;
    travelContext?: string;
    isFrequentTraveler?: boolean;
    frequentDestinations?: string[];
    cityAesthetic?: string;
    weather?: string;
    constraints?: string;
    closetNotes?: string;
    styleProfile?: string;
  };
}): { system: string; user: string; structure: IntentStructure; config: IntentPromptConfig } {
  // ✅ normalized controls
  const mode: "initial" | "refine" = args.mode === "refine" ? "refine" : "initial";
  const refineScope: "one" | "all" = args.refineScope === "all" ? "all" : "one";

  // FE mode => output responseType
  const responseType = mode === "refine" ? "followup" : "initial";
  const followupFocusType: "refine_option" | "refine_all" =
    mode === "refine" && refineScope === "all" ? "refine_all" : "refine_option";

  const { intent, userQuery, userContext, focusSlot } = args;

  const structure: IntentStructure = getIntentStructure(intent);
  const config = INTENT_PROMPTS[intent];
  const template = getStyleTemplate(intent, mode);
  const { introBlock, lookBlock, exclusionBlock } = getEditorialExamples(intent);

  const weddingRoleGuidance =
    intent === "wedding_event"
      ? [
          "ROLE INFERENCE (important):",
          "- Determine whether the user is a wedding guest or the bride/partner getting married.",
          '- If the query mentions phrases like: "my wedding", "getting married", "bridal", "my bachelorette", "my rehearsal dinner", "engagement photos", treat the user as BRIDE/PARTNER.',
          '- If the query mentions: "guest", "attending a wedding", "friend’s wedding", "my cousin’s wedding", "bridesmaid", treat the user as GUEST.',
          "- Apply etiquette accordingly.",
          "- If role is unclear, ask in next_questions: “Are you the bride or a guest?”",
          "",
        ].join("\n")
      : "";

  // NOTE: you asked to OMIT outfit_storybook for now, so we still *allow* it in the list
  // but we explicitly tell the model not to include it.
  const allowedSectionKeys = structure.sections.map((s) => s.key);
  const sectionsList = allowedSectionKeys.join(", ");

  const optionSlotNotes = structure.optionSlots
    .map(
      (s) =>
        `Slot ${s.slot}: guidanceTags=[${s.guidanceTags.join(", ")}]${
          s.purpose ? ` purpose="${s.purpose}"` : ""
        }`
    )
    .join("\n");

  // Keep template constraints available if you still use them elsewhere,
  // but we enforce EXACTLY 3 options for initial per your requirement.
  const minOptions = template.constraints?.minOptions ?? 3;
  const maxOptions = template.constraints?.maxOptions ?? 3;
  void minOptions;
  void maxOptions;

  /**
   * SYSTEM: invariant protocol rules only
   */
  const system = [
    "You are a high-end fashion stylist assistant with 25+ years of experience working with clients.",
    "Return VALID JSON only. No markdown. No extra commentary.",
    "Do not output bullet symbols like '•'.",
    "Your entire response must be a single JSON object. Output nothing before or after the JSON.",
    "The JSON must follow the OUTPUT CONTRACT exactly.",
  ].join("\n");

  /**
   * USER: run-specific instruction pack (intent, structure, constraints, mode rules)
   */
  const user = [
    `INTENT: ${intent}`,
    `TITLE: ${structure.title}`,
    "",
    "STRUCTURE:",
    `Allowed section keys: ${sectionsList}`,
    "",
    "OPTION SLOTS (guardrails for initial options only):",
    optionSlotNotes,
    "",
    "INTENT BIAS:",
    config.intentBias,
    "",
    config.contextualConstraints
      ? `CONTEXTUAL CONSTRAINTS:\n${config.contextualConstraints}\n`
      : "",
    config.etiquetteAndDressCode
      ? `ETIQUETTE + DRESS CODE:\n${config.etiquetteAndDressCode}\n`
      : "",
    weddingRoleGuidance,
    "USER QUERY:",
    userQuery,
    "",
    userContext?.location
      ? `LOCATION: ${userContext.location}${userContext.isTravel ? ` (traveling${userContext.travelContext ? ` for ${userContext.travelContext}` : ""})` : " (home)"}`
      : "",
    userContext?.cityAesthetic
      ? `CITY AESTHETIC: ${userContext.cityAesthetic}`
      : "",
    userContext?.isFrequentTraveler
      ? `TRAVEL PROFILE: Frequent traveler${userContext.frequentDestinations && userContext.frequentDestinations.length > 0 ? ` - often visits: ${userContext.frequentDestinations.join(", ")}` : ""}`
      : "",
    userContext?.weather ? `WEATHER: ${userContext.weather}` : "",
    userContext?.constraints ? `USER CONSTRAINTS: ${userContext.constraints}` : "",
    userContext?.closetNotes ? `CLOSET NOTES: ${userContext.closetNotes}` : "",
    userContext?.styleProfile ? `USER STYLE PROFILE: ${userContext.styleProfile}` : "",
    "",
    "OUTPUT CONTRACT (REQUIRED):",
    `- responseType MUST be "${responseType}".`,
    `- intent MUST be "${intent}".`,
    `- Output MUST use top-level keys: responseType, intent, sections${responseType === "followup" ? ", focus" : ""}.`,
    `- sections MUST be an array of section objects with:`,
    `  - key: one of the Allowed section keys`,
    `  - For curated_looks: initial uses "options", followup uses "content"`,
    `  - For all other sections: use "content": ["string", ...]`,
    "",
    "IMPORTANT:",
    "- For now, OMIT outfit_storybook entirely (do not include the key).",
    "- Never mention brand names. Never mention budget.",
    "- Only include bag/accessories if they materially improve the look; otherwise omit.",
    exclusionBlock ? `- ${exclusionBlock}` : "",
    "",
    intent === "professional" && mode === "initial" && !userContext?.closetNotes
      ? [
          "CLARIFYING STEP (professional only):",
          "- Before showing looks, check if the user's message mentions their industry or dress code.",
          "- Industry signals to look for: finance, banking, law, legal, consulting, corporate, tech, startup, software, creative, design, media, marketing, medical, healthcare, or any explicit dress code (business casual, formal, etc.).",
          "- If NO industry signal is present: return responseType 'clarifying' with ONLY an intro section (1 sentence) and a next_questions section (ask their industry).",
          "- If industry IS clear: proceed with a normal 'initial' response.",
          "",
          "CLARIFYING RESPONSE SHAPE (use only if industry is unclear):",
          `{
  "responseType": "clarifying",
  "intent": "professional",
  "title": "Let's Get to Work",
  "sections": [
    { "key": "intro", "content": ["Let's build your work wardrobe — just a quick question first."] },
    { "key": "next_questions", "content": ["What industry do you work in, and is there a dress code — corporate, business casual, tech, or creative?"] }
  ]
}`,
          "",
        ].join("\n")
      : "",
    responseType === "initial"
      ? [
          "INITIAL RESPONSE RULES:",
          "- You MUST return EXACTLY 3 options in curated_looks.options (slots 1,2,3).",
          "- Write EDITORIAL, FLOWING descriptions - NOT structured breakdowns.",
          "- Each description should be 1-3 complete sentences describing the full outfit.",
          "- Exactly ONE option must be marked as the editor's pick (isEditorsPick: true)",
          "- The other two options must have isEditorsPick: false",
          "- Each option must include:",
          "  - slot (1|2|3)",
          '  - title: "The [Descriptive Name]" (e.g., "The Silk Maxi", "The Sculpted Cut-Out")',
          '  - description: "flowing paragraph describing complete outfit with styling"',
          '  - isEditorsPick: boolean',
          "  - imageHint: { clothingType, aesthetic, colorStory } — label what you just described",
          "",
          "IMAGE HINT RULES:",
          "- imageHint.clothingType: one of dress | top-bottom | coat-look | set | suit | jumpsuit",
          "  - dress: any dress worn alone (midi, maxi, mini, slip)",
          "  - top-bottom: separate top + skirt or trouser (including blazer + trouser)",
          "  - coat-look: coat or jacket is the hero piece layered over the outfit",
          "  - set: matching two-piece in the same fabric/print",
          "  - suit: tailored blazer + matching trouser (same fabric)",
          "  - jumpsuit: one-piece jumpsuit or romper",
          "- imageHint.aesthetic: one of minimal | classic | edgy | romantic | maximalist | bohemian",
          "- imageHint.colorStory: one of monochromatic | neutral-tones | bold-color | mixed",
          "  - monochromatic: head-to-toe one color (all-black, all-cream, all-camel)",
          "  - neutral-tones: mixed neutrals (chocolate + ivory, camel + beige, etc.)",
          "  - bold-color: saturated statement color(s)",
          "  - mixed: pattern, print, or strong color contrast",
          "",
          "DESCRIPTION WRITING STYLE:",
          "- Write in complete sentences, not bullet points.",
          "- Include the hero piece, how to style it, shoes, and key accessories in one flowing description.",
          "- Keep it concise (2–4 sentences max per option).",
          "- Sound like a fashion editor giving advice to a friend — direct, visual, specific.",
          "",
          lookBlock,
          "",
          "INTRO RULES:",
          "- The intro is a creative brief, NOT a generic acknowledgment of the request.",
          "- Set the visual direction: silhouettes, color palette, mood.",
          "- Use 'we' language — collaborative and editorial.",
          "- 1–2 sentences max. Sound like a stylist setting an intention before pulling looks.",
          "",
          introBlock,
          "",
          "SECTIONS BEHAVIOR:",
          "- Include next_questions as a section and make it EXACTLY 1 question.",
          "- The editors_note section MUST reference the editor's pick by slot number only — write 'Look 1', 'Look 2', or 'Look 3'. Do NOT use the option title. Explain why it's your favorite in 1–2 sentences.",
          '- Example: "Look 2 is my top pick — it strikes the perfect balance between modern edge and timeless sophistication, making it versatile enough for multiple occasions."',
          "",
          "RESPONSE JSON SHAPE:",
          `{
  "responseType": "initial",
  "intent": "${intent}",
  "title": "First Date in NYC",
  "sections": [
    {
      "key": "intro",
      "content": ["For a first date in NYC, we should focus on confidence-forward silhouettes and a palette that feels intentional. We are aiming for a look that is elevated but effortless."]
    },
    {
      "key": "curated_looks",
      "options": [
        {
          "slot": 1,
          "title": "The Silk Maxi",
          "description": "A chocolate brown silk maxi with a halter neckline. Pair with gold, statement earrings and a gold platform heel.",
          "isEditorsPick": false,
          "imageHint": { "clothingType": "dress", "aesthetic": "romantic", "colorStory": "neutral-tones" }
        },
        {
          "slot": 2,
          "title": "The Sculpted Cut-Out",
          "description": "A mocha-colored knit midi or maxi featuring subtle side-waist cut-outs; a modern way to show skin while maintaining a high-fashion, classy edge.",
          "isEditorsPick": true,
          "imageHint": { "clothingType": "dress", "aesthetic": "edgy", "colorStory": "neutral-tones" }
        },
        {
          "slot": 3,
          "title": "The Satin Slip",
          "description": "A deep espresso satin slip dress - a simple dress that you could style up by adding gold statement earrings and curled hair.",
          "isEditorsPick": false,
          "imageHint": { "clothingType": "dress", "aesthetic": "minimal", "colorStory": "monochromatic" }
        }
      ]
    },
    { "key": "editors_note", "content": ["Look 2 is my top pick—it strikes the perfect balance between modern edge and timeless sophistication."] },
    { "key": "next_questions", "content": ["string"] }
  ]
}`,
        ].join("\n")
      : followupFocusType === "refine_all"
        ? [
            "FOLLOWUP RESPONSE RULES (refine_all):",
            '- You MUST NOT output any "options" arrays anywhere in the JSON.',
            "- You MUST include a top-level focus object.",
            `- focus.type MUST be "${followupFocusType}".`,
            "- You are refining ALL THREE looks already shown in the UI.",
            "- curated_looks.content MUST include EXACTLY 3 entries: slot 1, slot 2, slot 3.",
            "- Each entry MUST include: slot, title, changes.",
            "",
            "SECTIONS BEHAVIOR:",
            "- Include intro section with 1-2 sentences acknowledging the refinement request.",
            "- Include next_questions as a section with 0–1 questions (only if critical info is missing).",
            "- Include editors_note referencing which option is your favorite and why.",
            "",
            "RESPONSE JSON SHAPE:",
            `{
  "responseType": "followup",
  "intent": "${intent}",
  "title": "Updated Looks",
  "focus": {
    "type": "refine_all",
    "userGoal": "string"
  },
  "sections": [
    {
      "key": "intro",
      "content": ["Brief intro acknowledging the refinement request."]
    },
    {
      "key": "curated_looks",
      "content": [
        { "slot": 1, "title": "string", "changes": ["string", "string"] },
        { "slot": 2, "title": "string", "changes": ["string", "string"] },
        { "slot": 3, "title": "string", "changes": ["string", "string"] }
      ]
    },
    { "key": "editors_note", "content": ["The [Option Title] is my top pick—it strikes the perfect balance."] },
    { "key": "next_questions", "content": ["string"] }
  ]
}`,
            "",
            "FOLLOW-UP QUESTION GUIDANCE:",
            `Choose from this bank if needed:\n- ${config.followUpQuestionBank.join("\n- ")}`,
          ].join("\n")
        : [
            "FOLLOWUP RESPONSE RULES (refine_option):",
            '- You MUST NOT output any "options" arrays anywhere in the JSON.',
            "- You MUST include a top-level focus object.",
            `- focus.type MUST be "${followupFocusType}".`,
            "- You MUST NOT re-present 3 looks. Only provide focused changes/swaps/clarifications for one look.",
            focusSlot
              ? `- This followup is about slot ${focusSlot}. Include focus.slot=${focusSlot} and include slot=${focusSlot} in curated_looks.content[0].`
              : "- If slot is unclear, set focus.userGoal to what the user is asking for and omit focus.slot and slot in curated_looks.content[0].",
            "",
            "SECTIONS BEHAVIOR:",
            "- Include next_questions as a section with 0–1 questions (only if critical info is missing).",
            "",
            "RESPONSE JSON SHAPE:",
            `{
  "responseType": "followup",
  "intent": "${intent}",
  "title": "Updated Look",
  "focus": {
    "type": "refine_option",
    ${focusSlot ? `"slot": ${focusSlot},` : ""}
    "userGoal": "string"
  },
  "sections": [
    {
      "key": "curated_looks",
      "content": [
        {
          ${focusSlot ? `"slot": ${focusSlot},` : ""}
          "title": "string",
          "changes": ["string", "string"]
        }
      ]
    },
    { "key": "style_notes", "content": ["string"] },
    { "key": "next_questions", "content": ["string"] }
  ]
}`,
            "",
            "FOLLOW-UP QUESTION GUIDANCE:",
            `Choose from this bank if needed:\n- ${config.followUpQuestionBank.join("\n- ")}`,
          ].join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user, structure, config };
}

/**
 * Optional helper: normalize unknown/empty intent upstream.
 * (Keeps callsites clean.)
 */
export function coerceIntent(value: string | null | undefined): Intent {
  if (!value) return "professional"; // safe default for MVP
  const v = value.trim() as Intent;
  return v in INTENT_PROMPTS ? v : "professional";
}
