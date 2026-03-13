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
You are "The Executive Editor"—a Vogue editor with 25 years of experience.
TONE: Sophisticated, authoritative, and direct. No fluff, just expert guidance.
AESTHETIC: Quiet Luxury, minimalist, architectural. Think Khaite, Bottega Veneta, The Row, Frankie Shop, Victoria Beckham vibes (but never mention brand names).
BEHAVIOR: Always look for opportunities to elevate the look. Stay current on 2026 trends.
VOICE: Confident, decisive, refined. "This is the only option." "Elevate this with..." "The proportions here are key."
RULES:
- Never mention specific brand names.
- Never mention budget.
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
- Do not output markdown. Do not output bullet symbols like "•".
- You MUST output valid JSON only, matching the required schema.
`,
};

// --- Week 2: Pure intent mapping (persona must NOT affect intent) ---
function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
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
    t.includes("professional")
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
    (t.includes("dinner") && t.includes("friends"))
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

  // "clarifying" is a valid alternative when "initial" was expected —
  // the LLM decided it needs one more signal before showing looks.
  const isClarifying = data.responseType === "clarifying";
  if (data.responseType !== expected.responseType && !isClarifying) {
    throw new Error(`Wrong responseType. Expected ${expected.responseType}`);
  }

  if (data.intent !== expected.intent) {
    throw new Error(`Wrong intent. Expected ${expected.intent}`);
  }

  if (!Array.isArray(data.sections)) {
    throw new Error("sections must be an array");
  }

  const curated = data.sections.find((s: any) => s?.key === "curated_looks");

  // Skip curated_looks validation for clarifying responses (they intentionally have none)
  if (expected.responseType === "initial" && !isClarifying) {
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
    // followups MUST NOT include options arrays anywhere
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


    const responseType: ResponseType =
      effectiveMode === "refine" ? "followup" : "initial";

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
  !payload?.focusSlot
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



if (!resolvedIntent) {
  const hasAnchor = Boolean(priorIntent);

  // Only reject if there's no conversation anchor AND it's obviously not fashion
  if (!hasAnchor && isObviouslyNonFashion(userQuery)) {
    return NextResponse.json({
      intent: "unsupported",
      message:
       "I focus on personal style and outfits. What are we styling today?",
    });
  }

  // Otherwise: assume it's fashion but unclear
  return NextResponse.json({
    intent: "unknown",
    message:
      "What are we dressing for — work, a date, a wedding, or something social?",
  });
}


    // Build intent pack (now includes mode + focusSlot)
    const { system: intentSystem, user: intentUser } = buildIntentPromptPack({
      intent: resolvedIntent,
      userQuery,
      mode: effectiveMode,
      focusSlot,
      userContext,
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages,
      temperature: 0.7,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = safeParseJson(raw);

    if (!parsed.ok) {
      console.error("[json-parse-failed]", { error: parsed.error, raw });
      return NextResponse.json(
        { error: "Model returned invalid JSON", detail: parsed.error, raw },
        { status: 500 }
      );
    }

    try {
      assertValidLlmResponse(parsed.value, {
        responseType,
        intent: resolvedIntent,
        focusSlot,
      });
    } catch (e: any) {
      console.error("[schema-invalid]", { error: e?.message, raw, parsed: parsed.value });
      return NextResponse.json(
        { error: "Model returned JSON that does not match schema", detail: e?.message, raw },
        { status: 500 }
      );
    }

    // For initial responses only, look up one image per slot using the LLM's imageHint.
    // If no hint or no match, that slot gets an empty string (no image shown).
    let inspirationImages: string[] | undefined;
    if (responseType === "initial") {
      const curatedSection = parsed.value.sections.find(
        (s: any) => s.key === "curated_looks"
      );
      if (curatedSection && "options" in curatedSection) {
        const usedUrls: string[] = [];
        const images = (curatedSection.options as any[]).map((option) => {
          const url = getImageForSlot(
            resolvedIntent,
            userContext?.location,
            option.slot as 1 | 2 | 3,
            option.imageHint,
            usedUrls
          );
          if (url) usedUrls.push(url);
          return url;
        });
        // Only attach if at least one slot has an image
        if (images.some((url: string) => url)) {
          inspirationImages = images;
        }
      }
    }

    return NextResponse.json({ ...parsed.value, ...(inspirationImages && { inspirationImages }) });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return NextResponse.json(
      { error: "Server error while generating outfit response." },
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
