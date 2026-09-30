/** The moderation console opens as its own page (?admin), separate from the app and its identities. */
const KEY = 'ana-admin';
const fromUrl = typeof location !== 'undefined' && new URLSearchParams(location.search).has('admin');
let fromSession = false;
try {
  fromSession = sessionStorage.getItem(KEY) === '1';
} catch {
  /* ignore */
}
export const ADMIN = fromUrl || fromSession;

export function openAdmin() {
  try {
    sessionStorage.setItem(KEY, '1');
    location.reload();
  } catch {
    const u = new URL(location.href);
    u.searchParams.set('admin', '');
    location.href = u.toString();
  }
}
export function closeAdmin() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  const u = new URL(location.href);
  u.searchParams.delete('admin');
  location.href = u.toString();
}
