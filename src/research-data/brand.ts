/**
 * Product name: Art and Artist. ("Ana" was an internal working codename and must never be shown.)
 * Research text that comes from the database (study titles, task titles and instructions) may have
 * been seeded before the rename; this keeps any legacy wording from reaching the screen.
 */
export const PRODUCT_NAME = 'Art and Artist';
const LEGACY = new RegExp(['\\b', 'A', 'na', '\\b'].join(''), 'g');
const LEGACY_UPPER = new RegExp(['\\b', 'A', 'NA', '\\b'].join(''), 'g');
export const brand = <T extends string | null | undefined>(s: T): T => (typeof s === 'string' ? (s.replace(LEGACY_UPPER, PRODUCT_NAME.toUpperCase()).replace(LEGACY, PRODUCT_NAME) as T) : s);
