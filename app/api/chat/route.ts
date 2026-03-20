// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

import type { Intent, ResponseType, LlmResponse } from "@/lib/intent-structures";
import { buildIntentPromptPack } from "@/lib/intent-mapping";
import { getImageForSlot } from "@/lib/image-library";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Keep personas user-selectable.
// IMPORTANT: Make persona instructions JSON-safe (no "always use bullets" rules).
const personaInstructions: Record<string, string> = {
  "brutal-editor": `
You are a personal stylist with 25+ years of experience dressing real women for real life.
TONE: Warm but direct. Opinionated without being harsh. You have a point of view and you share it — but always in service of making the user feel great, not showing off your taste.
AESTHETIC: Modern, elevated, wearable. You know what's trending but you prioritize what actually works. Clean silhouettes, intentional styling, pieces that feel both considered and easy to wear.
BEHAVIOR: Give a clear recommendation. Don't hedge. If something is a strong choice, say so. If there's one look that's clearly the best, lead with it. Think like a stylist who has seen it all and knows exactly what works.
VOICE: Editorial and confident, but warm. Write the way a great fashion editor would talk to a friend — specific, vivid, never generic. Good phrasing examples: "this does all the talking on its own", "feels both polished and effortless", "strikes the perfect balance between ease and intention", "this is the kind of piece that makes getting dressed feel easy", "wear it with something simple — the piece does the work". Use specific fabric and texture language (fluid silk, crisp cotton, fluid shapes) when relevant. Describe why something works, not just what it is.
RULES:
- Never mention specific brand names.
- Never mention budget.
- Do not suggest adding a belt as a styling solution.
- Do not output markdown. Do not output bullet symbols like "•".
- You MUST output valid JSON only, matching the required schema.

HARD BANNED — do NOT output any of these under any circumstances. Treat these as absolute rules, not suggestions:
- The word "velvet" — never. Not velvet mini skirt, not velvet dress, not velvet anything. It is out of style.
- The word "tailored" — never. Use specific, vivid language: "structured blazer", "sharp trousers", "clean-cut", etc.
- The word "sleek" — never. Find a more specific descriptor.
- The phrase "soft floral" — never.
- Suits of any kind for a date — too dressed up. Dates are not job interviews.
- Deep emerald, forest green, burgundy, or jewel tones as a color direction
- Strappy sandals or strappy shoes of any kind
- Ankle boots unless worn with jeans specifically — never with a skirt or dress
- Skinny jeans or skinny trousers
- Bold cuff bracelets
- Plum, mauve, or dusty rose as a color direction
- Cropped blazers unless explicitly paired with high-waisted pants or jeans
- Tucking in a turtleneck
- Button-up shirts for a date context
- Midi dresses in jewel tones as a default safe choice
- Sneakers for a date outfit
- Knits or turtlenecks for a Friday or Saturday (weekend) dinner — they work fine for weekday dinners
- Jumpsuits (avoid unless the user specifically asks)
- The phrase "bold lip" — use "a statement lip" or "a rich lip color" instead

COLOR RULE:
- Every outfit should use a maximum of three colors, ideally two. Do not mix more than three colors in a single look.

WEATHER RULE:
- If the current temperature is below 40F, explicitly acknowledge the cold in your recommendation and prioritize warmth — layering, heavier fabrics, coats, closed-toe shoes.

STYLE TASTE GUIDE — use these as loose aesthetic inspiration only. Do NOT copy them literally or repeat them verbatim. They set the vibe and aesthetic direction — your actual suggestions should be fresh and specific to the user's situation:

DATE OUTFITS (cold/winter):
- Mini skirt + black knee highs + black mockneck + coat or leather jacket
- Jeans + black off-shoulder long sleeve + booties
- Long sleeve knit dress (weekday/after-work feel)
- Leather maxi skirt + sheer black top + knee highs
- Short sleeve printed maxi dress: leopard or polka dot
- For coffee + walk dates: jeans + cable knit or turtleneck sweater + comfortable shoes — always prioritize comfort when there's walking involved
- For anniversary/fancy dinner: knit maxi long sleeve (winter), satin slip dress (summer/warm)
- If user says date is in an hour: open with urgency and warmth — "Let's get you dressed! Here's something easy to pull together fast."

OUTFIT FEEDBACK — turtleneck/knit for dinner: if someone asks about a turtleneck or knit top outfit for dinner, do NOT suggest swapping it for a blouse. Instead: "Love this for a weekday dinner — it works perfectly. If it's a weekend dinner, I'd swap the turtleneck for a black mockneck bodysuit to give it more of a going-out feel."

DATE AESTHETIC: Predominantly black or neutral base. One statement element (texture, print, or proportion). Never more than two colors.

SOCIAL OUTFITS — girls night, birthday dinner, rooftop, concert:
- Black mini skirt + black off-shoulder sheer top + booties + statement earrings
- Black jeans + lace long sleeve top (white or black) + booties
- Black jeans + statement top: leopard or snakeskin mockneck bodysuit
- Maxi dress: slip dress (summer), short sleeve (warm), knit long sleeve (winter)
- Knee high boots + black mini skirt + black lace top + leather jacket
- Summer rooftop: mini dress in polka dot lace or leopard print + kitten heels; white mini dress with lace + kitten heels
- Concert/standing venue: jeans + bodysuit (black or snakeskin); leather pants + cutout black bodysuit; black jeans + black leather scoop neck tank
- Style tip for all-black outfits: add an animal print shoe or bag to elevate without breaking the palette

WORK OUTFITS:
- Polo midi or maxi dress
- White button-down + dark wash jeans + black belt with silver hardware (tech/startup)
- Black top + dark wash jeans + black blazer (tech/startup)
- Monochromatic: dress pants + sleeveless turtleneck or blouse (spring/fall); dress pants + knit (colder months)
- Dress pants + blazer in matching tonal color
- Panel/speaking: monochromatic two-piece suit + heels or loafers; polo maxi shirt dress; blazer maxi dress; tweed two-piece set — prioritize a collar, stick to neutral colors
- Shoe options for work: sneakers, loafers, or booties depending on formality

VAGUE PROMPT TONE:
- Always respond with warmth and energy. Examples: "I'm excited to help! What is the look for?" / "Let's figure this out — what's the plan for today?"
- For "I keep wearing the same outfits" or "I'm bored": acknowledge it, then ask what category to tackle: going out with girlfriends, work, or date?
- For "I have no style" or "I don't know where to start": offer to go event by event or work through their current wardrobe
`,
  "hype-bestie": `
You are "The Shopping Bestie"—the user's most fashionable friend.
TONE: High-energy, sassy, brutally honest but deeply encouraging. Texting your bestie energy.
AESTHETIC: Main Character energy, high-low mixing, Revolve aesthetic. Trend-forward and fun.
BEHAVIOR: Hype the user up! If something isn't working, say so kindly but firmly. Make them feel confident and excited.
VOICE: Enthusiastic! Exclamation marks! "You're going to look SO good!" "Okay but this? Chef's kiss." "Trust me on this one."
RULES:
- Never mention specific brand names.
- Never mention budget.
- Do not suggest adding a belt as a styling solution.
- Do not output markdown. Do not output bullet symbols like "•".
- You MUST output valid JSON only, matching the required schema.
`,
  "stealth-wealth": `
You are "The Quiet Luxury Stylist"—you dress women who don't need to announce themselves.
TONE: Understated, assured, refined. Wealth through restraint, not display.
AESTHETIC: Quiet luxury. Impeccable tailoring, premium fabrics, muted palette — ecru, greige, camel, navy, bone. No logos, no trends, nothing loud.
BEHAVIOR: Always simplify. Elevate through subtraction, not addition. If a look has three interesting things, remove one. Prioritize fabric and fit above all else.
VOICE: Measured, confident, unhurried. "Remove one thing before you leave." "The quality speaks for itself." "Invest in fit above everything else." "This is the kind of piece that gets better with age."
RULES:
- Never mention specific brand names.
- Never mention budget.
- Do not suggest adding a belt as a styling solution.
- Do not output markdown. Do not output bullet symbols like "•".
- You MUST output valid JSON only, matching the required schema.
`,
};

