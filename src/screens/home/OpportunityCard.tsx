import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import type { Opportunity } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { shared, spring } from '../../ui/motion';
import { Avatar, PressCard, Photo, Verified } from '../../ui/primitives';
import { displayTitle, keepSeparators, FrameLabel } from '../../ui/compose';

export function SaveButton({ id, floating }: { id: string; floating?: boolean }) {
  const { saved, toggleSave } = useStore();
  const on = saved.includes(id);
  return (
    <motion.button
      className={`save ${floating ? 'save--floating' : ''} ${on ? 'is-on' : ''}`}
      aria-label={on ? 'Remove from saved' : 'Save'}
      aria-pressed={on}
      whileTap={{ scale: 0.8 }}
      transition={spring.press}
      onClick={(e) => {
        e.stopPropagation();
        toggleSave(id);
      }}
    >
      <motion.span key={String(on)} initial={{ scale: on ? 0.5 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 700, damping: 14 }} style={{ display: 'inline-flex' }}>
        <Bookmark size={18} strokeWidth={2.2} fill={on ? 'currentColor' : 'none'} />
      </motion.span>
    </motion.button>
  );
}

/** The one thing the user has already done with this opportunity, if anything. */
export function useSentLabel(o: Opportunity) {
  const { responses, interestsSent } = useStore();
  if (responses[o.id]) return 'Response sent';
  if (interestsSent[o.id] !== undefined) return 'Interest sent';
  return null;
}

/** Who stands behind the opportunity: a verified production, or a named person for a collaboration. */
export function Byline({ o }: { o: Opportunity }) {
  if (o.orgId) {
    const house = org(o.orgId);
    return (
      <span className="byline">
        {house.name}
        {house.verified && <Verified size={14} label="Verified production" />}
      </span>
    );
  }
  const author = person(o.authorId!);
  return (
    <span className="byline">
      <Avatar party={author} size={18} />
      {author.name}
    </span>
  );
}

/**
 * For You card. Budget: image with at most one pill, then three lines.
 * Everything else (pay, format, language, questions) lives on the detail page.
 */
export function OpportunityCard({ o, onOpen }: { o: Opportunity; onOpen: () => void }) {
  const sent = useSentLabel(o);
  const pill = sent ?? (o.kind === 'collab' ? 'Collaboration' : o.closesInDays !== undefined && o.closesInDays <= 5 ? `Closes in ${o.closesInDays} days` : null);
  return (
    <PressCard className="ocard" onPress={onOpen} aria-label={`${o.role}, ${o.project}`}>
      <div className="ocard-media">
        <Photo media={o.media} />
        {pill && <span className={`pill ${sent ? 'pill--done' : o.kind !== 'collab' && (o.closesInDays ?? 9) <= 3 ? 'pill--urgent' : ''}`}>{pill}</span>}
        <SaveButton id={o.id} floating />
      </div>
      <p className="ocard-title">{o.role}</p>
      <p className="ocard-line">
        <Byline o={o} />
      </p>
      <p className="ocard-line">{o.highlight ?? `${o.city} · ${o.dates}`}</p>
    </PressCard>
  );
}

/** The single strongest match, shown large at the top of Home with its title set on the image. */
export function FeaturedCard({ o, onOpen }: { o: Opportunity; onOpen: () => void }) {
  const sent = useSentLabel(o);
  const pill = sent ?? (o.closesInDays !== undefined && o.closesInDays <= 5 ? `Closes in ${o.closesInDays} days` : o.kind === 'collab' ? 'Collaboration' : null);
  return (
    <PressCard className="feature" onPress={onOpen} scale={0.985} aria-label={`${o.role}, ${o.project}`}>
      {/* The artwork carries into Role Detail as its hero (shared element). */}
      <motion.div layoutId={shared.role(o.id)} className="feature-photo" transition={spring.push}>
        <Photo media={o.media} className="feature-photo" />
      </motion.div>
      <div className="feature-scrim" />
      {pill && <FrameLabel tone={sent ? 'paper' : (o.closesInDays ?? 9) <= 5 ? 'urgent' : 'plate'}>{pill}</FrameLabel>}
      <SaveButton id={o.id} floating />
      <div className="feature-text">
        <p className="feature-title display-title" {...displayTitle(o.role, 36)}>
          {keepSeparators(o.role)}
        </p>
        <p className="feature-line">
          <Byline o={o} />
        </p>
        <p className="feature-line">{o.highlight ?? `${o.city} · ${o.dates}`}</p>
      </div>
    </PressCard>
  );
}
