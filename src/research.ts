/**
 * Research mode: the prototype as a product in a participant's hands. Opens as Aditi acting for
 * Konark Pictures, hides the prototype controls, and starts from the seed state on every load (nothing
 * persists), so reloading the page is a full reset between participants.
 * Enter: add ?research to the URL, or "Start research session" in the controls.
 * Exit: Shift+E, or remove ?research.
 */
const KEY = 'ana-research';
const fromUrl = typeof location !== 'undefined' && new URLSearchParams(location.search).has('research');
let fromSession = false;
try {
  fromSession = sessionStorage.getItem(KEY) === '1';
} catch {
  /* private mode: URL param still works */
}
export const RESEARCH = fromUrl || fromSession;

export function startResearch() {
  try {
    sessionStorage.setItem(KEY, '1');
    location.reload();
  } catch {
    // Storage blocked (for example inside an embedded frame): fall back to the URL parameter.
    const u = new URL(location.href);
    u.searchParams.set('research', '');
    location.href = u.toString();
  }
}
export function exitResearch() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  const u = new URL(location.href);
  u.searchParams.delete('research');
  location.href = u.toString();
}