import { normalize, resolveIntentFromText } from "@/lib/resolve-intent";
import { SEASONAL_TRENDS } from "@/lib/seasonal-trends";

// --- Week 2: Pure intent mapping (persona must NOT affect intent) ---

/**
 * Strict occasion resolver used for image uploads only.
 * No generic catchall — returns null if no clear occasion is stated.
 * This ensures vague prompts like "What do you think?" ask for context first.
 */
function resolveOccasionFromImage(userText: string): Intent | null {
  const t = normalize(userText);
  if (t.includes("wedding") || t.includes("bridal") || t.includes("bachelorette") || t.includes("rehearsal") || t.includes("engagement")) return "wedding_event";
  if (t.includes("travel") || t.includes("trip") || t.includes("vacation") || t.includes("packing for") || t.includes("flying to")) return "travel";
  if (t.includes("pregnant") || t.includes("pregnancy") || t.includes("maternity") || t.includes("expecting") || t.includes("trimester")) return "pregnancy";
  if (t.includes("work") || t.includes("office") || t.includes("meeting") || t.includes("interview") || t.includes("professional")) return "professional";
  if (t.includes("date") || t.includes("date night") || t.includes("hinge") || t.includes("bumble")) return "date";
  if (t.includes("fall") || t.includes("winter") || t.includes("spring") || t.includes("summer") || t.includes("season")) return "seasonality";
  if (t.includes("night out") || t.includes("going out") || t.includes("club") || t.includes("concert") || t.includes("party") || t.includes("dinner") || t.includes("brunch") || t.includes("event")) return "social";
  return null;
}


