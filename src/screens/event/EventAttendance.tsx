import { useState } from 'react';
import type { IndustryEvent } from '../../data/types';
import { party } from '../../state/selectors';
import { useStore } from '../../state/store';
import { Button } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

export function EventAttendance({ event }: { event: IndustryEvent }) {
  const store = useStore();
  const request = store.eventRequest(event.id);
  const [open, setOpen] = useState(false);
  const [withdraw, setWithdraw] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(request?.email ?? store.accountEmail);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const host = party(event.hostId);
  const pending = request?.status === 'pending';
  const confirmed = request?.status === 'confirmed';
  const closed = event.status === 'closed' || event.start <= Date.now();
  if (store.canManageEvent(event.id)) return null;
  return (
    <div className="ev-attendance">
      {event.status === 'cancelled' ? (
        <p className="ev-request-status" role="status">
          Event cancelled
        </p>
      ) : confirmed ? (
        <p className="ev-request-status" role="status">
          <b>Place confirmed</b>
          <span>You have a place at this event.</span>
        </p>
      ) : pending && !closed ? (
        <p className="ev-request-status" role="status">
          <b>Request sent</b>
          <span>The organiser will review your request and contact you if you get a place.</span>
        </p>
      ) : request?.status === 'not-accommodated' || (pending && closed) ? (
        <p className="ev-request-status" role="status">
          <b>Requests closed</b>
          <span>We couldn’t offer you a place at this event.</span>
        </p>
      ) : store.canRequestEvent(event.id) ? (
        <>
          <Button
            block
            size="l"
            onClick={() => {
              setError('');
              setSent(false);
              setOpen(true);
            }}
          >
            Request to attend
          </Button>
          <p className="meta ev-attendance-note">The organiser reviews requests before confirming places.</p>
        </>
      ) : (
        <p className="ev-request-status" role="status">
          {store.eventStatus(event.id) === 'Full' ? 'This event is full. New requests are paused.' : 'Requests are closed.'}
        </p>
      )}
      {request?.status === 'withdrawn' && <p className="meta">You withdrew your request.</p>}
      {event.status !== 'cancelled' && event.start > Date.now() && (pending || confirmed) && (
        <button className="link ev-withdraw" onClick={() => setWithdraw(true)}>
          {confirmed ? 'Give up your place' : 'Withdraw request'}
        </button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={sent ? 'Request sent' : 'Request to attend'}>
        {sent ? (
          <div className="stack">
            <p className="body">The organiser will review your request and contact you if you get a place.</p>
            <Button block onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const problem = store.requestEventPlace(event.id, email, note);
              if (problem) setError(problem);
              else setSent(true);
            }}
          >
            <p className="meta">Requesting as {party(store.viewer.id)?.name}</p>
            <div>
              <label className="field-label" htmlFor="event-request-email">
                Email
              </label>
              <input
                id="event-request-email"
                className="field"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
              />
            </div>
            <p className="meta">
              Your email is shared only with {host?.name ?? 'the organiser'} for this event. It does not appear on your public profile.
            </p>
            <div>
              <label className="field-label" htmlFor="event-request-note">
                Note to organiser (optional)
              </label>
              <textarea
                id="event-request-note"
                className="field field--area"
                rows={2}
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <Button block size="l" type="submit">
              Send request
            </Button>
          </form>
        )}
      </Sheet>
      <Sheet open={withdraw} onClose={() => setWithdraw(false)} title={confirmed ? 'Give up your place?' : 'Withdraw request?'}>
        <div className="stack">
          <p className="body">
            {confirmed ? 'Your place will become available to someone else.' : 'The organiser will no longer consider your request.'}
          </p>
          <Button
            block
            variant="danger"
            onClick={() => {
              if (store.withdrawEventRequest(event.id)) {
                setWithdraw(false);
                store.showToast({
                  text: confirmed ? 'Place released.' : 'Request withdrawn.',
                });
              } else {
                setWithdraw(false);
                store.showToast({
                  text: 'This request can no longer be withdrawn.',
                  tone: 'error',
                });
              }
            }}
          >
            {confirmed ? 'Give up place' : 'Withdraw request'}
          </Button>
          <Button block variant="secondary" onClick={() => setWithdraw(false)}>
            Keep it
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
