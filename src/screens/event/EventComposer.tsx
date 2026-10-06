import { useFeatures } from '../../ui/features';
import { CalendarDays, Check, Clock, ImagePlus, IndianRupee, Link2, MapPin, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import type { EventType, IndustryEvent } from '../../data/types';
import { EVENT_CAPABILITIES, EVENT_TYPES, validateDraft, type EventDraft } from '../../domain/events';
import type { Media } from '../../data/types';
import { MediaPicker } from '../create/PostComposer';
import { research } from '../../research-data/client';
import { hostFacts } from '../../state/events';
import { org, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { DateField, RowField } from '../../ui/fields';
import { Avatar, Button, IconButton, Photo, Row } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

/*
 * Event composer (docs/EVENTS.md). One page, like the role composer. Errors appear next to the field
 * they belong to, only after a first try, and every message says what to do.
 * V1: free events only, published at once, with an optional registration or RSVP link. The paid fields and
 * review path below are the future flow; they only render when EVENT_CAPABILITIES.paidEvents is on (off in V1).
 */
const IST = '+05:30';
const isoDay = (ms: number) => new Date(ms + 5.5 * 36e5).toISOString().slice(0, 10);
const isoTime = (ms: number) => new Date(ms + 5.5 * 36e5).toISOString().slice(11, 16);

export function EventComposer({ projectId, editId }: { projectId?: string; editId?: string }) {
  const districtFeature = useFeatures().home === 'district';
  const { pop, viewer, acting, events, createEvent, updateEvent, showToast, replace } = useStore();
  const editing = editId ? events.find((e) => e.id === editId) : undefined;
  const hostId = editing?.hostId ?? (acting !== 'self' ? acting : viewer.id);
  const host = acting !== 'self' && !editing ? org(acting) : hostId === viewer.id ? person(viewer.id) : org(hostId);
  const facts = hostFacts(hostId);
  const district = districtFeature && facts?.kind === 'org';
  const linked = editing?.projectId ?? projectId;
  const w = linked ? work(linked) : undefined;

  const [type, setType] = useState<EventType | undefined>(editing?.type ?? (projectId ? 'screening' : undefined));
  const [title, setTitle] = useState(editing?.title ?? (w ? `${w.title}: screening` : ''));
  const [date, setDate] = useState(editing ? isoDay(editing.start) : '');
  const [time, setTime] = useState(editing ? isoTime(editing.start) : '18:30');
  const [city, setCity] = useState(editing?.city ?? host.city ?? '');
  const [venue, setVenue] = useState(editing?.venue ?? '');
  const paidOn = EVENT_CAPABILITIES.paidEvents;
  const [paid, setPaid] = useState(paidOn && editing?.price.kind === 'paid');
  const [cover, setCover] = useState<Media | undefined>(editing?.cover);
  const [coverPick, setCoverPick] = useState(false);
  const [amount, setAmount] = useState(editing?.price.kind === 'paid' ? editing.price.amount.replace(/^₹/, '') : '');
  const [link, setLink] = useState(editing?.link ?? '');
  const [summary, setSummary] = useState(editing?.summary ?? '');
  const [tried, setTried] = useState(false);
  const [discard, setDiscard] = useState(false);

  const start = date && time ? new Date(`${date}T${time}:00${IST}`).getTime() : undefined;
  const draft: EventDraft = { type, title, summary, city, venue, start, price: paidOn && paid ? { kind: 'paid', amount: amount.trim() ? `₹${amount.trim().replace(/^₹/, '')}` : '' } : { kind: 'free' }, link: link.trim() || undefined, projectId: linked };
  const check = validateDraft(draft, facts, Date.now());
  const err = (k: keyof typeof check.errors) => (tried ? check.errors[k] : undefined);
  const dirty = !!(title || venue || summary || date) && !editing;
  const reviewing = !editing && check.review === 'under_review';

  const submit = () => {
    setTried(true);
    if (!check.ok) {
      // Move to the first field that needs attention, so keyboard and screen reader users land on it.
      requestAnimationFrame(() => {
        const bad = document.querySelector('.ev-composer [aria-invalid="true"]') as HTMLElement | null;
        (bad?.tagName === 'FIELDSET' ? (bad.querySelector('button') as HTMLElement | null) : bad)?.focus();
      });
      return;
    }
    const body: Omit<IndustryEvent, 'id' | 'status'> = { type: type!, title: title.trim(), hostId, projectId: linked, city: city.trim(), venue: venue.trim(), start: start!, price: draft.price!, link: draft.link, cover, summary: summary.trim(), speakerIds: editing?.speakerIds };
    if (editing) {
      updateEvent(editing.id, body);
      showToast({ text: editing.start !== start || editing.venue !== body.venue ? 'Saved. People who are interested will be told what changed.' : 'Saved.' });
      pop();
      return;
    }
    const id = createEvent(body, check.review);
    research.track('event_created', { objectType: 'event', objectId: id, metadata: { type, paid, review: check.review, linked: !!linked, host: facts?.kind, registration: !!draft.link, cover: !!cover } });
    showToast({ text: check.review === 'live' ? "It's live. You'll find it on your profile." : "Sent for review. We'll let you know, usually within a day." });
    replace({ name: 'event', id });
  };

  if (check.errors.host && !editing)
    return (
      <div className={`composer ev-composer${district ? ' dhouse-page' : ''}`}>
        <header className="composer-bar">
          <IconButton label="Close" onClick={pop}>
            <X size={24} />
          </IconButton>
          <h1 className="composer-title">New event</h1>
          <span className="confirm-spacer" />
        </header>
        <div className="composer-body stack">
          <p className="title-2">Verify your identity to host events.</p>
          <p className="body">Only verified production houses and verified adults can host events, so everyone knows who is behind them. You can still find and mark events you're interested in.</p>
          <Button block size="l" variant="secondary" onClick={pop}>
            Back
          </Button>
        </div>
      </div>
    );

  return (
    <div className={`composer ev-composer${district ? ' dhouse-page' : ''}`}>
      <header className="composer-bar">
        <IconButton label={dirty ? 'Close (asks before discarding)' : 'Close'} onClick={() => (dirty ? setDiscard(true) : pop())}>
          <X size={24} />
        </IconButton>
        <h1 className="composer-title">{editing ? 'Edit event' : 'New event'}</h1>
        <button className="confirm" onClick={submit} aria-label={editing ? 'Save' : reviewing ? 'Send for review' : 'Publish event'}>
          <Check size={22} strokeWidth={2.6} />
        </button>
      </header>

      <div className="composer-body stack stack--loose">
        <div className="composer-who composer-who--small">
          <Avatar party={host} size={28} />
          <span className="meta meta--dark">Hosted by {host.name}</span>
        </div>

        <fieldset className="ev-types" aria-invalid={!!err('type')} aria-describedby={err('type') ? 'ev-type-err' : undefined}>
          <legend className="field-label">What kind of event?</legend>
          <div className="chips chips--wrap">
            {EVENT_TYPES.map((t) => (
              <button key={t.id} type="button" className={`chip ${type === t.id ? 'is-on' : ''}`} aria-pressed={type === t.id} onClick={() => setType(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {err('type') && <p id="ev-type-err" className="field-error">{err('type')}</p>}
        </fieldset>

        <div>
          <label className="field-label" htmlFor="ev-title">
            Title
          </label>
          <input id="ev-title" className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kaaval: cast and crew screening" maxLength={90} aria-invalid={!!err('title')} aria-describedby={err('title') ? 'ev-title-err' : undefined} />
          {err('title') && <p id="ev-title-err" className="field-error">{err('title')}</p>}
        </div>

        {w && (
          <p className="meta ev-linked">
            Linked to <b>{w.title}</b>. It will show on the project page.
          </p>
        )}

        <div className="group">
          <Row icon={<CalendarDays size={20} aria-hidden />} label="Date" value={<DateField value={date} onChange={setDate} label="Event date" placeholder="Choose" />} />
          <Row icon={<Clock size={20} aria-hidden />} label={<RowField id="ev-time" label="Starts at"><input id="ev-time" type="time" className="row-input" value={time} onChange={(e) => setTime(e.target.value)} /></RowField>} />
        </div>
        {err('start') && <p className="field-error" role="alert">{err('start')}</p>}

        <div className="group">
          <Row icon={<MapPin size={20} aria-hidden />} label={<RowField id="ev-city" label="City"><input id="ev-city" className="row-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" autoComplete="address-level2" aria-invalid={!!err('city')} /></RowField>} />
          <Row label={<RowField id="ev-venue" label="Venue"><input id="ev-venue" className="row-input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. PVR Juhu, Screen 2" aria-invalid={!!err('venue')} /></RowField>} />
        </div>
        {(err('city') || err('venue')) && <p className="field-error">{err('city') ?? err('venue')}</p>}

        <div>
          <div className="group">
            {/* Future paid flow: price and tickets. Not rendered in V1 (every event is free). */}
            {paidOn && (
              <Row
                icon={<IndianRupee size={20} aria-hidden />}
                label={
                  paid ? (
                    <RowField id="ev-amount" label="Price (₹)">
                      <input id="ev-amount" className="row-input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ''))} placeholder="500" aria-invalid={!!err('price')} />
                    </RowField>
                  ) : (
                    'Free'
                  )
                }
                value={
                  <select className="row-select" value={paid ? 'paid' : 'free'} onChange={(e) => setPaid(e.target.value === 'paid')} aria-label="Free or paid">
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                }
              />
            )}
            <Row icon={<Link2 size={20} aria-hidden />} label={<RowField id="ev-link" label={paidOn && paid ? 'Tickets link' : 'Registration or RSVP link (optional)'}><input id="ev-link" className="row-input" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" aria-invalid={!!err('link')} /></RowField>} />
          </div>
          {err('price') && <p className="field-error">{err('price')}</p>}
          {err('link') && <p className="field-error">{err('link')}</p>}
          {paidOn && <p className="group-note">The price is always shown. People pay you directly; Art and Artist never takes money for events.</p>}
        </div>

        <div>
          <span className="field-label">Cover (optional)</span>
          {cover ? (
            <div className="ev-cover">
              <Photo media={cover} showPlay={false} />
              <span className="ev-cover-actions">
                <Button size="s" variant="secondary" onClick={() => setCoverPick(true)}>
                  Change
                </Button>
                <Button size="s" variant="secondary" onClick={() => setCover(undefined)}>
                  Remove
                </Button>
              </span>
            </div>
          ) : (
            <Button variant="secondary" icon={<ImagePlus size={16} />} onClick={() => setCoverPick(true)}>
              Add a cover
            </Button>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="ev-summary">
            What happens
          </label>
          <textarea id="ev-summary" className="field field--area" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Who it's for and what to expect, in a sentence or two" aria-invalid={!!err('summary')} aria-describedby={err('summary') ? 'ev-summary-err' : undefined} />
          {err('summary') && <p id="ev-summary-err" className="field-error">{err('summary')}</p>}
        </div>

        <p className="meta ev-trust">
          <ShieldCheck size={14} aria-hidden /> Auditions and casting are roles, not events. Events are for adults.
          {/* Future paid flow only: never shown in V1, where nothing waits for review. */}
          {reviewing ? ' Paid events from individuals are checked by the Art and Artist team before they go live.' : ''}
        </p>

        <Button block size="l" onClick={submit}>
          {editing ? 'Save changes' : reviewing ? 'Send for review' : 'Publish event'}
        </Button>
      </div>

      <Sheet className={district ? 'dhouse-sheet' : undefined} open={coverPick} onClose={() => setCoverPick(false)} title="Cover" size="tall">
        <MediaPicker single selected={[]} onDone={(ms: Media[]) => (ms[0] && setCover(ms[0]), setCoverPick(false))} />
      </Sheet>
      <Sheet className={district ? 'dhouse-sheet' : undefined} open={discard} onClose={() => setDiscard(false)} title="Discard?" close={false}>
        <div className="stack">
          <Button block size="l" variant="danger" onClick={pop}>
            Discard
          </Button>
          <Button block size="l" variant="secondary" onClick={() => setDiscard(false)}>
            Keep editing
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