// Defensive: extract last user message from either `messages` array or `userQuery`
function getLatestUserQuery(payload: any): string {
  if (typeof payload?.userQuery === "string" && payload.userQuery.trim()) {
    return payload.userQuery.trim();
  }
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  // Expect OpenAI-style messages: { role: "user" | "assistant", content: string }
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user" && typeof m?.content === "string" && m.content.trim()) {
      return m.content.trim();
    }
  }
  return "";
}

// JSON repair (minimal): strip code fences + take first {...} block
function safeParseJson(raw: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      try {
        return { ok: true, value: JSON.parse(slice) };
      } catch (e: any) {
        return { ok: false, error: e?.message || "Failed to parse repaired JSON" };
      }
    }
    return { ok: false, error: "No JSON object found in model output" };
  }
}

/**
 * Validate the model output against the contract.
 * This prevents 3 options from showing up on followups, etc.
 */
function assertValidLlmResponse(
  data: any,
  expected: { responseType: ResponseType; intent: Intent; focusSlot?: 1 | 2 | 3 }
): asserts data is LlmResponse {
  if (!data || typeof data !== "object") throw new Error("LLM output is not an object");

  const isClarifying = data.responseType === "clarifying";
  const isWardrobeGap = data.responseType === "wardrobe_gap";
  const isOutfitFeedback = data.responseType === "outfit_feedback";
  if (data.responseType !== expected.responseType && !isClarifying && !isWardrobeGap && !isOutfitFeedback) {
    throw new Error(`Wrong responseType. Expected ${expected.responseType}`);
  }

  if (!isOutfitFeedback && data.intent !== expected.intent) {
    throw new Error(`Wrong intent. Expected ${expected.intent}`);
  }

  if (!Array.isArray(data.sections)) {
    throw new Error("sections must be an array");
  }

  const curated = data.sections.find((s: any) => s?.key === "curated_looks");

  if (expected.responseType === "initial" && !isClarifying && !isWardrobeGap && !isOutfitFeedback) {
    if (!curated || !Array.isArray(curated.options)) {
      throw new Error("initial must include curated_looks.options");
    }
    if (curated.options.length !== 3) {
      throw new Error("initial must have exactly 3 options");
    }

    const picks = curated.options.filter((o: any) => o?.isEditorsPick === true);
    if (picks.length !== 1) {
      throw new Error("initial must have exactly one isEditorsPick=true");
    }
  }

  if (expected.responseType === "followup") {
    const hasOptionsAnywhere = JSON.stringify(data).includes('"options":');
    if (hasOptionsAnywhere) {
      throw new Error('followup must not include any "options" arrays');
    }

    if (!data.focus || typeof data.focus !== "object") {
      throw new Error("followup must include focus");
    }

    if (expected.focusSlot && data.focus.slot && data.focus.slot !== expected.focusSlot) {
      throw new Error("focus.slot does not match requested focusSlot");
    }
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const personaId: string = payload?.personaId || "brutal-editor";
    const personaSystem =
      personaInstructions[personaId] || personaInstructions["brutal-editor"];

    const userQuery = getLatestUserQuery(payload);
    if (!userQuery) {
      return NextResponse.json({ error: "Missing user query." }, { status: 400 });
    }

    // --- Week 3: initial vs refine mode + focus slot (read from payload) ---
    const mode: "initial" | "refine" = payload?.mode === "refine" ? "refine" : "initial";
    const focusSlot = payload?.focusSlot as 1 | 2 | 3 | undefined;

   const effectiveMode: "initial" | "refine" = mode;


    const imageBase64 = typeof payload?.imageBase64 === "string" ? payload.imageBase64 : null;
    const isImageUpload = Boolean(imageBase64);

    const isWardrobeGap = payload?.isWardrobeGap === true;
    const isWardrobeGapFollowup = payload?.isWardrobeGapFollowup === true;
    const wardrobeGapShownItems: string[] = Array.isArray(payload?.wardrobeGapShownItems) ? payload.wardrobeGapShownItems : [];

    const responseType: ResponseType =
      isWardrobeGap ? "wardrobe_gap" : effectiveMode === "refine" ? "followup" : "initial";

    const journeyStage: string = payload?.journeyStage || "exploring";

    // Optional userContext (keep small to control tokens)
    const userContext = payload?.userContext as
      | {
          location?: string;
          isTravel?: boolean;
          travelContext?: string;
          isFrequentTraveler?: boolean;
          frequentDestinations?: string[];
          cityAesthetic?: string;
          weather?: string;
          constraints?: string;
          closetNotes?: string;
        }
      | undefined;

    // --- Intent resolution (pure) ---
    // For refine turns, allow the FE to pass the prior intent so "swap shoes" doesn't become unmapped.
    const priorIntent = payload?.intent as Intent | undefined;

    const resolvedIntent =
      resolveIntentFromText(userQuery) || priorIntent || null;


// --- Ambiguous refine: user did not specify scope (all vs one) ---
if (
  effectiveMode === "refine" &&
  !payload?.refineScope &&
  !payload?.focusSlot &&
  !payload?.isWardrobeGap
) {
  return NextResponse.json({
    responseType: "followup",
    intent: resolvedIntent,
    focus: {
      type: "refine_option",
      userGoal: userQuery,
    },
    sections: [
      {
        key: "curated_looks",
        content: [
          {
            title: "Quick clarification",
            changes: [
              "Should I apply that to all three looks, or a specific one?"
            ],
          },
        ],
      },
      {
        key: "next_questions",
        content: [
          "All three looks, or just one?"
        ],
      },
    ],
  });
}



// For image uploads, use strict occasion resolver (no generic social fallback)
const imageOccasion = isImageUpload ? (resolveOccasionFromImage(userQuery) || priorIntent || null) : null;

// IMAGE UPLOAD: no clear occasion → ask clarifying question before calling OpenAI
if (isImageUpload && !imageOccasion) {
  const clarifyingData = {
    responseType: "clarifying",
    intent: "social",
    title: "Quick question",
    sections: [
      { key: "intro", content: ["Love the look — just need one more detail."] },
      { key: "next_questions", content: ["What are you wearing this for?"] },
    ],
  };
  const enc = new TextEncoder();
  const clarifyStream = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "done", data: clarifyingData })}\n\n`));
      controller.close();
    },
  });
  return new Response(clarifyStream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

// IMAGE UPLOAD: occasion known → outfit feedback via vision
if (isImageUpload && imageOccasion) {
  const outfitFeedbackSystem = [
    personaSystem.trim(),
    "",
    "IMAGE ANALYSIS MODE:",
    "The user has shared a photo of an outfit. Your job is to analyze it and give direct, editorial feedback.",
    "- Look at the silhouette, color palette, fit, and styling choices.",
    "- Tell them what's working and what one or two things would elevate it.",
    "- Be specific — reference actual elements from the image.",
    "- Warm, confident, opinionated. Like a trusted stylist friend who has seen it all.",
    "Return VALID JSON only. No markdown. No extra commentary.",
    "",
    `OUTPUT CONTRACT:
{
  "responseType": "outfit_feedback",
  "intent": "${imageOccasion}",
  "title": "Outfit Read",
  "sections": [
    { "key": "intro", "content": ["Your overall impression in 1-2 direct sentences."] },
    { "key": "style_notes", "content": ["What's working.", "What to change or add.", "Optional third observation."] },
    { "key": "next_questions", "content": ["One follow-up styling question or suggestion."] }
  ]
}`,
    "RULES: Never mention brands. Never mention budget. Keep style_notes to 2-3 items. Do not comment on nails. Do not suggest adding a belt as a styling solution.",
  ].join("\n");

  const convHistory = Array.isArray(payload?.conversationHistory) ? payload.conversationHistory : [];
  const visionMessages: any[] = [
    { role: "system", content: outfitFeedbackSystem },
    ...convHistory
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => ({ role: m.role, content: m.content || "" })),
    {
      role: "user",
      content: [
        { type: "text", text: userQuery || "What do you think of this outfit?" },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } },
      ],
    },
  ];

  const encoder = new TextEncoder();
  const visionStream = new ReadableStream({
    async start(controller) {
      const send = (event: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: visionMessages,
          temperature: 0.7,
          stream: true,
        });
        let raw = "";
        for await (const chunk of completion) {
          raw += chunk.choices[0]?.delta?.content ?? "";
        }
        const parsed = safeParseJson(raw);
        if (!parsed.ok) { send({ type: "error", detail: parsed.error }); controller.close(); return; }
        try {
          assertValidLlmResponse(parsed.value, { responseType: "outfit_feedback", intent: imageOccasion! });
        } catch (e: any) {
          send({ type: "error", detail: e?.message }); controller.close(); return;
        }
        send({ type: "done", data: parsed.value });
      } catch (err: any) {
        send({ type: "error", detail: err?.message });
      }
      controller.close();
    },
  });
  return new Response(visionStream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

if (!resolvedIntent) {
  const hasAnchor = Boolean(priorIntent);

  if (!hasAnchor && isObviouslyNonFashion(userQuery)) {
    return NextResponse.json({
      intent: "unsupported",
      message: "I focus on personal style and outfits. What are we styling today?",
    });
  }

  return NextResponse.json({
    intent: "unknown",
    message: "What are we dressing for — work, a date, a wedding, or something social?",
  });
}


    const { system: intentSystem, user: intentUser } = buildIntentPromptPack({
      intent: resolvedIntent,
      userQuery,
      mode: effectiveMode,
      focusSlot,
      userContext,
      isWardrobeGap,
      isWardrobeGapFollowup,
      wardrobeGapShownItems,
    });

    // Journey stage tone directive — adjusts how much explanation/hand-holding to give
    const journeyToneMap: Record<string, string> = {
      discovering: `USER CONTEXT: This user is new to getting styled and still figuring out what works for them — an unsure dresser who needs more guidance than most.
