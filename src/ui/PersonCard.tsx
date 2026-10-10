import type { Person } from '../data/types';
import { SaveButton } from '../screens/home/OpportunityCard';
import { useStore } from '../state/store';
import { PersonPhoto, PressCard } from './primitives';

/**
 * A person as a card: the portrait breaks out of the top edge of a soft gradient card, then name and craft. Used wherever people are shown as a row of cards (Home, Discover).
 */
export function PersonCard({ p }: { p: Person }) {
  const { push } = useStore();
  const foot = p.availableFrom ? (p.availableFrom !== 'Now' ? `Open from ${p.availableFrom}` : 'Open to work') : p.city;
  return (
    <div className="pcard">
      <span className="pcard-halo" aria-hidden />
      <span className="pcard-photo">
        <PersonPhoto party={p} />
      </span>
      <span className="pcard-save">
        <SaveButton id={p.id} kind="person" name={p.name} />
      </span>
      <PressCard className="pcard-body" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985} aria-label={`${p.name}, ${p.role}. ${foot}`}>
        <b className="pcard-name">{p.name}</b>
        <span className="pcard-role">{p.role}</span>
      </PressCard>
    </div>
  );
}
