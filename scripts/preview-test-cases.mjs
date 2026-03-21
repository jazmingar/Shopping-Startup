import fs from "fs";
import path from "path";

const testCases = JSON.parse(fs.readFileSync("evals/test-cases.json", "utf8"));

const headers = ["id", "persona", "intent", "user_query", "requires_image", "image_notes"];

const rows = testCases.map((tc) => [
  tc.id,
  tc.persona,
  tc.intent,
  `"${tc.userQuery.replace(/"/g, '""')}"`,
  tc.requires_image ? "yes" : "no",
  tc.image_notes ? `"${tc.image_notes}"` : "",
]);

const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

fs.writeFileSync("evals/test-cases-preview.csv", csv);
console.log("✓ Written to evals/test-cases-preview.csv");
