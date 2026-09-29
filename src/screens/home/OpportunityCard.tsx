import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bookmark, CalendarDays, Clock3, IndianRupee, MapPin, MessageCircle, Sparkles, Users } from 'lucide-react';
import type { Opportunity } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { Avatar, PressCard, TypeBadge, Verified } from '../../ui/primitives';
import { Still } from '../../ui/Still';
import { spring } from '../../ui/motion';

export function SaveButton({ id, onMedia, size = 18 }: { id: string; onMedia?: boolean; size?: number }) {
  const { saved, toggleSave } = useStore();
  const on = saved.includes(id);
  return (
    <motion.button
      className={`save-btn ${onMedia ? 'save-btn--media' : ''} ${on ? 'is-on' : ''}`}
      aria-label={on ? 'Remove from saved' : 'Save'}
      aria-pressed={on}
      whileTap={{ scale: 0.82 }}
      transition={spring.press}
      onClick={(e) => {
        e.stopPropagation();
        toggleSave(id);
      }}
    >
      <motion.span key={on ? 'on' : 'off'} initial={{ scale: on ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 700, damping: 14 }}>
        <Bookmark size={size} strokeWidth={2} fill={on ? 'currentColor' : 'none'} />
      </motion.span>
      <AnimatePresence>
        {on && (
          <motion.span className="save-burst" initial={{ scale: 0.4, opacity: 0.8 }} animate={{ scale: 1.9, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function MatchLine({ reasons }: { reasons: string[] }) {
  if (!reasons.length) return null;
  return (
    <p className="match-line">
      <Sparkles size={12} strokeWidth={2.2} />
      <span>{reasons.join(' · ')}</span>
    </p>
  );
}

export function Facts({ o, compact }: { o: Opportunity; compact?: boolean }) {
  return (
    <div className={`facts ${compact ? 'facts--compact' : ''}`}>
      <span>
        <MapPin size={13} />
        {o.city}
      </span>
      <span>
        <CalendarDays size={13} />
        {o.dates}
      </span>
      <span className={o.paid ? '' : 'facts-unpaid'}>
        <IndianRupee size={13} />
        {o.paid ? o.compensation : 'Unpaid'}
      </span>
    </div>
  );
}

function Closing({ days }: { days?: number }) {
  if (days === undefined || days > 7) return null;
  return (
    <span className={`closing ${days <= 3 ? 'closing--soon' : ''}`}>
      <Clock3 size={11} strokeWidth={2.4} />
      Closes in {days} {days === 1 ? 'day' : 'days'}
    </span>
  );
}

/** Response state is reflected on the card so users never re-apply by accident. */
function useSentLabel(o: Opportunity) {
  const { responses, interestsSent } = useStore();
  if (responses[o.id]) return 'Response sent';
  if (interestsSent[o.id] !== undefined) return 'Interest sent';
  return null;
}

function StatusNote({ o }: { o: Opportunity }) {
  const label = useSentLabel(o);
  return label ? <span className="card-status">{label}</span> : null;
}

/**
 * Official opportunities (crew job, casting call) are full-bleed and lead with the verified production house.
 * Collaborations are framed, quieter and lead with the person. The difference is structural, not just a tag.
 */
export function OpportunityCard({ o, onOpen, index = 0 }: { o: Opportunity; onOpen: () => void; index?: number }) {
  if (o.kind === 'collab') return <CollabCard o={o} onOpen={onOpen} index={index} />;
  const house = org(o.orgId!);
  return (
    <PressCard className="opp-card opp-card--official" onPress={onOpen} aria-label={`${o.role}, ${o.project}`}>
      <Still media={o.media} className="opp-card-media" />
      <div className="opp-card-scrim" />
      <div className="opp-card-top">
        <TypeBadge kind={o.kind} onMedia />
        <Closing days={o.closesInDays} />
        <span className="flex-spacer" />
        <SaveButton id={o.id} onMedia />
      </div>
      <div className="opp-card-body">
        <p className="opp-card-house">
          <Avatar party={house} size={20} />
          <span>{house.name}</span>
          {house.verified && <Verified size={13} />}
        </p>
        <h3 className="opp-card-title">{o.role}</h3>
        <p className="opp-card-project">
          {o.project} <span>· {o.projectType}</span>
        </p>
        <Facts o={o} />
        <div className="opp-card-foot">
          <MatchLine reasons={o.match} />
          <StatusNote o={o} />
          <span className="opp-card-go" aria-hidden>
            <ArrowRight size={16} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </PressCard>
  );
}

function CollabCard({ o, onOpen }: { o: Opportunity; onOpen: () => void; index?: number }) {
  const author = person(o.authorId!);
  const sent = useSentLabel(o);
  return (
    <PressCard className="opp-card opp-card--collab" onPress={onOpen} aria-label={`Collaboration: ${o.role}, ${o.project}`}>
      <div className="collab-head">
        <Avatar party={author} size={36} />
        <div className="collab-head-text">
          <p className="collab-author">{author.name}</p>
          <p className="collab-author-role">
            {author.role} · {o.postedAgo === 'now' ? 'just now' : `${o.postedAgo} ago`}
          </p>
        </div>
        <SaveButton id={o.id} />
      </div>
      <div className="collab-media-wrap">
        <Still media={o.media} className="collab-media" />
        <span className="collab-badge-slot">
          <TypeBadge kind="collab" onMedia />
        </span>
      </div>
      <p className="collab-kicker">{o.collabIntent === 'available' ? 'Available for' : 'Looking for'}</p>
      <h3 className="collab-title">{o.role}</h3>
      <p className="opp-card-project opp-card-project--muted">
        {o.project} <span>· {o.projectType}</span>
      </p>
      <Facts o={o} compact />
      <div className="collab-foot">
        <MatchLine reasons={o.match} />
        {sent ? (
          <span className="card-status">{sent}</span>
        ) : (
          <span className="collab-permission">
            {o.allowDM ? <MessageCircle size={12} /> : <Users size={12} />}
            {o.allowDM ? 'Open to messages' : 'Interest only'}
          </span>
        )}
      </div>
    </PressCard>
  );
}
