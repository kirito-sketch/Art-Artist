import { CalendarDays } from 'lucide-react';
import type { IndustryEvent, Person } from '../../data/types';
import { typeLabel, whenLabel } from '../../domain/events';
import type { Candidate } from '../../domain/home/types';
import { research } from '../../research-data/client';
import { eventHomeCandidates } from '../../state/events';
import { party } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { SaveButton } from '../home/OpportunityCard';
import { getFeatures, useFeatures } from '../../ui/features';
import { Photo, PressCard, SectionHeader } from '../../ui/primitives';

/* Event cards pair a cover with concise details. Save remains a private bookmark. */

/** Home candidates, only when Events are switched on. */
export function eventCandidates(me: Person, loadedAt: number, events?: IndustryEvent[], following: string[] = []): Candidate[] {
  if (!getFeatures().events || !events) return [];
  return eventHomeCandidates(events, me, following, loadedAt);
}

/** Saving is a private bookmark. It never sends an attendance request. */
export function EventSaveButton({ e }: { e: IndustryEvent }) {
  return (
    <span className="ev-card-save">
      <SaveButton id={e.id} kind="event" name={e.title} />
    </span>
  );
}

export function EventTicket({ e, reason, onOpen }: { e: IndustryEvent; reason?: string; onOpen?: () => void }) {
  const { push, eventStatus } = useStore();
  const host = party(e.hostId);
  const project = e.projectId ? work(e.projectId) : undefined;
  const art = e.cover ?? (project && project.media.id !== 'ph' ? (project.stills[0] ?? project.media) : undefined);
  const status = eventStatus(e.id);
  return (
    <div className="ev-ticket ev-discovery-card">
      <PressCard
        className="ev-ticket-main"
        onPress={() => {
          onOpen?.();
          push({ name: 'event', id: e.id });
        }}
        aria-label={`${e.title}. ${whenLabel(e.start)}. ${e.venue === 'Online' ? 'Online' : e.city}. Free. Places by request. ${status}.`}
      >
        <span className="ev-ticket-cover">
          {art ? (
            <Photo surface="event-card" media={art} showPlay={false} />
          ) : (
            <span className="ev-card-fallback">
              <CalendarDays size={22} aria-hidden />
            </span>
          )}
        </span>
        <span className="ev-body">
          <span className="ev-kind">{typeLabel(e.type)}</span>
          <b className="ev-title">{e.title}</b>
          <span className="ev-meta">{whenLabel(e.start)}</span>
          <span className="ev-meta">
            {e.venue === 'Online' ? 'Online' : e.city}
            {host ? ` · ${host.name}` : ''}
          </span>
          <span className="ev-meta">Free · Places by request</span>
          {!['Upcoming', 'Today'].includes(status) && <span className="ev-status">{status}</span>}
          {reason && <em className="ev-why">{reason}</em>}
        </span>
      </PressCard>
      <EventSaveButton e={e} />
    </div>
  );
}

/** Home's event unit (and the lead, for a screening of your own film). */
export function EventRow({ c, position, lead }: { c: Candidate; position: number; lead?: boolean }) {
  const { events, push } = useStore();
  const e = events.find((x) => x.id === c.data?.eventId);
  if (!e) return null;
  const opened = () =>
    research.track('home_unit_opened', {
      metadata: { unit: lead ? 'lead' : 'event', position, reason: !!c.reason },
    });
  if (lead) {
    const w = e.projectId ? work(e.projectId) : undefined;
    return (
      <section className="hn-lead-wrap" aria-label="Lead story">
        <PressCard
          className="hn-lead"
          onPress={() => (opened(), push({ name: 'event', id: e.id }))}
          scale={0.985}
          aria-label={`${e.title}. ${whenLabel(e.start)}, ${e.venue}. ${c.reason ?? ''}`}
        >
          {w && <Photo surface="event-card" media={w.stills[0] ?? w.media} className="hn-lead-photo" />}
          <div className="hn-lead-text">
            <span className="hn-tag">
              <CalendarDays size={11} aria-hidden /> {typeLabel(e.type)}
            </span>
            <h2 className="hn-lead-title">{e.title}</h2>
            <p className="hn-lead-meta">
              {whenLabel(e.start)} · {e.venue}
            </p>
            {c.reason && <p className="hn-lead-why">{c.reason}</p>}
          </div>
        </PressCard>
      </section>
    );
  }
  return (
    <section className="hn-unit v-section" aria-label="An event">
      <SectionHeader title="Coming up" />
      <EventTicket e={e} reason={c.reason} onOpen={opened} />
    </section>
  );
}

/** A page section of events (project, house, profile). Nothing at all when Events are off or there are none. */
export function EventsSection({
  title,
  list,
  action,
  onAction,
}: {
  title: string;
  list: IndustryEvent[];
  action?: string;
  onAction?: () => void;
}) {
  const on = useFeatures().events;
  if (!on || (!list.length && !action)) return null;
  return (
    <section className="section section--flush ev-section">
      <SectionHeader title={title} action={action} onAction={onAction} />
      {list.length > 0 && (
        <div className="ev-list">
          {list.map((e) => (
            <EventTicket key={e.id} e={e} />
          ))}
        </div>
      )}
    </section>
  );
}
