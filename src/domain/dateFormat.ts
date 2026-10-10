/**
 * Cached date formatters. `toLocaleDateString` builds a new Intl formatter on every call, which is
 * slow enough to show up as a dropped frame when a screen of cards renders; one formatter per
 * locale and options is reused instead. Output is identical.
 */
const cache = new Map<string, Intl.DateTimeFormat>();

export function formatDate(ms: number | Date, locale: string, opts: Intl.DateTimeFormatOptions): string {
  const key = locale + JSON.stringify(opts);
  let f = cache.get(key);
  if (!f) cache.set(key, (f = new Intl.DateTimeFormat(locale, opts)));
  return f.format(ms);
}
