import { CalendarDays, ChevronLeft, ExternalLink, Flag, IndianRupee, MapPin, MoreHorizontal, Pencil, Share, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { priceLabel, stubLabel, typeLabel, whenLabel } from '../../domain/events';
import { research } from '../../research-data/client';
import { isHost } from '../../state/events';
import { party, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { scriptLang } from '../../ui/compose';
import { Avatar, Button, EmptyState, IconButton, Photo, PressCard, Row, SectionHeader, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { InterestedButton } from './eventUnits';

/*
 * Event page (docs/EVENTS.md). Everything needed to decide fits above the fold: what, when, where, what
 * it costs, who hosts it. Tickets live wherever the host sells them; Art and Artist never takes money.
 * The host sees Edit and Cancel; everyone else sees Report.
 */
export function EventScreen({ id }: { id: string }) {
  const { events, pop, push, openSheet, viewer, acting, cancelEvent, showToast } = useStore();
  const e = events.find((x) => x.id === id);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!e)
    return (
      <div className="screen">
        <header className="topbar topbar--nav">
          <IconButton label="Back" onClick={pop}>
            <ChevronLeft size={26} />
          </IconButton>
        </header>
        <EmptyState title="This event is no longer available" body="The host may have removed it." />
      </div>
    );
  const host = party(e.hostId);
  const w = e.projectId ? work(e.projectId) : undefined;
  const mine = isHost(e, viewer.id, acting);
  const stub = stubLabel(e.start);
  const speakers = (e.speakerIds ?? []).map((s) => person(s)).filter(Boolean);
  const art = e.cover ?? (w && w.media.id !== 'ph' ? w.stills[0] ?? w.media : undefined);

  return (
    <div className="screen canvas ev-screen">
      <div className={`ev-hero ${art ? '' : 'ev-hero--type'}`}>
        {art ? <Photo media={art} className="ev-hero-photo" showPlay={false} /> : <span className="ev-hero-day" aria-hidden>{stub.day}</span>}
        <div className="phero-bar">
          <IconButton label="Back" className="icon-btn--float" onClick={pop}>
            <ChevronLeft size={24} />
          </IconButton>
          <span className="flex" />
          <IconButton label={`Share ${e.title}`} className="icon-btn--float" onClick={() => openSheet({ name: 'share', label: e.title })}>
            <Share size={18} />
          </IconButton>
          <IconButton label={`More options for ${e.title}`} className="icon-btn--float" onClick={() => setMenu(true)}>
            <MoreHorizontal size={20} />
          </IconButton>
        </div>
      </div>

      <div className="psheet ev-sheet">
        <p className="ev-kind">
          <CalendarDays size={13} aria-hidden /> {typeLabel(e.type)}
        </p>
        <h1 className="title-1 ev-page-title" lang={scriptLang(e.title)}>
          {e.title}
        </h1>

        {e.status === 'cancelled' && (
          <p className="ev-banner ev-banner--stop" role="status">
            The host cancelled this event.
          </p>
        )}
        {/* Future paid flow only (docs/EVENTS.md): V1 never creates an event under review. */}
        {e.status === 'under_review' && (
          <p className="ev-banner" role="status">
            Under review. Paid events from individuals are checked by the Art and Artist team first. Only you can see it until then.
          </p>
        )}
        {e.status === 'scheduled' && e.changed && (
          <p className="ev-banner" role="status">
            {e.changed}. People who are interested have been told.
          </p>
        )}

        <div className="group ev-facts">
          <Row icon={<CalendarDays size={20} aria-hidden />} label={whenLabel(e.start)} value={e.end ? `until ${whenLabel(e.end).split(' · ')[1]}` : undefined} chevron={false} />
          <Row icon={<MapPin size={20} aria-hidden />} label={`${e.venue}, ${e.city}`} chevron={false} />
          <Row icon={<IndianRupee size={20} aria-hidden />} label={priceLabel(e)} value={e.price.kind === 'paid' ? 'Paid to the host' : undefined} chevron={false} />
        </div>

        <div className="ev-actions">
          <InterestedButton e={e} />
          {e.link && e.status === 'scheduled' && (
            <a className="btn btn--secondary btn--m ev-link" href={e.link} target="_blank" rel="noopener noreferrer">
              {e.price.kind === 'paid' ? 'Tickets and details' : 'Register'} <ExternalLink size={15} aria-hidden />
              <span className="sr-only"> (opens the host's site)</span>
            </a>
          )}
        </div>

        <p className="body ev-summary">{e.summary}</p>

        {host && (
          <PressCard className="prow" onPress={() => push(host.kind === 'org' ? { name: 'org', id: host.id } : { name: 'profile', id: host.id })} scale={0.985}>
            <Avatar party={host} size={40} />
            <div className="prow-text">
              <p className="item-title">
                {host.name} {host.kind === 'org' && host.verified && <Verified size={13} />}
              </p>
              <p className="meta">Host</p>
            </div>
          </PressCard>
        )}
        {w && (
          <PressCard className="prow" onPress={() => push({ name: 'work', id: w.id })} scale={0.985}>
            <Photo media={w.media} className="ev-project-thumb" />
            <div className="prow-text">
              <p className="item-title" lang={scriptLang(w.title)}>{w.title}</p>
              <p className="meta">
                {w.format} · {w.stage}
              </p>
            </div>
          </PressCard>
        )}

        {speakers.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title={e.type === 'screening' ? 'With' : 'Speakers'} />
            <div className="list list--flush">
              {speakers.map((p) => (
                <PressCard key={p.id} className="prow" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985}>
                  <Avatar party={p} size={40} />
                  <div className="prow-text">
                    <p className="item-title">{p.name}</p>
                    <p className="meta">{p.role}</p>
                  </div>
                </PressCard>
              ))}
            </div>
          </section>
        )}

        <p className="meta ev-trust">
          <ShieldCheck size={14} aria-hidden /> Art and Artist never charges to apply or audition. If anyone asks for money for a role at this event, report it.
        </p>
      </div>

      <Sheet open={menu} onClose={() => (setMenu(false), setConfirm(false))} title={confirm ? 'Cancel this event?' : e.title}>
        {confirm ? (
          <div className="stack">
            <p className="body">It stays on the page marked Cancelled, and everyone who marked Interested is told.</p>
            <Button
              block
              size="l"
              variant="danger"
              onClick={() => {
                cancelEvent(e.id);
                research.track('event_cancelled', { objectType: 'event', objectId: e.id });
                setMenu(false);
                setConfirm(false);
                showToast({ text: 'Event cancelled. People who were interested have been told.' });
              }}
            >
              Cancel event
            </Button>
            <Button block size="l" variant="secondary" onClick={() => setConfirm(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <div className="group">
            {mine && e.status !== 'cancelled' && (
              <>
                <Row icon={<Pencil size={20} />} label="Edit event" onPress={() => (setMenu(false), push({ name: 'composeEvent', editId: e.id }))} />
                <Row icon={<XCircle size={20} />} label="Cancel event" onPress={() => setConfirm(true)} />
              </>
            )}
            {!mine && <Row icon={<Flag size={20} />} label="Report event" onPress={() => (setMenu(false), openSheet({ name: 'report', subject: e.title, partyId: e.hostId, target: { kind: 'Event', id: e.id } }))} />}
            {mine && e.status === 'cancelled' && <p className="meta">This event is cancelled. Nothing more to change.</p>}
          </div>
        )}
      </Sheet>
    </div>
  );
}
