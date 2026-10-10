import { Star } from 'lucide-react';
import type { Person } from '../../data/types';
import type { Work } from '../../data/works';
import { party } from '../../state/selectors';
import { useStore } from '../../state/store';
import { reviewsOf } from '../../state/world';
import { Avatar, Photo, PressCard } from '../../ui/primitives';
import { featuredFor, ScoreLine, Stars } from '../reviews/reviewUnits';

/**
 * Film talk on Home: one card per film, and each card carries the viewer's own relationship to it. A film you haven't
 * reviewed shows five stars right on the card (tap one and the review sheet opens with that rating filled in); one you
 * have shows your rating. With one film the card is wide; with several they sit in a sideways rail.
 */
function FilmCard({ w, wide }: { w: Work; wide: boolean }) {
  const { viewer, push, openSheet, mayReview } = useStore();
  const f = featuredFor(w.id);
  const p = f && party(f.personId);
  const mine = reviewsOf(w.id).find((r) => r.personId === viewer.id);
  const canRate = !mine && mayReview(w.id);
  return (
    <article className={`fcard ${wide ? 'fcard--wide' : ''}`}>
      <PressCard className="fcard-main" onPress={() => push({ name: 'work', id: w.id })} scale={0.985} aria-label={w.title}>
        <span className="fcard-poster">
          <Photo surface="spotlight" media={w.media} showPlay={false} />
        </span>
        <span className="fcard-t">
          <b>{w.title}</b>
          <ScoreLine id={w.id} />
          {f && p && (
            <>
              <span className="fcard-q">“{f.text}”</span>
              <span className="fcard-by">
                <Avatar party={p} size={22} />
                <span>
                  {p.name}
                  {p.kind === 'person' ? `, ${(p as Person).role}` : ''}
                </span>
              </span>
            </>
          )}
        </span>
      </PressCard>
      {mine && (
        <button type="button" className="fcard-mine" onClick={() => openSheet({ name: 'review', projectId: w.id })} aria-label={`You rated ${w.title} ${mine.stars} out of 5. Edit your review`}>
          <Stars value={mine.stars} size={14} />
          <span>You rated it {mine.stars}</span>
        </button>
      )}
      {canRate && (
        <div className="fcard-rate" role="group" aria-label={`Rate ${w.title}`}>
          <span className="fcard-rate-l">Seen it? Rate it</span>
          <span className="fcard-rate-s">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} onClick={() => openSheet({ name: 'review', projectId: w.id, stars: n })}>
                <Star size={22} aria-hidden />
              </button>
            ))}
          </span>
        </div>
      )}
    </article>
  );
}

export function FilmTalk({ films }: { films: Work[] }) {
  if (films.length === 0) return null;
  if (films.length === 1) return <div className="dh-pad"><FilmCard w={films[0]} wide /></div>;
  return (
    <div className="fcards" role="group" aria-label="Films this week">
      {films.map((w) => <FilmCard key={w.id} w={w} wide={false} />)}
    </div>
  );
}
