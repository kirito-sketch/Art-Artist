import type { Tab } from '../state/store';

/*
 * Tab icons with a filled state, drawn from the same Lucide geometry as the rest of the app (house,
 * compass, message-circle; 24 grid, round caps), so active and inactive are one icon family. The fill
 * is a separate layer whose opacity transitions (src/styles/refine.css, bottom navigation), so the outline
 * eases into the filled variant without changing the symbol:
 *   Home      solid house; the door stays open (a static mask cuts it from the fill)
 *   Discover  the ring stays an outline; the compass needle fills
 *   Inbox     solid bubble
 */
const HOUSE = 'M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';
const DOOR = 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8';
const NEEDLE = 'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z';
const BUBBLE = 'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719';

export function TabIcon({ tab }: { tab: Exclude<Tab, 'profile'> }) {
  return (
    <svg className="tab-glyph" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {tab === 'home' && (
        <>
          <defs>
            <mask id="tab-house-door" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
              <rect width="24" height="24" fill="#fff" />
              <path d="M9 21v-8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8z" fill="#000" />
            </mask>
          </defs>
          <path className="tab-glyph-fill" d={HOUSE} fill="currentColor" stroke="none" mask="url(#tab-house-door)" />
          <path d={DOOR} />
          <path d={HOUSE} />
        </>
      )}
      {tab === 'discover' && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path className="tab-glyph-fill" d={NEEDLE} fill="currentColor" stroke="none" />
          <path d={NEEDLE} />
        </>
      )}
      {tab === 'inbox' && (
        <>
          <path className="tab-glyph-fill" d={BUBBLE} fill="currentColor" stroke="none" />
          <path d={BUBBLE} />
        </>
      )}
    </svg>
  );
}