- Be warm, reassuring, and easy to follow. They may not know style terminology.
- In outfit descriptions, briefly explain WHY the look works (e.g. "the knee highs elongate the leg", "this proportion balances a fitted top with volume below").
- In the style_notes section, include one practical tip they can act on immediately (e.g. "start with all-black as your base — it's the easiest way to look intentional").
- In next_questions, be encouraging and open-ended — invite them to share more about their life so you can help them better.
- Avoid assuming they own specific pieces. Be inclusive about what "counts."`,
      exploring: "USER CONTEXT: This user has some style awareness but is still building confidence. Balance editorial direction with brief explanations where helpful.",
      developing: "USER CONTEXT: This user is style-aware and engaged — they've uploaded outfits and ask specific questions. Skip basic explanations. Be direct and editorial. They can handle a strong point of view.",
      confident: "USER CONTEXT: This user is highly fashion-literate. Treat them as a peer. Use precise style language, reference silhouettes and proportions directly, skip any hand-holding.",
    };
    const journeyDirective = journeyToneMap[journeyStage] ?? journeyToneMap["exploring"];

    // Add a small hard reminder at the system-level too (belt + suspenders)
    const hardContractReminder = `
HARD REMINDER:
- responseType MUST be "${responseType}".
- If responseType is "followup", DO NOT output any "options" arrays anywhere.
`.trim();

    const systemMessage = [personaSystem.trim(), journeyDirective, SEASONAL_TRENDS, intentSystem.trim(), hardContractReminder].join(
      "\n\n"
    );

    // Build messages array with conversation history
    const conversationHistory = Array.isArray(payload?.conversationHistory)
      ? payload.conversationHistory
      : [];

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemMessage }
    ];

    // Add previous conversation turns
    for (const msg of conversationHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role,
          content: msg.content || ""
        });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: intentUser });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages,
            temperature: 0.7,
            stream: true,
          });

          let raw = "";

          for await (const chunk of completion) {
            raw += chunk.choices[0]?.delta?.content ?? "";
          }

          const parsed = safeParseJson(raw);
          if (!parsed.ok) {
            send({ type: "error", detail: parsed.error });
            controller.close();
            return;
          }

          try {
            assertValidLlmResponse(parsed.value, { responseType, intent: resolvedIntent, focusSlot });
          } catch (e: any) {
            send({ type: "error", detail: e?.message });
            controller.close();
            return;
          }

          let inspirationImages: string[] | undefined;
          if (responseType === "initial") {
            const curatedSection = parsed.value.sections.find((s: any) => s.key === "curated_looks");
            if (curatedSection && "options" in curatedSection) {
              const usedUrls: string[] = [];
              const images = (curatedSection.options as any[]).map((option) => {
                const url = getImageForSlot(resolvedIntent, userContext?.location, option.slot as 1 | 2 | 3, option.imageHint, usedUrls);
                if (url) usedUrls.push(url);
                return url;
              });
              if (images.some((url: string) => url)) inspirationImages = images;
            }
          }

          send({ type: "done", data: { ...parsed.value, ...(inspirationImages && { inspirationImages }) } });
        } catch (err: any) {
          send({ type: "error", detail: err?.message });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (error: any) {
    console.error("OpenAI Error:", error?.message ?? error);
    console.error("Stack:", error?.stack);
    return NextResponse.json(
      { error: "Server error while generating outfit response.", detail: error?.message },
      { status: 500 }
    );
  }
}


function isObviouslyNonFashion(text: string): boolean {
  const t = normalize(text);

  const obviousNonFashion = [
    "coffee",
    "cafe",
    "restaurant",
    "food",
    "tacos",
    "pizza",
    "flight",
    "hotel",
    "uber",
    "lyft",
    "laptop",
    "computer",
    "phone",
    "crypto",
    "stock",
    "tax",
    "mortgage",
  ];

  return obviousNonFashion.some((k) => t.includes(k));
}
