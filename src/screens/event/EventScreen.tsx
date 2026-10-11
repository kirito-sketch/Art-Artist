import { CalendarDays, ChevronLeft, Clapperboard, ExternalLink, Flag, MapPin, MoreHorizontal, Pencil, Share, Ticket, Users, XCircle } from 'lucide-react';
import { useState } from 'react';
import { hostFacts } from '../../state/events';
import { listable, typeLabel, whenLabel } from '../../domain/events';
import { CRAFTS } from '../../data/crafts';
import { party } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { useFeatures } from '../../ui/features';
import { Avatar, Button, EmptyState, IconButton, Photo, PressCard, Row, SectionHeader, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { SaveButton } from '../home/OpportunityCard';
import { EventAttendance } from './EventAttendance';
import { eventArt } from '../../state/eventArt';
import { InfoGroup } from '../../ui/InfoGroup';

export function EventScreen({ id }: { id: string }) {
  const district = useFeatures().home === 'district';
  const store = useStore();
  const { pop, push, openSheet, following, toggleFollow, showToast } = store;
  const event = store.eventForViewer(id);
  const [menu, setMenu] = useState(false);
  const [confirmation, setConfirmation] = useState<'cancel' | 'close' | null>(null);
  const [requests, setRequests] = useState(false);
  const [error, setError] = useState('');
  if (
    !event ||
    !listable({ ...event, status: 'scheduled' }, hostFacts(event.hostId), Math.min(Date.now(), event.start - 1)) ||
    event.price.kind !== 'free' ||
    event.status === 'under_review' ||
    event.status === 'draft'
  )
    return (
      <div className="screen">
        <header className="topbar">
          <IconButton label="Back" onClick={pop}>
            <ChevronLeft size={24} />
          </IconButton>
        </header>
        <EmptyState title="This event is unavailable" />
      </div>
    );
  const host = party(event.hostId);
  const project = event.projectId ? work(event.projectId) : undefined;
  const mine = store.canManageEvent(id);
  const organiserElsewhere = !mine && (event.hostId === store.viewer.id || store.memberships.includes(event.hostId));
  const status = store.eventStatus(id);
  const ownRequest = store.eventRequest(id);
  const online = event.location === 'online' || event.venue === 'Online';
  // One rule for event art everywhere (src/state/eventArt.ts): cover, then its film, then the host's own work.
  const art = eventArt(event);
  const rows = store.eventRequestsForHost(id);
  const pending = rows.filter((r) => r.status === 'pending');
  const confirmed = rows.filter((r) => r.status === 'confirmed');
  const ended = status === 'Ended';
  return (
    <div className={`screen canvas ev-screen${district ? ' dhouse-page' : ''}`}>
      <div className={`ev-hero ${art ? '' : 'ev-hero--branded'}`}>
        {art ? (
          <Photo surface="event-hero" media={art} className="ev-hero-photo" showPlay={false} />
        ) : (
          <span className="ev-hero-fallback" aria-hidden>
            <span>Ana · Events</span><b>Meet. Make.<br />Be inspired.</b>
          </span>
        )}
        <div className="phero-bar">
          <IconButton label="Back" className="icon-btn--float" onClick={pop}>
            <ChevronLeft size={24} />
          </IconButton>
          <span className="flex" />
          <IconButton
            label={`Share ${event.title}`}
            className="icon-btn--float"
            onClick={() => openSheet({ name: 'share', label: event.title, card: { title: event.title, sub: 'Event', route: { name: 'event', id: event.id } } })}
          >
            <Share size={18} />
          </IconButton>
          <IconButton label={`More options for ${event.title}`} className="icon-btn--float" onClick={() => setMenu(true)}>
            <MoreHorizontal size={20} />
          </IconButton>
        </div>
      </div>
      <div className="psheet ev-sheet">
        {organiserElsewhere && (
          <div className="ev-identity-notice">
            <p className="meta">This event belongs to {host?.name}. Switch identity to manage it.</p>
            <Button size="s" variant="secondary" onClick={() => store.setActing(event.hostId === store.viewer.id ? 'self' : event.hostId, true, true)}>
              Switch to organiser
            </Button>
          </div>
        )}
        <p className="ev-kind">{typeLabel(event.type)}</p>
        <h1 className="title-1 ev-page-title">{event.title}</h1>
        {host && (
          <button className="ev-byline" onClick={() => push(host.kind === 'org' ? { name: 'org', id: host.id } : { name: 'profile', id: host.id })}>
            <Avatar party={host} size={24} />
            <span>
              By <b>{host.name}</b>
            </span>
            {host.kind === 'org' && host.verified && <Verified size={13} label="Verified production house" />}
          </button>
        )}
        {['Cancelled', 'Full', 'Closed', 'Ended', 'Today'].includes(status) && (
          <p className={`ev-banner ${status === 'Cancelled' ? 'ev-banner--stop' : ''}`} role="status">
            {status === 'Cancelled' ? 'The organiser cancelled this event.' : status}
          </p>
        )}
        {event.changed && event.status !== 'cancelled' && (
          <p className="meta">Event details have changed. Please check the time and location.</p>
        )}
        <InfoGroup
          label="Event details"
          items={[
            { key: 'when', icon: <CalendarDays size={20} />, primary: whenLabel(event.start), secondary: event.end ? `Ends ${whenLabel(event.end)}` : undefined },
            online
              ? { key: 'where', icon: <MapPin size={20} />, primary: 'Online event', secondary: 'Joining details are shared once your place is confirmed' }
              : {
                  key: 'where',
                  icon: <MapPin size={20} />,
                  primary: event.venue,
                  secondary: event.city,
                  action: (
                    <a className="link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.city}`)}`} target="_blank" rel="noopener noreferrer">
                      View on map <ExternalLink size={13} aria-hidden />
                    </a>
                  ),
                },
            ...(project ? [{ key: 'film', icon: <Clapperboard size={20} />, primary: project.title, secondary: project.format, action: <button className="link" onClick={() => push({ name: 'work', id: project.id })}>View project</button> }] : []),
            { key: 'price', icon: <Ticket size={20} />, primary: 'Free', secondary: event.capacity ? `${event.capacity} ${event.capacity === 1 ? 'place' : 'places'} · the organiser confirms each request` : 'The organiser confirms each request' },
          ]}
        />
        {mine ? (
          <div className="ev-host-controls">
            <Button
              block
              size="l"
              icon={<Users size={18} />}
              onClick={() => {
                setError('');
                setRequests(true);
              }}
            >
              Requests · {pending.length}
            </Button>
            <p className="meta">
              {confirmed.length} confirmed
              {event.capacity !== undefined ? ` · ${Math.max(0, event.capacity - confirmed.length)} places remaining` : ''}
            </p>
          </div>
        ) : (
          <EventAttendance event={event} />
        )}
        <section className="section section--flush">
          <SectionHeader title="About" />
          <p className="body ev-summary">{event.summary}</p>
        </section>
        {Array.isArray(event.audience) && event.audience.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Who this is for" />
            <p className="body">{event.audience.map((id) => CRAFTS.find((c) => c.id === id)?.label ?? id).join(', ')}</p>
          </section>
        )}
        {host && (
          <section className="section section--flush">
            <SectionHeader title="Hosted by" />
            <div className="ev-host-card">
              <PressCard
                className="prow"
                onPress={() => push(host.kind === 'org' ? { name: 'org', id: host.id } : { name: 'profile', id: host.id })}
              >
                <Avatar party={host} size={44} />
                <span className="prow-text">
                  <b>
                    {host.name} {host.kind === 'org' && host.verified && <Verified size={13} />}
                  </b>
                  <span className="meta">{host.kind === 'org' ? 'Production house' : 'Event organiser'}</span>
                </span>
              </PressCard>
              {host.id !== store.viewer.id && (
                <Button size="s" variant="secondary" aria-pressed={following.includes(host.id)} onClick={() => toggleFollow(host.id)}>
                  {following.includes(host.id) ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </section>
        )}
        {online && (
          <section className="section section--flush">
            <SectionHeader title="Joining the event" />
            {event.joiningUrl && (mine || ownRequest?.status === 'confirmed') && event.status !== 'cancelled' ? (
              <a className="btn btn--secondary btn--m" href={event.joiningUrl} target="_blank" rel="noopener noreferrer">
                Open joining link <ExternalLink size={15} />
              </a>
            ) : (
              <p className="meta">
                {event.status === 'cancelled'
                  ? 'This event was cancelled. Joining details are no longer available.'
                  : ownRequest?.status === 'confirmed'
                    ? 'The organiser will share joining details with you.'
                    : 'Joining details are shared after your place is confirmed.'}
              </p>
            )}
          </section>
        )}
        {event.link && (
          <a className="link ev-info-link" href={event.link} target="_blank" rel="noopener noreferrer">
            More information <ExternalLink size={14} />
          </a>
        )}
        <div className="ev-save-row">
          <SaveButton id={event.id} kind="event" name={event.title} />
          <span className="meta">Save for later</span>
        </div>
      </div>
      <Sheet open={requests && mine} onClose={() => setRequests(false)} title="Requests" size="tall">
        <div className="stack">
          <p className="meta">
            {pending.length} pending · {confirmed.length} confirmed
            {event.capacity !== undefined ? ` · ${Math.max(0, event.capacity - confirmed.length)} places remaining` : ''}
          </p>
          {status === 'Full' && <p className="meta">New requests are paused. Pending requests stay here in case a place becomes free.</p>}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          {(['pending', 'confirmed', 'not-accommodated'] as const).map((state) => {
            const list = rows.filter((r) => r.status === state);
            if (!list.length) return null;
            return (
              <section key={state}>
                <h2 className="title-3">
                  {state === 'pending' ? 'Pending' : state === 'confirmed' ? 'Confirmed attendees' : 'Requests closed'}
                </h2>
                <div className="ev-request-list">
                  {list.map((r) => {
                    const person = party(r.personId);
                    return (
                      <article key={r.id} className="ev-request-card">
                        {person && (
                          <PressCard
                            className="prow"
                            onPress={() => {
                              setRequests(false);
                              push({ name: 'profile', id: r.personId });
                            }}
                          >
                            <Avatar party={person} size={40} />
                            <span className="prow-text">
                              <b>{person.name}</b>
                              <span className="meta">{person.kind === 'person' ? `${person.role} · ${person.city}` : person.city}</span>
                            </span>
                          </PressCard>
                        )}
                        {r.note && <p className="body">{r.note}</p>}
                        <a className="meta ev-private-contact" href={`mailto:${r.email}`}>
                          {r.email}
                        </a>
                        {state === 'pending' && (
                          <Button
                            size="s"
                            disabled={status === 'Full' || event.status !== 'scheduled' || event.start <= Date.now()}
                            onClick={() => {
                              const problem = store.acceptEventRequest(id, r.id);
                              setError(problem ?? '');
                              if (!problem)
                                showToast({
                                  text: 'Place confirmed.',
                                });
                            }}
                          >
                            Accept
                          </Button>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {!rows.length && <EmptyState title="No requests yet" body="People who request a place will appear here." />}
          {event.status === 'scheduled' && !ended && (
            <Button
              variant="secondary"
              block
              onClick={() => {
                setRequests(false);
                setConfirmation('close');
              }}
            >
              Close requests
            </Button>
          )}
        </div>
      </Sheet>
      <Sheet open={menu} onClose={() => setMenu(false)} title={event.title}>
        <div className="group">
          {mine && event.status !== 'cancelled' && !ended ? (
            <>
              <Row
                icon={<Pencil size={20} />}
                label="Edit event"
                onPress={() => {
                  setMenu(false);
                  push({ name: 'composeEvent', editId: id });
                }}
              />
              {event.status === 'scheduled' && (
                <Row
                  label="Close requests"
                  onPress={() => {
                    setMenu(false);
                    setConfirmation('close');
                  }}
                />
              )}
              <Row
                icon={<XCircle size={20} />}
                label="Cancel event"
                onPress={() => {
                  setMenu(false);
                  setConfirmation('cancel');
                }}
              />
            </>
          ) : !mine ? (
            <Row
              icon={<Flag size={20} />}
              label="Report event"
              onPress={() => {
                setMenu(false);
                openSheet({
                  name: 'report',
                  subject: event.title,
                  partyId: event.hostId,
                  target: { kind: 'Event', id },
                });
              }}
            />
          ) : (
            <p className="meta">{status}</p>
          )}
        </div>
      </Sheet>
      <Sheet
        open={!!confirmation && mine}
        onClose={() => setConfirmation(null)}
        title={confirmation === 'cancel' ? 'Cancel this event?' : 'Close requests?'}
      >
        <div className="stack">
          <p className="body">
            {confirmation === 'cancel'
              ? 'Pending and confirmed attendees will receive an Ana notification.'
              : 'Confirmed places stay confirmed. Remaining pending requests will be told that a place could not be offered.'}
          </p>
          <Button
            block
            variant="danger"
            onClick={() => {
              const ok = confirmation === 'cancel' ? store.cancelEvent(id) : store.closeEventRequests(id);
              setConfirmation(null);
              showToast({
                text: ok
                  ? confirmation === 'cancel'
                    ? 'Event cancelled.'
                    : 'Requests closed.'
                  : 'Switch to the organiser identity to do this.',
                tone: ok ? 'success' : 'error',
              });
            }}
          >
            {confirmation === 'cancel' ? 'Cancel event' : 'Close requests'}
          </Button>
          <Button block variant="secondary" onClick={() => setConfirmation(null)}>
            Keep it
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
