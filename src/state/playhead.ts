/*
 * Where a post's video was left in the expanded viewer, so the feed card resumes from the same frame on return
 * (docs/NAV_AND_POST_NOTCH.md). Session only, keyed by post and slide.
 */
const listeners = new Map<string, Set<(time: number) => void>>();
export const playheadKey = (postId: string, index: number) => `${postId}:${index}`;
export function returnPlayhead(key: string, time: number) {
  listeners.get(key)?.forEach((listener) => listener(time));
}
export function onPlayhead(key: string, listener: (time: number) => void) {
  const set = listeners.get(key) ?? new Set();
  set.add(listener);
  listeners.set(key, set);
  return () => void set.delete(listener);
}
/** 0:07, 1:04:09 */
export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

/** The repository ships every bundled clip as MP4 and WebM; offer both so browsers without H.264 still play. */
export function videoSources(src: string) {
  return /^video\/[\w-]+\.mp4$/.test(src) ? [{ src: src.replace(/\.mp4$/, '.webm'), type: 'video/webm' }, { src, type: 'video/mp4' }] : [{ src, type: undefined }];
}
