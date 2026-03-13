// lib/location.ts - Location detection and storage

export interface TravelHistory {
  destination: string;
  timestamp: string;
  context?: string;
}

export interface LocationData {
  homeLocation: string | null;
  travelHistory: TravelHistory[];
}

// ============================================
// GLOBAL TRENDS (Updated seasonally)
// ============================================

export const globalTrends = {
  2026: [
    "Monochromatic dressing — head-to-toe in one color, especially all-black, all-cream, all-brown, or all grey",
    "Oversized blazers (single color, pin striped) — the single most universal piece right now across every city. Blazers with shoulder pads are also in",
    "Chocolate brown and mocha tones as a neutral",
    "Ballet flats (think styles from Le Monde Beryl), pointed-toe kitten heels, and black loafers as the dominant shoe styles",
    "Quiet luxury moving toward 'loud luxury' — minimalism with one maximalist statement",
    "Animal print as a neutral, not a statement. Leopard print coat, bag, or shoes is a global staple. Leopard sneakers are the new white sneaker.",
    "Wide-leg trousers as the default pant silhouette. No skinny jeans.",
    "Statement draping (dress or top) and asymmetrical cuts",
    "Elevated leather jackets with modern details — cinched waist, funnel neck",
    "Cool, laid back style: colorful sneakers and a tshirt",
    "Lace detail - lace tops, dresses, and skirts",
    "The bandana print scarf (e.g. Kujten) is the must-have accessory of the season",
    "For locations that are cold: colorful beanies (e.g. cobalt blue, red) to add a pop of color, faux fur outerwear, and penny lanen coats",
    "For warm locations (e.g. european summer vacations) and summer: knit dresses, cut-out details, and layered gold jewelry. Pucci-inspired prints and Missoni-inspired patterns are also trending for summer"
  ]
}

// ============================================
// CITY AESTHETICS
// ============================================

export interface CityAestheticData {
  aesthetic: string;
  exampleOutfits: string[];
}

