/**
 * The one source of truth for which Art and Artist build is running. Bump it whenever a build is shared for
 * testing. Every research session records it once, at start, and keeps it forever.
 */
export const ANA_PROTOTYPE_VERSION = 'V29';
export const ANA_PROTOTYPE_BUILD_DATE = '2026-10-01';
/** What research records store, for example "V29 (2026-10-01)". */
export const ANA_PROTOTYPE_VERSION_LABEL = `${ANA_PROTOTYPE_VERSION} (${ANA_PROTOTYPE_BUILD_DATE})`;
