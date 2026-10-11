import type { Work } from '../../data/works';
import { org, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { PressCard, Photo } from '../../ui/primitives';
import { featuredFor, ScoreLine } from './reviewUnits';

const maker = (w: Work) => (w.orgIds[0] ? org(w.orgIds[0]).name : w.format);

/**
 * A film out this Friday as a full-bleed card, the same shape as Coming soon: the picture fills the card, the score,
 * the title and the one review it is introduced with sit on a gradient at the foot.
 */
export function FridayCard({ w }: { w: Work }) {
  const { push, following } = useStore();
  const f = featuredFor(w.id, following);
  const who = f && person(f.personId);
  return (
    <article className="csoon-card fri-card is-centred">
      <PressCard className="csoon-main" onPress={() => push({ name: 'work', id: w.id })} scale={0.985} aria-label={w.title}>
        <span className="csoon-media" aria-hidden>
          <Photo surface="spotlight" media={w.media} showPlay={false} />
        </span>
        <span className="csoon-text fri-text">
          <b>{w.title}</b>
          <i>{maker(w)} · {w.format.split(' · ').pop()}</i>
          <ScoreLine id={w.id} className="fri-score" />
          {f && who && <span className="fri-quote">“{f.text}”<em>{who.name}</em></span>}
        </span>
      </PressCard>
    </article>
  );
}
