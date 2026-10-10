import { BadgeCheck, CalendarClock, Clapperboard } from 'lucide-react';
import type { Person } from '../data/types';
import { publicCreditsFor } from '../domain/discovery';
import { SaveButton } from '../screens/home/OpportunityCard';
import { useStore } from '../state/store';
import { world } from '../state/world';
import { PersonPhoto, PressCard } from './primitives';

/**
 * A person as a card: the portrait breaks out of the top edge of a soft gradient card, then name, craft, three
 * facts and one line about availability. Used wherever people are shown as a row of cards (Home, Discover).
 */
export function PersonCard({ p }: { p: Person }) {
  const { push } = useStore();
  const credits = publicCreditsFor(p.id).length;
  const projects = world.projects.filter((w) => w.ownerId === p.id && w.shared).length;
  const stats = [
    { icon: <BadgeCheck size={16} aria-hidden />, value: credits, label: credits === 1 ? 'credit' : 'credits' },
    { icon: <CalendarClock size={16} aria-hidden />, value: p.years ?? 0, label: 'years' },
    { icon: <Clapperboard size={16} aria-hidden />, value: projects, label: projects === 1 ? 'project' : 'projects' },
  ].filter((x) => x.value > 0);
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
      <PressCard className="pcard-body" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985} aria-label={`${p.name}, ${p.role}. ${stats.map((x) => `${x.value} ${x.label}`).join(', ')}. ${foot}`}>
        <b className="pcard-name">{p.name}</b>
        <span className="pcard-role">{p.role}</span>
        {stats.length > 0 && <span className="pcard-stats" aria-hidden style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
          {stats.map((s) => (
            <span key={s.label} className="pcard-stat">
              {s.icon}
              <b>{s.value}</b>
              <i>{s.label}</i>
            </span>
          ))}
        </span>}
        <span className="pcard-foot">{foot}</span>
      </PressCard>
    </div>
  );
}