export const CITY_AESTHETICS: Record<string, CityAestheticData> = {

  "New York": {
    aesthetic: "All-black downtown cool. Sharp, intentional, and polished. New York dresses like it has somewhere important to be — and it always does.",
    exampleOutfits: [
      "bodysuit (longsleeve in the winter, mock neck, black or animal print) + high-rise jeans + booties (e.g. pointed or square toe)",
      "all black - oversized blazer + mini skirt + knee high boots + sheer sheer tights",
      "monochromatic look — wide-leg trouser + fitted top + boot"
    ]
  },

"Los Angeles": {
    aesthetic: "Laid-back California cool with a glamorous edge. LA style is about looking effortlessly chic — think elevated basics (like relaxed jeans), statement accessories, and a touch of downtown edge. Athelisure is popular (e.g. Alo set).",
    exampleOutfits: [
      "wide-leg trouser + fitted tank or bodysuit + layered gold jewelry",
      "lace slip dress + sandal + minimal gold jewelry + sunglasses",
      "relaxed jeans + cropped baby tee + ballet flat or sneakers",
      "matching Revolve set + sandal + slicked-back hair"
    ]
  },

  "Miami": {
    aesthetic: "Miami dresses to be seen — bold color, skin-forward silhouettes, and a Revolve-meets-Latin-energy that's always slightly dressed up.",
    exampleOutfits: [
      "knit or crotchet maxi dress, cut out details optional + sandal + layered gold jewelry",
      "prints (matching two-piece set in a bold print, maxi dress, mini dress) + barely-there sandal + stacked jewelry",
      "Cult Gaia-inspirted and Missoni-inspired outfits",
      "two-piece set in a bold color or print with a bathing suit top underneath + strappy sandal + layered jewelry"
    ]
  },

  "Paris": {
    aesthetic: "Effortless and deeply personal. The Parisienne never looks assemble and her outfit is always unexpected. She mixes high and low, vintage and modern, basics and statement pieces in a way that looks completely natural — but is actually very intentional. Patterns, textures, and unexpected details are all part of the mix. No athleisure and no tight clothing.",
    exampleOutfits: [
      "straight-leg jeans + striped top + ballet flat + scarf (e.g. silk or banadana scarf)",
      "tailored blazer + relaxed wide-leg trouser or jeans + sneakers + minimal bag",
      "statement collar (blouse, blazer, or dress) + simple trouser or skirt + flat or low heel",
      "mixing unexpected textures — e.g. leather jacket + silk slip dress + ankle boot"
    ]
  },

  "London": {
    aesthetic: "Eclectic, era-mixing, slightly irreverent. London dresses with wit — heritage and edge in the same outfit, never boring, never too polished.",
    exampleOutfits: [
      "pleated  skirt + leather bomber jacket + brown suede knee-high boots",
      "slip skirt + crisp white button-down + cropped blazer + pointed kitten heel",
      "argyle tights + mini skirt + oversized coat + chunky loafer"
    ]
  },

  "Milan": {
    aesthetic: "Architecturally precise, luxurious, and quietly authoritative. Milanese style is impeccable tailoring and rich fabrics — never accidental, never casual.",
    exampleOutfits: [
      "wide-leg camel trousers + fitted black turtleneck + suede loafer + structured bag",
      "pinstripe midi skirt + cream silk blouse + pointed kitten heel",
      "chocolate brown leather blazer + matching trouser + simple matte flat"
    ]
  },

  "Copenhagen": {
    aesthetic: "Whimsical Scandi cool with genuine individuality. Copenhagen is where quiet luxury goes to loosen up — directional but wearable, always with an unexpected twist.",
    exampleOutfits: [
      "leopard print coat + all-black outfit underneath + ballet flat",
      "wide-leg tailored trousers + bow-detail blouse + kitten heel + oversized bag",
      "oversized blazer + lace-trim skirt + chunky loafer + vintage accessory"
    ]
  },

  "Dubai": {
    aesthetic: "Opulent, maximalist, and unapologetically glamorous. Dubai dresses for the occasion — and the occasion is always elevated. Designer-forward, embellished, and polished.",
    exampleOutfits: [
      "embellished column dress + gold statement jewelry + heel",
      "silk wide-leg trouser + structured blazer + designer top-handle bag",
      "dramatic maxi in rich jewel tone + gold accessories + pointed mule"
    ]
  },

  "Spain": {
    aesthetic: "Warm, confident, and effortlessly feminine. Spanish style has a boldness that's neither trying too hard nor playing it safe — vibrant color, flowing silhouettes, and always a great accessory.",
    exampleOutfits: [
      "bold-colored linen wide-leg trouser + fitted top + sandal + oversized sunglasses",
      "flowy wrap dress in terracotta or deep red + block-heel mule + statement earrings",
      "tailored blazer in a rich color + straight jeans + pointed flat + artisan bag"
    ]
  },

  "Mexico City": {
    aesthetic: "Artful, culturally layered, and effortlessly cool. CDMX has a creative energy that mixes vintage with contemporary, color with restraint — always individual, never generic.",
    exampleOutfits: [
      "vintage-inspired midi skirt + fitted top + woven sandal + artisan jewelry",
      "wide-leg trouser + breezy linen top + leather sandal + woven tote",
      "bold print dress + simple flat + single statement earring"
    ]
  },

  "Tokyo": {
    aesthetic: "Fearless self-expression where the rules don't apply. Tokyo is the one city where the most experimental choice is usually the correct one — precision layering, unexpected textures, and impeccable execution.",
    exampleOutfits: [
      "oversized technical jacket + pleated midi skirt + chunky platform",
      "sheer layered top + wide-leg tailored trouser + architectural flat",
      "all-neutral minimal base + one maximalist statement coat or accessory"
    ]
  },

  "Singapore": {
    aesthetic: "Tropical sophistication — humidity-proof but always polished. Singapore dresses with precision, favoring clean silhouettes and quality fabrics that hold up in the heat.",
    exampleOutfits: [
      "silk wide-leg trouser + fitted tank + pointed-toe mule + minimal gold jewelry",
      "linen shift dress + strappy flat sandal + structured top-handle bag",
      "relaxed linen co-ord in white or ecru + block-heel sandal"
    ]
  }

}


/**
 * Get city aesthetic description for styling context
 */
export function getCityAesthetic(location: string): string | null {
  // Try exact match first
  if (CITY_AESTHETICS[location]) {
    const cityData = CITY_AESTHETICS[location];
    return formatCityAesthetic(cityData);
  }

  // Try partial match (e.g., "New York City" matches "New York")
  const normalizedLocation = location.toLowerCase();
  for (const [city, cityData] of Object.entries(CITY_AESTHETICS)) {
    if (normalizedLocation.includes(city.toLowerCase()) || city.toLowerCase().includes(normalizedLocation)) {
      return formatCityAesthetic(cityData);
    }
  }

  return null;
}

/**
 * Format city aesthetic data into a string for the LLM prompt
 */
function formatCityAesthetic(cityData: CityAestheticData): string {
  const outfitExamples = cityData.exampleOutfits
    .map((outfit, i) => `${i + 1}. ${outfit}`)
    .join("\n");

  return `${cityData.aesthetic}\n\nExample outfits:\n${outfitExamples}`;
}

