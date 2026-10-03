/*
 * Golden hour for a city, computed on the device (no network). A small surprise at the end of Home for
 * people who live by the light: "Golden hour in Hyderabad today: 5:33 to 6:01 pm".
 * Evening golden hour runs from the sun at 6° above the horizon to sunset (−0.833°), the usual definition.
 * Solar position: the standard low-precision formulas (accurate to about a minute, plenty here).
 */
const rad = Math.PI / 180;
const dayMs = 864e5;
const J1970 = 2440588;
const J2000 = 2451545;
const J0 = 0.0009;
const tilt = rad * 23.4397;

const toDays = (ms: number) => ms / dayMs - 0.5 + J1970 - J2000;
const fromJulian = (j: number) => (j + 0.5 - J1970) * dayMs;
const anomaly = (d: number) => rad * (357.5291 + 0.98560028 * d);
const longitude = (m: number) => m + rad * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m)) + rad * 102.9372 + Math.PI;
const transit = (ds: number, m: number, l: number) => J2000 + ds + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l);

/** When the setting sun crosses `altitude` degrees on the day of `dateMs`, or null if it never does. */
export function eveningCrossing(dateMs: number, lat: number, lon: number, altitude: number): number | null {
  const lw = rad * -lon;
  const phi = rad * lat;
  const n = Math.round(toDays(dateMs) - J0 - lw / (2 * Math.PI));
  const ds = J0 + lw / (2 * Math.PI) + n;
  const m = anomaly(ds);
  const l = longitude(m);
  const dec = Math.asin(Math.sin(tilt) * Math.sin(l));
  const x = (Math.sin(altitude * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (x < -1 || x > 1) return null;
  const w = Math.acos(x);
  return fromJulian(transit(J0 + (w + lw) / (2 * Math.PI) + n, m, l));
}

const CITIES: Record<string, [number, number]> = {
  Hyderabad: [17.385, 78.487],
  Mumbai: [19.076, 72.878],
  Kochi: [9.931, 76.267],
  Chennai: [13.083, 80.271],
  Visakhapatnam: [17.687, 83.218],
  Kolkata: [22.573, 88.364],
  Bengaluru: [12.972, 77.595],
  Delhi: [28.614, 77.209],
  Pune: [18.52, 73.857],
};

/** The city's evening golden hour today (or tomorrow, once today's has passed). Null for unknown cities. */
export function goldenHour(city: string, now = Date.now()): { start: number; end: number; day: 'today' | 'tomorrow' } | null {
  const c = CITIES[city.split(/[,·]/)[0].trim()];
  if (!c) return null;
  for (const [day, t] of [['today', now], ['tomorrow', now + dayMs]] as const) {
    const start = eveningCrossing(t, c[0], c[1], 6);
    const end = eveningCrossing(t, c[0], c[1], -0.833);
    if (start && end && end > now) return { start, end, day };
  }
  return null;
}

const fmt = (ms: number) => new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).replace(/\s?(am|pm)/i, (x) => x.toLowerCase().trim().replace(/^/, ' '));

/** "Golden hour in Hyderabad today: 5:33 to 6:01 pm". */
export function goldenHourLine(city: string, now = Date.now()): string | null {
  const g = goldenHour(city, now);
  if (!g) return null;
  const a = fmt(g.start).replace(/ (am|pm)$/, '');
  return `Golden hour in ${city.split(/[,·]/)[0].trim()} ${g.day}: ${a} to ${fmt(g.end)}`;
}
