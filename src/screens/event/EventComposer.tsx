import { CalendarDays, Check, Clock, ImagePlus, Link2, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import type { Craft, EventType, IndustryEvent, Media } from '../../data/types';
import { CRAFTS } from '../../data/crafts';
import { AUDITION_MESSAGE, EVENT_TYPES, validateDraft, type EventDraft } from '../../domain/events';
import { MediaPicker } from '../create/PostComposer';
import { hostFacts } from '../../state/events';
import { party } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { DateField, RowField } from '../../ui/fields';
import { Avatar, Button, EmptyState, IconButton, Photo, Row } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { useFeatures } from '../../ui/features';
const IST = '+05:30';
const isoDay = (ms: number) => new Date(ms + 5.5 * 36e5).toISOString().slice(0, 10);
const isoTime = (ms: number) => new Date(ms + 5.5 * 36e5).toISOString().slice(11, 16);

export function EventComposer({ projectId, editId }: { projectId?: string; editId?: string }) {
  const district = useFeatures().home === 'district';
  const { pop, viewer, acting, events, createEvent, updateEvent, showToast, replace, openSheet, canManageEvent, eventConfirmedCount } =
    useStore();
  const editing = editId ? events.find((e) => e.id === editId) : undefined;
  const hostId = editing?.hostId ?? (acting === 'self' ? viewer.id : acting);
  const host = party(hostId);
  const linked = editing?.projectId ?? projectId;
  const w = linked ? work(linked) : undefined;
  const [type, setType] = useState<EventType | undefined>(editing?.type ?? (linked ? 'screening' : undefined));
  const [title, setTitle] = useState(editing?.title ?? (w ? `${w.title}: screening` : ''));
  const [date, setDate] = useState(editing ? isoDay(editing.start) : '');
  const [time, setTime] = useState(editing ? isoTime(editing.start) : '18:30');
  const [endDate, setEndDate] = useState(editing?.end ? isoDay(editing.end) : '');
  const [endTime, setEndTime] = useState(editing?.end ? isoTime(editing.end) : '');
  const [location, setLocation] = useState<'physical' | 'online'>(
    editing?.location ?? (editing?.venue === 'Online' ? 'online' : 'physical'),
  );
  const [city, setCity] = useState(editing?.city ?? host?.city ?? '');
  const [venue, setVenue] = useState(editing?.venue === 'Online' ? '' : (editing?.venue ?? ''));
  const [joiningUrl, setJoiningUrl] = useState(editing?.joiningUrl ?? '');
  const [capacity, setCapacity] = useState(editing?.capacity?.toString() ?? '');
  const [cover, setCover] = useState<Media | undefined>(editing?.cover);
  const [coverPick, setCoverPick] = useState(false);
  const [link, setLink] = useState(editing?.link ?? '');
  const [summary, setSummary] = useState(editing?.summary ?? '');
  const [audience, setAudience] = useState<Craft[]>(Array.isArray(editing?.audience) ? editing.audience : []);
  const [tried, setTried] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [saveError, setSaveError] = useState('');
  const start = date && time ? new Date(`${date}T${time}:00${IST}`).getTime() : undefined;
  const end = endTime && date ? new Date(`${endDate || date}T${endTime}:00${IST}`).getTime() : undefined;
  const draft: EventDraft = {
    type,
    title,
    summary,
    city,
    venue,
    start,
    end,
    location,
    joiningUrl: location === 'online' ? joiningUrl.trim() || undefined : undefined,
    capacity: capacity === '' ? undefined : Number(capacity),
    price: { kind: 'free' },
    link: link.trim() || undefined,
  };
  const check = validateDraft(draft, hostFacts(hostId), Date.now());
  if (editing && draft.capacity !== undefined && draft.capacity < eventConfirmedCount(editing.id)) {
    check.errors.capacity = 'Keep capacity at or above the number of confirmed attendees.';
    check.ok = false;
  }
  const err = (key: keyof typeof check.errors) => (tried ? check.errors[key] : undefined);
  const dirty = !!(title || venue || summary || date || link || capacity || cover || joiningUrl);
  const submit = () => {
    setTried(true);
    setSaveError('');
    if (!check.ok) {
      requestAnimationFrame(() => (document.querySelector('.ev-composer [aria-invalid="true"]') as HTMLElement | null)?.focus());
      return;
    }
    const body: Omit<IndustryEvent, 'id' | 'status'> = {
      type: type!,
      title: title.trim(),
      hostId,
      projectId: linked,
      city: location === 'online' ? '' : city.trim(),
      venue: location === 'online' ? 'Online' : venue.trim(),
      start: start!,
      end,
      location,
      joiningUrl: draft.joiningUrl,
      capacity: draft.capacity,
      price: { kind: 'free' },
      link: draft.link,
      cover,
      summary: summary.trim(),
      audience: audience.length ? audience : 'everyone',
      speakerIds: editing?.speakerIds,
    };
    if (editing) {
      if (!updateEvent(editing.id, body)) {
        setSaveError('Could not save. Check your organiser identity and confirmed places.');
        return;
      }
      showToast({ text: 'Event updated.' });
      pop();
    } else {
      const id = createEvent(body, 'live');
      if (!id) {
        setSaveError('Switch to an authorised organiser identity before publishing.');
        return;
      }
      showToast({ text: 'Event published. Requests are open.' });
      replace({ name: 'event', id });
    }
  };
  if (!host || check.errors.host || (editId && (!editing || !canManageEvent(editId))))
    return (
      <div className="screen">
        <header className="topbar">
          <IconButton label="Back" onClick={pop}>
            <X size={22} />
          </IconButton>
        </header>
        <EmptyState
          title={editing ? 'Switch to the organiser identity' : 'Verify your identity to host events'}
          body="Verified adults and verified production houses can host free events."
        />
      </div>
    );
  return (
    <div className={`composer ev-composer${district ? ' dhouse-page' : ''}`}>
      <header className="composer-bar">
        <IconButton label="Close" onClick={() => (dirty ? setDiscard(true) : pop())}>
          <X size={24} />
        </IconButton>
        <h1 className="composer-title">{editing ? 'Edit event' : 'New event'}</h1>
        <button className="confirm" onClick={submit} aria-label={editing ? 'Save event' : 'Publish event'}>
          <Check size={22} />
        </button>
      </header>
      <div className="composer-body stack stack--loose">
        <div className="composer-who composer-who--small">
          <Avatar party={host} size={28} />
          <span className="meta">Hosted by {host.name}</span>
        </div>
        <div>
          <label className="field-label" htmlFor="ev-title">
            Event title
          </label>
          <input
            id="ev-title"
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Writers’ Table Read Night"
            aria-invalid={!!err('title')}
          />
          {err('title') && (
            <p className="field-error" role="alert">
              {err('title')}
            </p>
          )}
          {err('title') === AUDITION_MESSAGE && (
            <Button
              variant="secondary"
              onClick={() => {
                pop();
                openSheet({ name: 'pickProject' });
              }}
            >
              Create a Role
            </Button>
          )}
        </div>
        <fieldset className="ev-types" aria-invalid={!!err('type')}>
          <legend className="field-label">Event category</legend>
          <div className="chips chips--wrap">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.id}
                className={`chip ${type === t.id ? 'is-on' : ''}`}
                aria-pressed={type === t.id}
                onClick={() => setType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {err('type') && <p className="field-error">{err('type')}</p>}
        </fieldset>
        {w && <p className="meta">Linked to {w.title}</p>}
        <div className="group">
          <Row
            icon={<CalendarDays size={20} />}
            label="Date"
            value={<DateField value={date} onChange={setDate} label="Event date" placeholder="Choose" />}
          />
          <Row
            icon={<Clock size={20} />}
            label={
              <RowField id="ev-time" label="Start time">
                <input id="ev-time" type="time" className="row-input" value={time} onChange={(e) => setTime(e.target.value)} />
              </RowField>
            }
          />
        </div>
        {err('start') && <p className="field-error">{err('start')}</p>}
        <details className="ev-extra">
          <summary>End time (optional){endTime ? ` · ${endTime}` : ''}</summary>
          <div className="group">
            <Row
              label="End date"
              value={<DateField value={endDate || date} onChange={setEndDate} label="Event end date" placeholder="Choose" />}
            />
            <Row
              label={
                <RowField id="ev-end" label="End time">
                  <input id="ev-end" type="time" className="row-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </RowField>
              }
            />
          </div>
          {endTime && (
            <button
              className="link"
              onClick={() => {
                setEndTime('');
                setEndDate('');
              }}
            >
              Remove end time
            </button>
          )}
          {err('end') && <p className="field-error">{err('end')}</p>}
        </details>
        <fieldset className="ev-types">
          <legend className="field-label">Location</legend>
          <div className="chips">
            <button
              className={`chip ${location === 'physical' ? 'is-on' : ''}`}
              aria-pressed={location === 'physical'}
              onClick={() => setLocation('physical')}
            >
              In person
            </button>
            <button
              className={`chip ${location === 'online' ? 'is-on' : ''}`}
              aria-pressed={location === 'online'}
              onClick={() => setLocation('online')}
            >
              Online
            </button>
          </div>
        </fieldset>
        {location === 'physical' ? (
          <div className="group">
            <Row
              icon={<MapPin size={20} />}
              label={
                <RowField id="ev-city" label="City">
                  <input
                    id="ev-city"
                    className="row-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    aria-invalid={!!err('city')}
                  />
                </RowField>
              }
            />
            <Row
              label={
                <RowField id="ev-venue" label="Venue">
                  <input
                    id="ev-venue"
                    className="row-input"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Venue name and address"
                    aria-invalid={!!err('venue')}
                  />
                </RowField>
              }
            />
          </div>
        ) : (
          <div>
            <label className="field-label" htmlFor="ev-joining">
              Joining link (optional)
            </label>
            <input
              id="ev-joining"
              className="field"
              type="url"
              value={joiningUrl}
              onChange={(e) => setJoiningUrl(e.target.value)}
              placeholder="https://"
              aria-invalid={!!err('joiningUrl')}
            />
            <p className="meta">Only confirmed attendees can see this link.</p>
          </div>
        )}
        {(err('city') || err('venue') || err('joiningUrl')) && (
          <p className="field-error">{err('city') || err('venue') || err('joiningUrl')}</p>
        )}
        <div>
          <label className="field-label" htmlFor="ev-summary">
            What happens
          </label>
          <textarea
            id="ev-summary"
            className="field field--area"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What is it, who is it for, and what should people expect?"
            aria-invalid={!!err('summary')}
          />
          {err('summary') && <p className="field-error">{err('summary')}</p>}
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
        <details className="ev-extra">
          <summary>Who this is for · {audience.length ? `${audience.length} crafts` : 'Everyone'}</summary>
          <p className="meta">Helps people understand relevance. Anyone can request a place.</p>
          <div className="chips chips--wrap">
            <button className={`chip ${!audience.length ? 'is-on' : ''}`} aria-pressed={!audience.length} onClick={() => setAudience([])}>
              Everyone
            </button>
            {CRAFTS.map((c) => (
              <button
                key={c.id}
                className={`chip ${audience.includes(c.id) ? 'is-on' : ''}`}
                aria-pressed={audience.includes(c.id)}
                onClick={() => setAudience((a) => (a.includes(c.id) ? a.filter((x) => x !== c.id) : [...a, c.id]))}
              >
                {c.label}
              </button>
            ))}
          </div>
        </details>
        <div className="group">
          <Row label="Attendance" value="Request to attend · Free" chevron={false} />
          <Row
            label={
              <RowField id="ev-capacity" label="Maximum attendees (optional)">
                <input
                  id="ev-capacity"
                  type="number"
                  min="1"
                  step="1"
                  className="row-input"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="No limit set"
                  aria-invalid={!!err('capacity')}
                />
              </RowField>
            }
          />
          <Row
            icon={<Link2 size={20} />}
            label={
              <RowField id="ev-link" label="More information link (optional)">
                <input
                  id="ev-link"
                  className="row-input"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://"
                  aria-invalid={!!err('link')}
                />
              </RowField>
            }
          />
        </div>
        {(err('capacity') || err('link')) && <p className="field-error">{err('capacity') || err('link')}</p>}
        <p className="meta">You review requests and confirm places in Ana. Information links do not register attendees.</p>
        {saveError && (
          <p className="field-error" role="alert">
            {saveError}
          </p>
        )}
        <Button block size="l" onClick={submit}>
          {editing ? 'Save changes' : 'Publish event'}
        </Button>
      </div>
      <Sheet open={coverPick} onClose={() => setCoverPick(false)} title="Cover" size="tall">
        <MediaPicker
          kind="image"
          single
          selected={[]}
          onDone={(ms: Media[]) => {
            if (ms[0]?.kind === 'image') setCover(ms[0]);
            setCoverPick(false);
          }}
        />
      </Sheet>
      <Sheet open={discard} onClose={() => setDiscard(false)} title="Discard changes?" close={false}>
        <div className="stack">
          <Button block variant="danger" onClick={pop}>
            Discard
          </Button>
          <Button block variant="secondary" onClick={() => setDiscard(false)}>
            Keep editing
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