// localStorage keys
const HOME_LOCATION_KEY = "shopping-mvp-home-location";
const TRAVEL_HISTORY_KEY = "shopping-mvp-travel-history";

// --- HOME LOCATION ---

export function getHomeLocation(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(HOME_LOCATION_KEY);
}

export function setHomeLocation(location: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HOME_LOCATION_KEY, location);
}

// --- TRAVEL HISTORY ---

export function getTravelHistory(): TravelHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(TRAVEL_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addTravelDestination(destination: string, context?: string): void {
  if (typeof window === "undefined") return;

  const history = getTravelHistory();
  const newEntry: TravelHistory = {
    destination,
    timestamp: new Date().toISOString(),
    context,
  };

  // Add to beginning (most recent first)
  history.unshift(newEntry);

  // Keep only last 20 trips
  const trimmed = history.slice(0, 20);

  localStorage.setItem(TRAVEL_HISTORY_KEY, JSON.stringify(trimmed));
}

// --- LOCATION DETECTION ---

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Detect if user is mentioning their home location
 * Patterns: "I live in...", "I'm based in...", "I'm from..."
 */
export function detectHomeLocation(text: string): string | null {
  const t = normalize(text);

  // Patterns for home location
  const homePatterns = [
    /\b(?:i live in|i'm in|im in|based in|i'm based in|im based in|i'm from|im from)\s+([a-z\s]+?)(?:\s+and|\s+but|\s*,|\s*\.|\s*$)/,
  ];

  for (const pattern of homePatterns) {
    const match = t.match(pattern);
    if (match && match[1]) {
      return capitalizeLocation(match[1].trim());
    }
  }

  return null;
}

/**
 * Detect if user is mentioning travel/temporary location
 * Patterns: "traveling to...", "going to...", "trip to...", "wedding in..."
 */
export function detectTravelLocation(text: string): { destination: string; context?: string } | null {
  const t = normalize(text);

  // Travel patterns with context
  const patterns = [
    { regex: /\b(?:traveling to|travelling to|going to|flying to)\s+([a-z\s]+?)(?:\s+for|\s+in|\s*,|\s*\.|\s*$)/, context: "travel" },
    { regex: /\b(?:trip to|vacation to|holiday to)\s+([a-z\s]+?)(?:\s+for|\s+in|\s*,|\s*\.|\s*$)/, context: "trip" },
    { regex: /\b(?:wedding in|bachelorette in)\s+([a-z\s]+?)(?:\s+and|\s*,|\s*\.|\s*$)/, context: "wedding" },
    { regex: /\b(?:conference in|meeting in)\s+([a-z\s]+?)(?:\s+and|\s*,|\s*\.|\s*$)/, context: "work" },
  ];

  for (const { regex, context } of patterns) {
    const match = t.match(regex);
    if (match && match[1]) {
      return {
        destination: capitalizeLocation(match[1].trim()),
        context,
      };
    }
  }

  return null;
}

/**
 * Capitalize location name properly
 * "new york" -> "New York"
 */
function capitalizeLocation(location: string): string {
  return location
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get the effective location for the current request
 * Priority: travel location > home location > null
 */
export function getEffectiveLocation(userQuery: string): {
  location: string | null;
  isTravel: boolean;
  context?: string;
} {
  // Check for travel location first
  const travelLocation = detectTravelLocation(userQuery);
  if (travelLocation) {
    return {
      location: travelLocation.destination,
      isTravel: true,
      context: travelLocation.context,
    };
  }

  // Check for home location mention
  const homeLocationMention = detectHomeLocation(userQuery);
  if (homeLocationMention) {
    return {
      location: homeLocationMention,
      isTravel: false,
    };
  }

  // Fall back to stored home location
  const storedHome = getHomeLocation();
  if (storedHome) {
    return {
      location: storedHome,
      isTravel: false,
    };
  }

  return {
    location: null,
    isTravel: false,
  };
}

/**
 * Get travel insights from history
 */
export function getTravelInsights(): {
  frequentDestinations: string[];
  isFrequentTraveler: boolean;
} {
  const history = getTravelHistory();

  if (history.length === 0) {
    return {
      frequentDestinations: [],
      isFrequentTraveler: false,
    };
  }

  // Count destination frequency
  const destinationCounts: Record<string, number> = {};
  history.forEach(trip => {
    destinationCounts[trip.destination] = (destinationCounts[trip.destination] || 0) + 1;
  });

  // Get top 3 destinations
  const frequentDestinations = Object.entries(destinationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dest]) => dest);

  // Frequent traveler if 5+ trips in history
  const isFrequentTraveler = history.length >= 5;

  return {
    frequentDestinations,
    isFrequentTraveler,
  };
}
