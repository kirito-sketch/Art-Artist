/** Cover crop that keeps the chosen subject horizontally central and toward the clear upper image.
 * The crop never leaves uncovered edges. Wide frames with no vertical overflow cannot be panned vertically.
 */
export function profileHeroCrop(image: { width: number; height: number }, viewport: { width: number; height: number }, focal: { x: number; y: number }) {
  if (![image.width, image.height, viewport.width, viewport.height].every(n => Number.isFinite(n) && n > 0)) return { x: 50, y: 25 };
  const scale = Math.max(viewport.width / image.width, viewport.height / image.height);
  const position = (dimension: number, container: number, focus: number, target: number) => {
    const overflow = dimension * scale - container;
    if (overflow < .01) return 50;
    const safeFocus = Number.isFinite(focus) ? Math.max(0, Math.min(100, focus)) / 100 : .5;
    return Math.max(0, Math.min(100, (safeFocus * dimension * scale - target * container) / overflow * 100));
  };
  return { x: position(image.width, viewport.width, focal.x, .5), y: position(image.height, viewport.height, focal.y, .28) };
}

/** Find the least enlargement that fits a declared subject region above the identity.
 * Translation is clamped to covered edges. Impossible regions keep the best bounded crop;
 * the editor exposes subject sizing instead of pretending to detect faces automatically.
 */
export function protectedHeroFrame(image: { width: number; height: number }, viewport: { width: number; height: number }, focal: { x: number; y: number }, safeBottom: number, subjectHeight = 26, subjectWidth = 36) {
  if (![image.width, image.height, viewport.width, viewport.height].every(n => Number.isFinite(n) && n > 0)) return null;
  const finite = (n: number, fallback: number) => Number.isFinite(n) ? Math.max(0, Math.min(100, n)) / 100 : fallback;
  const fx = finite(focal.x, .5), fy = finite(focal.y, .35);
  const radius = Math.max(.04, Math.min(.25, finite(subjectHeight, .26) / 2));
  const horizontalRadius = Math.max(.02, Math.min(.3, finite(subjectWidth, .36) / 2));
  const top = Math.min(64, viewport.height * .1);
  const bottom = Math.max(top + 40, Math.min(viewport.height, safeBottom));
  const base = Math.max(viewport.width / image.width, viewport.height / image.height);
  let best: { width: number; height: number; x: number; y: number; protected: boolean; score: number } | null = null;
  for (let step = 0; step <= 65; step++) {
    const zoom = 1 + step / 100, width = image.width * base * zoom, height = image.height * base * zoom;
    const lower = Math.max(viewport.height - height, top - Math.max(0, fy - radius) * height);
    const upper = Math.min(0, bottom - Math.min(1, fy + radius) * height);
    const desired = viewport.height * .28 - fy * height;
    const y = lower <= upper ? Math.max(lower, Math.min(upper, desired)) : Math.max(viewport.height - height, Math.min(0, upper));
    const x = Math.max(viewport.width - width, Math.min(0, viewport.width * .5 - fx * width));
    const score = Math.max(0, top - (y + Math.max(0, fy - radius) * height)) + Math.max(0, y + Math.min(1, fy + radius) * height - bottom)
      + Math.max(0, -(x + Math.max(0, fx - horizontalRadius) * width)) + Math.max(0, x + Math.min(1, fx + horizontalRadius) * width - viewport.width);
    const frame = { width, height, x, y, protected: score < .5, score };
    if (!best || score < best.score) best = frame;
    if (frame.protected) return frame;
  }
  return best;
}
