import type { Intent } from "@/lib/intent-structures";

export function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function resolveIntentFromText(userText: string): Intent | null {
  const t = normalize(userText);

  if (t.includes("wedding") || t.includes("bridal") || t.includes("bachelorette") || t.includes("rehearsal") || t.includes("engagement"))
    return "wedding_event";

  if (
    t.includes("travel") || t.includes("trip") || t.includes("vacation") ||
    t.includes("girls trip") || t.includes("ski trip") || t.includes("beach trip") ||
    t.includes("going to") || t.includes("flying to") || t.includes("packing for") ||
    (t.includes("weekend") && (t.includes("away") || t.includes("getaway")))
  )
    return "travel";

  if (
    t.includes("pregnant") || t.includes("pregnancy") || t.includes("maternity") ||
    t.includes("expecting") || t.includes("baby shower") || t.includes("trimester") ||
    t.includes("postpartum") || t.includes("nursing")
  )
    return "pregnancy";

  if (
    t.includes("work") || t.includes("office") || t.includes("meeting") ||
    t.includes("client") || t.includes("presentation") || t.includes("conference") ||
    t.includes("interview") || t.includes("professional") || t.includes("job") ||
    t.includes("startup") || t.includes("salary") || t.includes("networking") ||
    t.includes("business casual") || t.includes("smart casual") || t.includes("dress code") ||
    t.includes("panel") || t.includes("promoted") || t.includes("promotion")
  )
    return "professional";

  if (t.includes("date") || t.includes("first date") || t.includes("date night") || t.includes("hinge") || t.includes("bumble") || t.includes("tinder"))
    return "date";

  if (t.includes("fall") || t.includes("winter") || t.includes("spring") || t.includes("summer") || t.includes("autumn") || t.includes("seasonal") || t.includes("halloween") || t.includes("trend"))
    return "seasonality";

  if (
    t.includes("night out") || t.includes("going out") || t.includes("club") ||
    t.includes("bar") || t.includes("concert") || t.includes("party") ||
    t.includes("girls night") || t.includes("brunch") || t.includes("rooftop") ||
    t.includes("birthday") || t.includes("bbq") || t.includes("cookout") ||
    t.includes("gala") || t.includes("invited") ||
    (t.includes("dinner") && (t.includes("friend") || t.includes("girls"))) ||
    (t.includes("girls") && (t.includes("night") || t.includes("out") || t.includes("dinner") || t.includes("brunch")))
  )
    return "social";

  if (t.includes("outfit") || t.includes("wear") || t.includes("style") || t.includes("dress") || t.includes("look") || t.includes("clothes") || t.includes("fashion") || t.includes("help"))
    return "social";

  return null;
}
