import { CalendarDays, Ticket, TicketCheck } from 'lucide-react';
import { useState } from 'react';
import type { IndustryEvent, Person } from '../../data/types';
import { priceLabel, stubLabel, typeLabel, whenLabel } from '../../domain/events';
import type { Candidate } from '../../domain/home/types';
import { research } from '../../research-data/client';
import { eventHomeCandidates } from '../../state/events';
import { party } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { getFeatures, useFeatures } from '../../ui/features';
import { Photo, PressCard, Pressable, SectionHeader } from '../../ui/primitives';

/*
 * Event units (docs/EVENTS.md). An event looks like a ticket stub: the date on a perforated stub, the
 * details beside it. Marking Interested punches the stub (a small, one-off motion; still under Reduce
 * Motion). Interest is private.
 */

/** Home candidates, only when Events are switched on. */
export function eventCandidates(me: Person, loadedAt: number, events?: IndustryEvent[], following: string[] = []): Candidate[] {
  if (!getFeatures().events || !events) return [];
  return eventHomeCandidates(events, me, following, loadedAt);
}

export function InterestedButton({ e, compact }: { e: IndustryEvent; compact?: boolean }) {
  const { isSaved, toggleSave } = useStore();
  const on = isSaved('event', e.id);
  const [punched, setPunched] = useState(false);
  if (e.status !== 'scheduled') return null;
  return (
    <Pressable
      className={`ev-interest ${on ? 'is-on' : ''} ${punched && on ? 'is-punched' : ''} ${compact ? 'ev-interest--compact' : ''}`}
      aria-pressed={on}
      aria-label={on ? `Interested in ${e.title}. Tap to remove` : `Mark interested in ${e.title}`}
      onClick={(ev: React.MouseEvent) => {
        ev.stopPropagation();
        setPunched(!on);
        toggleSave(e.id, 'event');
      }}
      scale={0.94}
    >
      {compact ? (
        on ? <TicketCheck size={20} aria-hidden className="ev-punch-icon" /> : <Ticket size={20} aria-hidden />
      ) : (
        <>
          <span className="ev-punch" aria-hidden />
          {on ? 'Interested' : 'Interested?'}
        </>
      )}
    </Pressable>
  );
}

/** One event as a ticket stub row. */
export function EventTicket({ e, reason, onOpen }: { e: IndustryEvent; reason?: string; onOpen?: () => void }) {
  const { push } = useStore();
  const stub = stubLabel(e.start);
  const host = party(e.hostId);
  const status = e.status === 'cancelled' ? 'Cancelled' : e.status === 'under_review' ? 'Under review · only you can see this' : e.changed;
  return (
    <div className={`ev-ticket ${e.status !== 'scheduled' ? 'is-muted' : ''}`}>
      <PressCard
        className="ev-ticket-main"
        onPress={() => {
          onOpen?.();
          push({ name: 'event', id: e.id });
        }}
        scale={0.985}
        aria-label={`${e.title}. ${whenLabel(e.start)}, ${e.venue}, ${e.city}. ${priceLabel(e)}.${status ? ` ${status}.` : ''}${reason ? ` ${reason}.` : ''}`}
      >
        <span className="ev-stub" aria-hidden>
          <span className="ev-stub-month">{stub.month}</span>
          <span className="ev-stub-day">{stub.day}</span>
        </span>
        <span className="ev-body">
          <span className="ev-kind">{typeLabel(e.type)}</span>
          <b className="ev-title">{e.title}</b>
          <span className="ev-meta">
            {whenLabel(e.start)} · {e.venue}, {e.city}
          </span>
          <span className="ev-meta">
            {priceLabel(e)}
            {host ? ` · ${host.name}` : ''}
          </span>
          {status && <span className="ev-status">{status}</span>}
          {reason && !status && <em className="ev-why">{reason}</em>}
        </span>
      </PressCard>
      <InterestedButton e={e} compact />
    </div>
  );
}

/** Home's event unit (and the lead, for a screening of your own film). */
export function EventRow({ c, position, lead }: { c: Candidate; position: number; lead?: boolean }) {
  const { events, push } = useStore();
  const e = events.find((x) => x.id === c.data?.eventId);
  if (!e) return null;
  const opened = () => research.track('home_unit_opened', { metadata: { unit: lead ? 'lead' : 'event', position, reason: !!c.reason } });
  if (lead) {
    const w = e.projectId ? work(e.projectId) : undefined;
    return (
      <section className="hn-lead-wrap" aria-label="Lead story">
        <PressCard className="hn-lead" onPress={() => (opened(), push({ name: 'event', id: e.id }))} scale={0.985} aria-label={`${e.title}. ${whenLabel(e.start)}, ${e.venue}. ${c.reason ?? ''}`}>
          {w && <Photo media={w.stills[0] ?? w.media} className="hn-lead-photo" />}
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
export function EventsSection({ title, list, action, onAction }: { title: string; list: IndustryEvent[]; action?: string; onAction?: () => void }) {
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
