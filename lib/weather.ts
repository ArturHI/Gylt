// Everything that talks to the National Weather Service lives in this file.
//
// The NWS API is free and needs no key. It works in two steps:
//   1. /points/{lat},{lon} says which forecast grid square a location is in.
//   2. That square has a forecast URL and an hourly forecast URL.
import "server-only";

import { ServiceError } from "./service-error";
import type { WeatherDay, WeatherResponse } from "./types";

// Norman, Oklahoma. Override with WEATHER_LATITUDE / WEATHER_LONGITUDE.
const DEFAULT_LATITUDE = 35.2226;
const DEFAULT_LONGITUDE = -97.4395;

const REQUEST_TIMEOUT_MS = 8000;
const DAYS_SHOWN = 3;

// NWS asks every client to identify itself. This is not a secret.
const USER_AGENT = "Gylt personal dashboard (github.com/ArturHI/Gylt)";

// Only the fields we read. NWS sends many more.
type NwsPoint = {
  properties: {
    forecast: string;
    forecastHourly: string;
    relativeLocation: { properties: { city: string; state: string } };
  };
};

type NwsPeriod = {
  /** Local time with its UTC offset, like "2026-10-10T06:00:00-05:00". */
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  shortForecast: string;
  probabilityOfPrecipitation?: { value: number | null };
};

type NwsForecast = { properties: { periods: NwsPeriod[] } };

type Place = {
  name: string;
  /** API addresses for the two forecasts. */
  forecastUrl: string;
  hourlyUrl: string;
  /** The forecast page a person would read. */
  pageUrl: string;
};

// A location never moves to a different grid square, so step 1 is done once
// and remembered for as long as the server process lives.
let cachedPlace: Place | null = null;

function readCoordinates(): { latitude: number; longitude: number } {
  const latitude = Number(process.env.WEATHER_LATITUDE ?? DEFAULT_LATITUDE);
  const longitude = Number(process.env.WEATHER_LONGITUDE ?? DEFAULT_LONGITUDE);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ServiceError(
      "not_configured",
      "WEATHER_LATITUDE and WEATHER_LONGITUDE should be numbers.",
    );
  }
  return { latitude, longitude };
}

async function nwsGet<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ServiceError("upstream_error", "Couldn't reach the weather service.");
  }

  if (response.status === 404) {
    // NWS only covers the United States.
    throw new ServiceError("not_configured", "No forecast is available for that location.");
  }
  if (!response.ok) {
    throw new ServiceError("upstream_error", "The weather service is having trouble right now.");
  }
  return (await response.json()) as T;
}

async function getPlace(): Promise<Place> {
  if (cachedPlace) return cachedPlace;

  const { latitude, longitude } = readCoordinates();
  // NWS rejects coordinates with more than four decimal places.
  const point = await nwsGet<NwsPoint>(
    `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
  );

  const { city, state } = point.properties.relativeLocation.properties;
  cachedPlace = {
    name: `${city}, ${state}`,
    forecastUrl: point.properties.forecast,
    hourlyUrl: point.properties.forecastHourly,
    pageUrl: `https://forecast.weather.gov/MapClick.php?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`,
  };
  return cachedPlace;
}

export async function getWeather(): Promise<WeatherResponse> {
  const place = await getPlace();

  // The two requests don't depend on each other, so they run at the same
  // time instead of one after the other. `units=si` asks for Celsius.
  const [hourly, daily] = await Promise.all([
    nwsGet<NwsForecast>(`${place.hourlyUrl}?units=si`),
    nwsGet<NwsForecast>(`${place.forecastUrl}?units=si`),
  ]);

  // Forecasts can be a little stale, so skip any period that already ended.
  const now = Date.now();
  const isCurrent = (period: NwsPeriod) => new Date(period.endTime).getTime() > now;

  const thisHour = hourly.properties.periods.find(isCurrent);
  if (!thisHour) {
    throw new ServiceError("upstream_error", "The weather service sent an empty forecast.");
  }

  return {
    location: place.name,
    forecastUrl: place.pageUrl,
    current: { temperature: thisHour.temperature, summary: thisHour.shortForecast },
    days: toWholeDays(daily.properties.periods.filter(isCurrent)).slice(0, DAYS_SHOWN),
  };
}

/**
 * NWS describes each day as two periods: a daytime one carrying the high,
 * followed by a night one carrying the low. This joins each pair into one
 * day. A period with no partner is left out, such as "Tonight" once today's
 * daytime period has already ended.
 */
function toWholeDays(periods: NwsPeriod[]): WeatherDay[] {
  const days: WeatherDay[] = [];

  for (let i = 0; i < periods.length - 1; i++) {
    const day = periods[i];
    const night = periods[i + 1];
    if (!day.isDaytime || night.isDaytime) continue;

    const chances = [day, night]
      .map((period) => period.probabilityOfPrecipitation?.value)
      .filter((value) => value != null);

    days.push({
      // The first ten characters are the date as it is at the forecast
      // location, because startTime is written in that place's local time.
      date: day.startTime.slice(0, 10),
      high: day.temperature,
      low: night.temperature,
      summary: day.shortForecast,
      precipitationChance: chances.length > 0 ? Math.max(...chances) : null,
    });
  }
  return days;
}
