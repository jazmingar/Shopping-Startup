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
AESTHETIC: Modern, elevated, wearable. You know what's trending but you prioritize what actually works. Clean silhouettes, intentional styling, pieces that last more than one season.
BEHAVIOR: Give a clear recommendation. Don't hedge. If something is a strong choice, say so. If there's one look that's clearly the best, lead with it. Think like a stylist who has seen it all and knows exactly what works.
VOICE: Conversational and confident. Speak like a trusted expert giving advice to a friend — never clinical, never generic. "This is the move." "Trust the proportion here." "One swap makes this outfit."
RULES:
- Never mention specific brand names.
- Never mention budget.
- Do not suggest adding a belt as a styling solution.
- Do not output markdown. Do not output bullet symbols like "•".
- You MUST output valid JSON only, matching the required schema.
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

// --- Week 2: Pure intent mapping (persona must NOT affect intent) ---
function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

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

function resolveIntentFromText(userText: string): Intent | null {
  const t = normalize(userText);

  // wedding signals (highest priority for specificity)
  if (
    t.includes("wedding") ||
    t.includes("bridal") ||
    t.includes("bachelorette") ||
    t.includes("rehearsal") ||
    t.includes("engagement")
  )
    return "wedding_event";

  // travel signals
  if (
    t.includes("travel") ||
    t.includes("trip") ||
    t.includes("vacation") ||
    t.includes("girls trip") ||
    t.includes("ski trip") ||
    t.includes("beach trip") ||
    t.includes("going to") ||
    t.includes("flying to") ||
    t.includes("packing for") ||
    (t.includes("weekend") && (t.includes("away") || t.includes("getaway")))
  )
    return "travel";

  // pregnancy signals
  if (
    t.includes("pregnant") ||
    t.includes("pregnancy") ||
    t.includes("maternity") ||
    t.includes("expecting") ||
    t.includes("baby shower") ||
    t.includes("trimester") ||
    t.includes("postpartum") ||
    t.includes("nursing")
  )
    return "pregnancy";

  // work/professional signals
  if (
    t.includes("work") ||
    t.includes("office") ||
    t.includes("meeting") ||
    t.includes("client") ||
    t.includes("presentation") ||
    t.includes("conference") ||
    t.includes("interview") ||
    t.includes("professional") ||
    t.includes("job") ||
    t.includes("startup") ||
    t.includes("salary") ||
    t.includes("networking") ||
    t.includes("business casual") ||
    t.includes("smart casual") ||
    t.includes("dress code") ||
    t.includes("panel") ||
    t.includes("promoted") ||
    t.includes("promotion")
  )
    return "professional";

  // date signals
  if (
    t.includes("date") ||
    t.includes("first date") ||
    t.includes("date night") ||
    t.includes("hinge") ||
    t.includes("bumble") ||
    t.includes("tinder")
  )
    return "date";

  // seasonality signals
  if (
    t.includes("fall") ||
    t.includes("winter") ||
    t.includes("spring") ||
    t.includes("summer") ||
    t.includes("autumn") ||
    t.includes("seasonal") ||
    t.includes("halloween") ||
    t.includes("trend")
  )
    return "seasonality";

  // social signals (lower priority, more generic)
  if (
    t.includes("night out") ||
    t.includes("going out") ||
    t.includes("club") ||
    t.includes("bar") ||
    t.includes("concert") ||
    t.includes("party") ||
    t.includes("girls night") ||
    t.includes("brunch") ||
    t.includes("rooftop") ||
    t.includes("birthday") ||
    t.includes("bbq") ||
    t.includes("cookout") ||
    t.includes("gala") ||
    t.includes("invited") ||
    (t.includes("dinner") && (t.includes("friend") || t.includes("girls"))) ||
    (t.includes("girls") && (t.includes("night") || t.includes("out") || t.includes("dinner") || t.includes("brunch")))
  )
    return "social";

  // Generic fashion/outfit requests (catch-all fallback)
  // Match any generic request that mentions outfit, style, wear, dress, look, etc.
  if (
    t.includes("outfit") ||
    t.includes("wear") ||
    t.includes("style") ||
    t.includes("dress") ||
    t.includes("look") ||
    t.includes("clothes") ||
    t.includes("fashion") ||
    t.includes("help")
  )
    return "social";

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

    // Add a small hard reminder at the system-level too (belt + suspenders)
    const hardContractReminder = `
HARD REMINDER:
- responseType MUST be "${responseType}".
- If responseType is "followup", DO NOT output any "options" arrays anywhere.
`.trim();

    const systemMessage = [personaSystem.trim(), intentSystem.trim(), hardContractReminder].join(
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
