/**
 * Eval runner — calls the deployed API for each test case and saves results.
 *
 * Usage:
 *   BASE_URL=https://your-app.vercel.app node scripts/run-evals.mjs
 *
 * Skips test cases marked requires_image: true (manual testing required).
 * Results saved to evals/results/run-{timestamp}.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BASE_URL = process.env.BASE_URL?.replace(/\/$/, "");
if (!BASE_URL) {
  console.error("ERROR: Set BASE_URL env var. E.g.:\n  BASE_URL=https://your-app.vercel.app node scripts/run-evals.mjs");
  process.exit(1);
}

const testCases = JSON.parse(fs.readFileSync(path.join(ROOT, "evals/test-cases.json"), "utf8"));
const limitArg = process.argv.find(a => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;
const runnable = testCases.filter((tc) => !tc.requires_image).slice(0, limit);

console.log(`Running ${runnable.length} test cases against ${BASE_URL}\n`);

async function parseSSEResponse(response) {
  const text = await response.text();

  // Try SSE format first (data: {...})
  const lines = text.split("\n");
  let lastData = null;
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        lastData = JSON.parse(line.slice(6));
      } catch {
        // skip malformed lines
      }
    }
  }
  if (lastData) return lastData;

  // Fall back to plain JSON (some API paths return NextResponse.json directly)
  try {
    const json = JSON.parse(text);
    return { type: "done", data: json };
  } catch {
    // not JSON either
  }

  return { type: "error", detail: `Unparseable response (first 300 chars): ${text.slice(0, 300)}` };
}

function summarizeResponse(data) {
  if (!data) return "";
  if (data.responseType === "clarifying") return data.question || "";
  if (data.responseType === "wardrobe_gap") return data.intro || "";
  if (data.title) return data.title;
  if (data.question) return data.question;
  return JSON.stringify(data).slice(0, 200);
}

function fullResponseText(data) {
  if (!data) return "";
  if (data.responseType === "clarifying") {
    return `[Clarifying question] ${data.question || ""}`;
  }
  if (data.responseType === "wardrobe_gap") {
    const parts = [data.intro];
    if (data.gaps) parts.push(...data.gaps.map((g) => `• ${g.item}: ${g.reason}`));
    return parts.filter(Boolean).join("\n");
  }
  if (data.sections) {
    return data.sections
      .map((s) => `[${s.label}]\n${s.body}`)
      .join("\n\n");
  }
  return JSON.stringify(data, null, 2).slice(0, 1000);
}

async function runTestCase(tc) {
  const payload = {
    userQuery: tc.userQuery,
    personaId: "brutal-editor",
    mode: "initial",
    isWardrobeGap: tc.isWardrobeGap || false,
  };

  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { ...tc, status: "error", error: `HTTP ${res.status}`, latencyMs, response: null };
    }

    const event = await parseSSEResponse(res);

    if (event.type === "error") {
      return { ...tc, status: "error", error: event.detail, latencyMs, response: null };
    }

    if (event.type === "done") {
      return {
        ...tc,
        status: "ok",
        latencyMs,
        responseType: event.data?.responseType || "unknown",
        responseSummary: summarizeResponse(event.data),
        responseText: fullResponseText(event.data),
        rawResponse: event.data,
      };
    }

    return { ...tc, status: "error", error: "Unexpected event type: " + event.type, latencyMs, response: null };
  } catch (err) {
    return { ...tc, status: "error", error: err.message, latencyMs: Date.now() - start, response: null };
  }
}

const results = [];
for (let i = 0; i < runnable.length; i++) {
  const tc = runnable[i];
  process.stdout.write(`[${i + 1}/${runnable.length}] ${tc.id} (${tc.persona} / ${tc.intent})... `);

  const result = await runTestCase(tc);
  results.push(result);

  if (result.status === "ok") {
    console.log(`✓ ${result.responseType} (${result.latencyMs}ms)`);
  } else {
    console.log(`✗ ERROR: ${result.error}`);
  }

  // Small delay to avoid hammering the API
  if (i < runnable.length - 1) await new Promise((r) => setTimeout(r, 300));
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = path.join(ROOT, `evals/results/run-${timestamp}.json`);
fs.mkdirSync(path.join(ROOT, "evals/results"), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

const passed = results.filter((r) => r.status === "ok").length;
const failed = results.filter((r) => r.status === "error").length;

console.log(`\nDone. ${passed} ok, ${failed} errors.`);
console.log(`Results saved to: ${outPath}`);
console.log(`\nNext: node scripts/generate-csv.mjs ${outPath}`);
