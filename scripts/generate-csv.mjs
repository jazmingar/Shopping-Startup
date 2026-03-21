/**
 * Converts an eval results JSON file into a CSV for Google Sheets review.
 *
 * Usage:
 *   node scripts/generate-csv.mjs evals/results/run-2026-03-17T12-00-00.json
 *
 * Output: same path with .csv extension
 */

import fs from "fs";
import path from "path";

const resultsPath = process.argv[2];
if (!resultsPath) {
  console.error("Usage: node scripts/generate-csv.mjs <path-to-results.json>");
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

function formatResponse(raw) {
  if (!raw) return "";
  if (raw.responseType === "clarifying") return `[Clarifying question]\n${raw.question || ""}`;
  if (raw.responseType === "wardrobe_gap") {
    const parts = [raw.intro];
    if (raw.gaps) parts.push(...raw.gaps.map((g) => `• ${g.item}: ${g.reason}`));
    return parts.filter(Boolean).join("\n");
  }
  if (raw.sections) {
    return raw.sections.map((s) => {
      if (s.content) return `[${s.key}]\n${s.content.join(" ")}`;
      if (s.options) return `[${s.key}]\n${s.options.map((o) => `• ${o.title}: ${o.description}`).join("\n")}`;
      return `[${s.key}]`;
    }).join("\n\n");
  }
  return JSON.stringify(raw).slice(0, 500);
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/\r\n/g, " ").replace(/\n/g, " ").replace(/\r/g, " ");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const FAILURE_CATEGORIES = "tone_off | too_hedged | generic_advice | wrong_intent";

const headers = [
  "id",
  "cuj",
  "persona",
  "intent",
  "user_query",
  "response_type",
  "response_summary",
  "response_text",
  "status",
  "latency_ms",
  "pass_fail",
  `failure_category (${FAILURE_CATEGORIES})`,
  "notes",
];

const rows = results.map((r) => [
  r.id,
  r.cuj || "",
  r.persona,
  r.intent,
  r.userQuery,
  r.responseType || (r.status === "error" ? "ERROR" : ""),
  r.responseSummary || r.error || "",
  formatResponse(r.rawResponse) || r.error || "",
  r.status,
  r.latencyMs || "",
  "",
  "",
  "",
]);

const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

const outPath = resultsPath.replace(".json", ".csv");
fs.writeFileSync(outPath, csv);

console.log(`CSV written to: ${outPath}`);
console.log(`${results.length} rows. Import into Google Sheets to review.`);
