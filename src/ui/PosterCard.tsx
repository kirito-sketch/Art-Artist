import type { ReactNode } from 'react';
import { posterFor } from '../data/posters';
import { Photo, Pressable, Verified } from './primitives';

/*
 * A film as a 2:3 theatrical poster (docs/ux-refinement/PLAN.md, D4). The production's own poster when it has been
 * supplied (src/data/posters.ts); otherwise a type-set poster: the title set in the display face on a deep ground
 * picked from the title, with the production and year. Never a still cropped to 2:3, never generated artwork.
 *
 * Under the poster: the title, then the line that matters on this surface (the credited role on a profile, the year
 * and format on a house page), then the production. A small seal on the poster marks a production-confirmed credit.
 */
const GROUNDS = ['#1d2a33', '#2d1f24', '#1f2b25', '#2a2433', '#33291c', '#1c2430'];
const ground = (s: string) => GROUNDS[[...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % GROUNDS.length];

export function TypesetPoster({ title, production, year }: { title: string; production?: string; year?: string }) {
  return (
    <span className="poster-type" style={{ background: ground(title) }} aria-hidden>
      {production && <span className="poster-type-house">{production}</span>}
      <b className="poster-type-title">{title}</b>
      {year && <span className="poster-type-year">{year}</span>}
    </span>
  );
}

export function PosterCard({ projectId, title, line, production, productionVerified, year, confirmed, sealing, seal, onPress, label, houseLine = true }: {
  projectId: string;
  title: string;
  /** The credited role, or the year and format. */
  line?: string;
  production?: string;
  productionVerified?: boolean;
  year?: string;
  /** A production-confirmed credit: the small seal on the poster. */
  confirmed?: boolean;
  sealing?: boolean;
  seal?: ReactNode;
  onPress: () => void;
  label: string;
  /** The production under the poster; off on the production's own page. */
  houseLine?: boolean;
}) {
  const poster = posterFor(projectId);
  return (
    <Pressable className={`poster-card${sealing ? ' poster-card--sealing' : ''}`} data-poster={poster ? 'supplied' : 'typeset'} scale={0.98} onClick={onPress} aria-label={label}>
      <span className="poster-frame">
        {poster ? <Photo media={poster} surface="credit-card" frameRatio={2 / 3} showPlay={false} alt="" /> : <TypesetPoster title={title} production={production} year={year} />}
        {confirmed && (
          <span className="poster-seal" aria-hidden>
            <Verified size={13} />
          </span>
        )}
        {seal}
      </span>
      <span className="poster-copy">
        <strong>{title}</strong>
        {line && <span className="poster-line">{line}</span>}
        {production && houseLine && (
          <span className="poster-house">
            {production}
            {productionVerified && <Verified size={11} label="Verified production house" />}
          </span>
        )}
      </span>
    </Pressable>
  );
}
