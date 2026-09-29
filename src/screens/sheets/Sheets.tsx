import { Check, CircleCheck, PenLine, UserSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as seed from '../../data/seed';
import { useStore, type Sheet as SheetRoute } from '../../state/store';
import { findOpportunity, firstName, org, party, person } from '../../state/selectors';
import { Avatar, Button, EmptyState, Pressable, Row, Toggle } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { RoleRow } from '../discover/RoleRow';

export function SheetHost() {
  const { sheet, closeSheet } = useStore();
  const is = (n: SheetRoute['name']) => sheet?.name === n;
  return (
    <>
      <Sheet open={is('create')} onClose={closeSheet} title="Create">
        <CreateMenu />
      </Sheet>
      <Sheet open={is('notifications')} onClose={closeSheet} title="Notifications" size="tall">
        <Notifications />
      </Sheet>
      <Sheet open={is('availability')} onClose={closeSheet} title="Availability">
        <AvailabilityForm />
      </Sheet>
      <Sheet open={is('respond')} onClose={closeSheet} title="Respond" size="tall">
        {sheet?.name === 'respond' && <RespondForm id={sheet.id} />}
      </Sheet>
      <Sheet open={is('showInterest')} onClose={closeSheet} title="Show interest">
        {sheet?.name === 'showInterest' && <InterestForm id={sheet.id} />}
      </Sheet>
      <Sheet open={is('reviewInterest')} onClose={closeSheet} title="Interested" size="tall">
        <ReviewInterest opportunityId={sheet?.name === 'reviewInterest' ? sheet.opportunityId : undefined} />
      </Sheet>
      <Sheet open={is('reportCredit')} onClose={closeSheet} title="Report credit">
        {sheet?.name === 'reportCredit' && <ReportCredit title={sheet.title} />}
      </Sheet>
      <Sheet open={is('activity')} onClose={closeSheet} title="Your activity" size="tall">
        <Activity />
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------ Create */

function CreateMenu() {
  const { push } = useStore();
  return (
    <div className="group">
      <Row icon={<PenLine size={22} />} label="Post" onPress={() => push({ name: 'composePost' })} />
      <Row icon={<UserSearch size={22} />} label="Looking for someone" onPress={() => push({ name: 'composeCollab', intent: 'looking' })} />
      <Row icon={<CircleCheck size={22} />} label="Available for work" onPress={() => push({ name: 'composeCollab', intent: 'available' })} />
    </div>
  );
}

/* ----------------------------------------------------------- Notifications */

function Notifications() {
  const { notifications, markNotificationsRead, push, openSheet } = useStore();
  useEffect(() => () => markNotificationsRead(), [markNotificationsRead]);
  if (!notifications.length) return <EmptyState title="Nothing new" />;
  return (
    <div className="list list--flush">
      {notifications.map((n) => (
        <Pressable
          key={n.id}
          className="notif"
          scale={0.99}
          onClick={() => {
            if (n.route) push(n.route);
            else if (n.kind === 'interest') openSheet({ name: 'reviewInterest' });
          }}
        >
          <Avatar party={party(n.actorId)!} size={40} />
          <span className="notif-text">
            {n.text}
            <span className="meta">{n.time}</span>
          </span>
          {n.unread && <span className="dot dot--inline" />}
        </Pressable>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ Availability */

const FROM = ['Now', '3 Oct', '15 Oct', '1 Nov'];

function AvailabilityForm() {
  const { availability, setAvailability, closeSheet, scenario, setScenario } = useStore();
  const [open, setOpen] = useState(availability.open || scenario.newUser);
  const [from, setFrom] = useState(availability.from);
  const [scope, setScope] = useState(availability.scope);
  return (
    <div className="stack">
      <div className="group">
        <Row label="Open to work">
          <Toggle on={open} onChange={setOpen} label="Open to work" />
        </Row>
      </div>
      {open && (
        <>
          <div className="chips">
            {FROM.map((f) => (
              <button key={f} className={`chip ${from === f ? 'is-on' : ''}`} onClick={() => setFrom(f)}>
                {f === 'Now' ? 'From now' : `From ${f}`}
              </button>
            ))}
          </div>
          <input id="avail-scope" className="field" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="City, and whether you travel" aria-label="Where" />
        </>
      )}
      <Button
        block
        size="l"
        onClick={() => {
          setAvailability({ open, from, scope });
          if (scenario.newUser) setScenario({ newUser: false });
          closeSheet();
        }}
      >
        Save
      </Button>
    </div>
  );
}

/* ----------------------------------------------------------------- Respond */

function RespondForm({ id }: { id: string }) {
  const { respond, userCollabs, viewer } = useStore();
  const o = findOpportunity(id, userCollabs)!;
  const reel = seed.portfolio[viewer.id][0];
  const credits = seed.credits[viewer.id].length;
  const [answers, setAnswers] = useState<string[]>(() => (o.questions ?? []).map(() => ''));
  const [withReel, setWithReel] = useState(true);
  const [withCredits, setWithCredits] = useState(true);
  const [sending, setSending] = useState(false);
  const remaining = answers.filter((a) => a.trim().length < 2).length;

  return (
    <div className="stack">
      <div>
        <p className="item-title">{o.role}</p>
        <p className="meta">
          {o.project} · {org(o.orgId!).name}
        </p>
      </div>

      <div className="group">
        <Row label="Your profile" value={<Check size={18} className="accent" />} />
        <Row label={reel.caption ?? 'Showreel'} onPress={() => setWithReel((v) => !v)} chevron={false} value={withReel ? <Check size={18} className="accent" /> : <span className="meta">Add</span>} />
        <Row label={`${credits} credits`} onPress={() => setWithCredits((v) => !v)} chevron={false} value={withCredits ? <Check size={18} className="accent" /> : <span className="meta">Add</span>} />
      </div>

      {o.questions?.map((q, i) => (
        <label key={q} className="question">
          <span className="item-title">{q}</span>
          <textarea
            id={`q${i}`}
            className="field field--area"
            rows={2}
            value={answers[i]}
            onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder="Your answer"
          />
        </label>
      ))}

      <div className="sheet-sticky">
        <Button
          block
          size="l"
          loading={sending}
          disabled={remaining > 0}
          onClick={() => {
            setSending(true);
            window.setTimeout(() => respond(id, ['Profile', ...(withReel ? ['Showreel'] : []), ...(withCredits ? ['Credits'] : [])]), 800);
          }}
        >
          {remaining ? `${remaining} ${remaining === 1 ? 'answer' : 'answers'} to go` : 'Send'}
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Interest */

function InterestForm({ id }: { id: string }) {
  const { sendInterest, userCollabs } = useStore();
  const o = findOpportunity(id, userCollabs)!;
  const author = person(o.authorId!);
  const [note, setNote] = useState('');
  return (
    <div className="stack">
      <p className="meta">{firstName(author)} sees your profile and can message you.</p>
      <textarea id="note" className="field field--area" rows={3} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (optional)" />
      <Button block size="l" onClick={() => sendInterest(id, note)}>
        Send interest
      </Button>
    </div>
  );
}

function ReviewInterest({ opportunityId }: { opportunityId?: string }) {
  const { interestsReceived, dismissInterest, startConversation, push, userCollabs } = useStore();
  const list = opportunityId ? interestsReceived.filter((i) => i.opportunityId === opportunityId) : interestsReceived;
  if (!list.length) return <EmptyState title="No one yet" />;
  return (
    <div className="list list--flush">
      {list.map((it) => {
        const p = person(it.personId);
        const o = findOpportunity(it.opportunityId, userCollabs)!;
        return (
          <div key={it.id} className="interest">
            <Pressable className="interest-who" onClick={() => push({ name: 'profile', id: p.id })} scale={0.98}>
              <Avatar party={p} size={48} />
              <span>
                <span className="item-title">{p.name}</span>
                <span className="meta">
                  {p.role} · {p.city}
                </span>
              </span>
            </Pressable>
            {it.note && <p className="body">{it.note}</p>}
            <div className="interest-actions">
              <Button
                size="s"
                onClick={() => {
                  const cid = startConversation(p.id, { kind: 'collab', label: 'Collaboration', detail: `${o.role} · ${o.project}`, refId: o.id });
                  dismissInterest(it.id);
                  push({ name: 'conversation', id: cid });
                }}
              >
                Message
              </Button>
              <Button size="s" variant="plain" onClick={() => dismissInterest(it.id)}>
                Not now
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Report */

function ReportCredit({ title }: { title: string }) {
  const { closeSheet, showToast } = useStore();
  const [reason, setReason] = useState('');
  const reasons = ['Wrong role', 'Wrong episodes or dates', "I didn't work on this", 'Name misspelled'];
  return (
    <div className="stack">
      <p className="meta">The production that issued {title} will review it.</p>
      <div className="group">
        {reasons.map((r) => (
          <Row key={r} label={r} onPress={() => setReason(r)} chevron={false} value={reason === r ? <Check size={18} className="accent" /> : undefined} />
        ))}
      </div>
      <Button
        block
        size="l"
        disabled={!reason}
        onClick={() => {
          closeSheet();
          showToast({ text: 'Sent for review' });
        }}
      >
        Send
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- Activity */

/** Private to the account owner: what they saved, what they sent, what they posted. */
function Activity() {
  const { saved, responses, interestsSent, userCollabs, viewer } = useStore();
  const pick = (ids: string[]) => ids.map((id) => findOpportunity(id, userCollabs)).filter(Boolean) as NonNullable<ReturnType<typeof findOpportunity>>[];
  const sections = [
    { title: 'Sent', items: pick([...Object.keys(responses), ...Object.keys(interestsSent)]), empty: 'Roles you respond to appear here.' },
    { title: 'Saved', items: pick(saved), empty: 'Saved roles appear here.' },
    { title: 'Your collaborations', items: [...userCollabs, ...seed.opportunities.filter((o) => o.authorId === viewer.id)], empty: 'Nothing posted yet.' },
  ];
  return (
    <div className="stack stack--loose">
      {sections.map((s) => (
        <section key={s.title}>
          <h3 className="section-title section-title--sheet">{s.title}</h3>
          {s.items.length ? (
            <div className="list list--flush">
              {s.items.map((o) => (
                <RoleRow key={o.id} o={o} />
              ))}
            </div>
          ) : (
            <p className="meta">{s.empty}</p>
          )}
        </section>
      ))}
    </div>
  );
}
