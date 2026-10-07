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
