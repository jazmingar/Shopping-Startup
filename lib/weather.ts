// lib/weather.ts
// Weather fetching via Open-Meteo — free, no API key required.
//
// Two entry points:
//   fetchWeatherByCoords(lat, lon) — for browser geolocation
//   fetchWeatherByLocation(city)   — geocodes a city string, then fetches weather
//
// Both return a compact string e.g. "72°F, partly cloudy" or null on failure.

// ============================================
// WMO WEATHER CODE → HUMAN-READABLE
// ============================================

const WMO_CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "showers",
  82: "heavy showers",
  95: "thunderstorm",
  96: "thunderstorm",
  99: "thunderstorm",
};

function describeCode(code: number): string {
  return WMO_CODES[code] ?? "variable";
}

// ============================================
// FETCH BY COORDINATES
// ============================================

export async function fetchWeatherByCoords(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=fahrenheit&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const temp = Math.round(data?.current?.temperature_2m);
    const code = data?.current?.weathercode;

    if (temp == null || code == null) return null;

    return `${temp}°F, ${describeCode(code)}`;
  } catch {
    return null;
  }
}

// ============================================
// FETCH BY LOCATION STRING (geocode first)
// ============================================

export async function fetchWeatherByLocation(
  location: string
): Promise<string | null> {
  try {
    // Geocode the city name
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();

    const result = geoData?.results?.[0];
    if (!result?.latitude || !result?.longitude) return null;

    return fetchWeatherByCoords(result.latitude, result.longitude);
  } catch {
    return null;
  }
}
