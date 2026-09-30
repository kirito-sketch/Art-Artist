import { Ban, Check, CircleCheck, Flag, Link2, PenLine, Send, UserSearch } from 'lucide-react';
import { useState } from 'react';
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
        {sheet?.name === 'reportCredit' && <ReportCredit title={sheet.title} creditId={sheet.creditId} />}
      </Sheet>
      <Sheet open={is('activity')} onClose={closeSheet} title="Your activity" size="tall">
        <Activity />
      </Sheet>
      <Sheet open={is('identity')} onClose={closeSheet} title="Acting as">
        <Identity />
      </Sheet>
      <Sheet open={is('share')} onClose={closeSheet} title="Share">
        {sheet?.name === 'share' && <ShareSheet label={sheet.label} />}
      </Sheet>
      <Sheet open={is('more')} onClose={closeSheet} title="">
        {sheet?.name === 'more' && <MoreSheet id={sheet.id} />}
      </Sheet>
      <Sheet open={is('report')} onClose={closeSheet} title="Report">
        {sheet?.name === 'report' && <ReportSheet subject={sheet.subject} partyId={sheet.partyId} />}
      </Sheet>
      <Sheet open={is('editRole')} onClose={closeSheet} title="Edit role" size="tall">
        {sheet?.name === 'editRole' && <EditRole id={sheet.id} />}
      </Sheet>
      <Sheet open={is('closeRole')} onClose={closeSheet} title="Close role">
        {sheet?.name === 'closeRole' && <CloseRole id={sheet.id} />}
      </Sheet>
      <Sheet open={is('block')} onClose={closeSheet} title="">
        {sheet?.name === 'block' && <BlockSheet id={sheet.id} />}
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------ Create */

function CreateMenu() {
  const { push, acting } = useStore();
  // Acting for a house: it posts updates and opens roles. It is never "available for work".
  if (acting !== 'self')
    return (
      <div className="group">
        <Row icon={<UserSearch size={22} />} label={`Open a role for ${org(acting).name}`} onPress={() => push({ name: 'composeCollab', intent: 'looking' })} />
        <Row icon={<PenLine size={22} />} label={`Post as ${org(acting).name}`} onPress={() => push({ name: 'composePost' })} />
      </div>
    );
  return (
    <div className="group">
      <Row icon={<PenLine size={22} />} label="Post" onPress={() => push({ name: 'composePost' })} />
      <Row icon={<UserSearch size={22} />} label="Looking for someone" onPress={() => push({ name: 'composeCollab', intent: 'looking' })} />
      <Row icon={<CircleCheck size={22} />} label="Available for work" onPress={() => push({ name: 'composeCollab', intent: 'available' })} />
    </div>
  );
}

/* ----------------------------------------------------------- Notifications */

/**
 * One notification surface. Every item belongs to the identity that has to act on it: you, or a house
 * you act for. The list opens filtered to whoever you're acting as; "All" shows everything with owner
 * labels. Opening an item never changes who you are acting as: the destination shows which identity
 * it belongs to and asks for an explicit switch before any action. (Hypothesis: validate.)
 */
function Notifications() {
  const { notifications, markNotificationsReadWhere, markNotificationRead, push, openSheet, acting, memberships } = useStore();
  const [filter, setFilter] = useState<string>(acting);
  if (!notifications.length) return <EmptyState title="No notifications yet" body="Replies, interest and credits will show up here." />;
  const owner = (n: (typeof notifications)[number]) => n.forId ?? 'self';
  const shown = filter === 'all' ? notifications : notifications.filter((n) => owner(n) === filter);
  const fresh = shown.filter((n) => n.unread);
  const earlier = shown.filter((n) => !n.unread);
  const identities = ['self', ...memberships.filter((m) => notifications.some((n) => n.forId === m))];
  const unreadFor = (id: string) => notifications.filter((n) => n.unread && (id === 'all' || owner(n) === id)).length;
  const row = (n: (typeof notifications)[number]) => (
    <Pressable
      key={n.id}
      className="notif"
      scale={0.99}
      onClick={() => {
        markNotificationRead(n.id);
        if (n.route) push(n.route);
        else if (n.kind === 'interest') openSheet({ name: 'reviewInterest' });
      }}
    >
      <Avatar party={party(n.actorId)!} size={40} />
      <span className="notif-text">
        {n.forId && filter === 'all' && <span className="notif-for">For {org(n.forId).name}</span>}
        {n.text}
        <span className="meta">{n.time}</span>
      </span>
      {n.unread && <span className="dot dot--inline" />}
    </Pressable>
  );
  return (
    <div className="stack">
      {identities.length > 1 && (
        <div className="chips chips--scroll">
          {[...identities, 'all'].map((id) => (
            <button key={id} className={`chip ${filter === id ? 'is-on' : ''}`} onClick={() => setFilter(id)}>
              {id === 'all' ? 'All' : id === 'self' ? 'You' : org(id).name}
              {unreadFor(id) > 0 && id !== filter ? ` · ${unreadFor(id)}` : ''}
            </button>
          ))}
        </div>
      )}
      <div className="notif-head">
        <p className="section-title--sheet">{fresh.length ? `${fresh.length} new` : 'No new notifications'}</p>
        {fresh.length > 0 && (
          <button className="link" onClick={() => markNotificationsReadWhere(fresh.map((n) => n.id))}>
            Mark all as read
          </button>
        )}
      </div>
      {fresh.length > 0 && <div className="list list--flush">{fresh.map(row)}</div>}
      {earlier.length > 0 && (
        <>
          <p className="meta">Earlier</p>
          <div className="list list--flush notif-earlier">{earlier.map(row)}</div>
        </>
      )}
      {!shown.length && <p className="meta">Nothing here yet.</p>}
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
  const { respond, userCollabs, viewer, attempt } = useStore();
  const [failed, setFailed] = useState(false);
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
        {failed && <p className="field-error">Couldn't send. Your answers are kept, try again.</p>}
        <Button
          block
          size="l"
          loading={sending}
          disabled={remaining > 0}
          onClick={() => {
            setSending(true);
            setFailed(false);
            attempt(
              `respond-${id}`,
              () => respond(id, ['Profile', ...(withReel ? ['Showreel'] : []), ...(withCredits ? ['Credits'] : [])]),
              () => {
                setSending(false);
                setFailed(true);
              },
              800,
            );
          }}
        >
          {remaining ? `${remaining} ${remaining === 1 ? 'answer' : 'answers'} to go` : failed ? 'Try again' : 'Send'}
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Interest */

function InterestForm({ id }: { id: string }) {
  const { sendInterest, userCollabs, attempt } = useStore();
  const o = findOpportunity(id, userCollabs)!;
  const author = o.authorId ? person(o.authorId) : org(o.orgId!);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'failed'>('idle');
  // Model A: a role may ask up to three short questions. Answers are optional; this is not an application.
  const qs = (o.questions ?? []).slice(0, 3);
  const [answers, setAnswers] = useState<string[]>(() => qs.map(() => ''));
  return (
    <div className="stack">
      <p className="meta">{firstName(author)} sees your profile and decides whether to message you.</p>
      {qs.map((q, i) => (
        <div key={q}>
          <label className="field-label">{q} <span className="meta">(optional)</span></label>
          <input className="field" value={answers[i]} maxLength={120} onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))} />
        </div>
      ))}
      <textarea id="note" className="field field--area" rows={3} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (optional)" />
      <p className="meta">You can withdraw it any time before they message you.</p>
      {state === 'failed' && <p className="field-error">Couldn't send your interest. Nothing was shared.</p>}
      <Button
        block
        size="l"
        loading={state === 'sending'}
        onClick={() => {
          setState('sending');
          attempt(`interest-${id}`, () => sendInterest(id, note), () => setState('failed'));
        }}
      >
        {state === 'failed' ? 'Try again' : 'Send interest'}
      </Button>
    </div>
  );
}

function ReviewInterest({ opportunityId }: { opportunityId?: string }) {
  const { interestsReceived, dismissInterest, startConversation, push, userCollabs, acting } = useStore();
  const all = opportunityId ? interestsReceived.filter((i) => i.opportunityId === opportunityId) : interestsReceived;
  // Withdrawn people stay at the end, greyed, so a person you'd looked at doesn't silently vanish.
  const list = [...all.filter((i) => !i.withdrawn), ...all.filter((i) => i.withdrawn)];
  if (!list.length) return <EmptyState title="No one yet" />;
  return (
    <div className="list list--flush">
      {list.map((it) => {
        const p = person(it.personId);
        const o = findOpportunity(it.opportunityId, userCollabs)!;
        return (
          <div key={it.id} className={`interest ${it.withdrawn ? 'interest--withdrawn' : ''}`}>
            <Pressable className="interest-who" onClick={() => push({ name: 'profile', id: p.id })} scale={0.98}>
              <Avatar party={p} size={48} />
              <span>
                <span className="item-title">{p.name}</span>
                <span className="meta">
                  {p.role} · {p.city}
                </span>
              </span>
            </Pressable>
            {it.withdrawn && <p className="meta">No longer interested</p>}
            {it.note && <p className="body">{it.note}</p>}
            {it.answers && (
              <ul className="interest-answers">
                {(o.questions ?? []).slice(0, it.answers.length).map((q, qi) => (
                  <li key={q}>
                    <span className="meta">{q}</span>
                    <span>{it.answers![qi]}</span>
                  </li>
                ))}
              </ul>
            )}
            {!it.withdrawn && <div className="interest-actions">
              <Button
                size="s"
                onClick={() => {
                  const cid = startConversation(p.id, { kind: 'collab', label: 'Collaboration', detail: `${o.role} · ${o.project}`, refId: o.id });
                  dismissInterest(it.id);
                  push({ name: 'conversation', id: cid });
                }}
              >
                {acting !== 'self' ? `Message as ${org(acting).name}` : 'Message'}
              </Button>
              <Button size="s" variant="plain" onClick={() => dismissInterest(it.id)}>
                Not now
              </Button>
            </div>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Report */

function ReportCredit({ title, creditId }: { title: string; creditId?: string }) {
  const { closeSheet, showToast, requestCorrection, attempt } = useStore();
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'failed'>('idle');
  const reasons = ['Wrong role', 'Wrong episodes or dates', "I didn't work on this", 'Name misspelled'];
  return (
    <div className="stack">
      <p className="meta">The production that issued {title} will review it.</p>
      <div className="group">
        {reasons.map((r) => (
          <Row key={r} label={r} onPress={() => setReason(r)} chevron={false} value={reason === r ? <Check size={18} className="accent" /> : undefined} />
        ))}
      </div>
      {state === 'failed' && <p className="field-error">Couldn't send. Try again.</p>}
      <Button
        block
        size="l"
        disabled={!reason}
        loading={state === 'sending'}
        onClick={() => {
          setState('sending');
          attempt(
            `correct-${title}`,
            () => {
              if (creditId) requestCorrection(creditId);
              closeSheet();
              showToast({ text: 'Sent to the production. Nothing is public until you accept.' });
            },
            () => setState('failed'),
          );
        }}
      >
        {state === 'failed' ? 'Try again' : 'Send'}
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

/* ---------------------------------------------------------------- Identity */

/** Who am I acting as. One person, the organisations they may act for, one tap to switch. */
function Identity() {
  const { viewer, acting, setActing, memberships, tab } = useStore();
  const me = person(viewer.id);
  const rows = [{ id: 'self', party: me, sub: 'Your personal profile' }, ...memberships.map((m) => ({ id: m, party: org(m), sub: 'You can open roles and issue credits' }))];
  return (
    <div className="stack">
      <div className="list list--flush">
        {rows.map((r) => (
          <Pressable key={r.id} className="prow identity-row" onClick={() => setActing(r.id, tab === 'profile')} scale={0.985}>
            <Avatar party={r.party} size={44} />
            <span className="prow-text">
              <span className="item-title">{r.party.name}</span>
              <span className="meta">{r.sub}</span>
            </span>
            {acting === r.id && <Check size={20} className="accent" />}
          </Pressable>
        ))}
      </div>
      <p className="meta">The house's owner decides who can act for it. Your own profile and credits always stay yours.</p>
    </div>
  );
}

/* ------------------------------------------------------------------- Share */

function ShareSheet({ label }: { label: string }) {
  const { closeSheet, showToast, conversations } = useStore();
  const recent = conversations.slice(0, 3);
  return (
    <div className="stack">
      <p className="meta">{label}</p>
      {recent.length > 0 && (
        <div className="share-people">
          {recent.map((c) => {
            const p = party(c.withId);
            if (!p) return null;
            return (
              <Pressable
                key={c.id}
                className="org-person"
                onClick={() => {
                  closeSheet();
                  showToast({ text: `Sent to ${firstName(p)}`, tone: 'success' });
                }}
                scale={0.95}
              >
                <Avatar party={p} size={52} />
                <span className="org-person-name">{firstName(p)}</span>
              </Pressable>
            );
          })}
        </div>
      )}
      <div className="group">
        <Row
          icon={<Link2 size={22} />}
          label="Copy link"
          chevron={false}
          onPress={() => {
            closeSheet();
            showToast({ text: 'Link copied' });
          }}
        />
        <Row
          icon={<Send size={22} />}
          label="Share outside Ana"
          chevron={false}
          onPress={() => {
            closeSheet();
            showToast({ text: 'Opens the phone share sheet' });
          }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- More / Report / Block */

function MoreSheet({ id }: { id: string }) {
  const { openSheet, blocked, unblock, closeSheet, showToast } = useStore();
  const p = party(id)!;
  const isBlocked = blocked.includes(id);
  return (
    <div className="group">
      <Row icon={<Flag size={22} />} label={`Report ${p.name}`} onPress={() => openSheet({ name: 'report', subject: p.name, partyId: id })} />
      {isBlocked ? (
        <Row
          icon={<Ban size={22} />}
          label={`Unblock ${p.name}`}
          chevron={false}
          onPress={() => {
            unblock(id);
            closeSheet();
            showToast({ text: `${p.name} unblocked` });
          }}
        />
      ) : (
        <Row icon={<Ban size={22} />} label={<span className="danger-text">Block {p.name}</span>} onPress={() => openSheet({ name: 'block', id })} />
      )}
    </div>
  );
}

const REPORT_REASONS = ['Fake profile or impersonation', 'Asking for money to apply or audition', 'Harassment or unsafe behaviour', 'Misleading role or project', 'Stolen or misused work', 'Something else'];

/** Report: reason, optional detail, a clear promise, and the offer to block. */
function ReportSheet({ subject, partyId }: { subject: string; partyId?: string }) {
  const { openSheet, closeSheet } = useStore();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [step, setStep] = useState<'form' | 'sending' | 'done'>('form');
  if (step === 'done')
    return (
      <div className="stack">
        <p className="title-2">Thanks. We'll look at it.</p>
        <p className="body">Ana reviews reports within 24 hours. {subject} won't be told who reported. If we act, you'll get a notification.</p>
        {partyId && (
          <Button block size="l" variant="danger" onClick={() => openSheet({ name: 'block', id: partyId })}>
            Also block
          </Button>
        )}
        <Button block size="l" variant="secondary" onClick={closeSheet}>
          Done
        </Button>
      </div>
    );
  return (
    <div className="stack">
      <p className="meta">What's wrong with {subject}?</p>
      <div className="group">
        {REPORT_REASONS.map((r) => (
          <Row key={r} label={r} onPress={() => setReason(r)} chevron={false} value={reason === r ? <Check size={18} className="accent" /> : undefined} />
        ))}
      </div>
      {reason && <textarea className="field field--area" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Anything that helps us check (optional)" />}
      <Button
        block
        size="l"
        disabled={!reason}
        loading={step === 'sending'}
        onClick={() => {
          setStep('sending');
          window.setTimeout(() => setStep('done'), 700);
        }}
      >
        Send report
      </Button>
    </div>
  );
}

/** Block: say exactly what changes before it happens. */
function BlockSheet({ id }: { id: string }) {
  const { block, closeSheet, showToast } = useStore();
  const p = party(id)!;
  return (
    <div className="stack">
      <p className="title-2">Block {p.name}?</p>
      <ul className="block-list">
        <li>You won't see each other's profile, work or roles.</li>
        <li>They can't message you or show interest in your roles.</li>
        <li>Shared credits stay on both profiles. Credits are a record, not a connection.</li>
        <li>They aren't told. You can unblock from their page.</li>
      </ul>
      <Button
        block
        size="l"
        variant="danger"
        onClick={() => {
          block(id);
          closeSheet();
          showToast({ text: `${p.name} blocked` });
        }}
      >
        Block
      </Button>
      <Button block size="l" variant="secondary" onClick={closeSheet}>
        Cancel
      </Button>
    </div>
  );
}

/* --------------------------------------------------------- Edit / close role */

/**
 * After publishing, the poster can fix details but not change what the role is. Title, craft and
 * project are fixed: people showed interest in that. Material changes are listed to everyone who
 * already showed interest, so nobody is surprised.
 */
function EditRole({ id }: { id: string }) {
  const { userCollabs, roleEdits, editRole, closeSheet, showToast, interestsReceived, attempt } = useStore();
  const base = findOpportunity(id, userCollabs)!;
  const o = { ...base, ...roleEdits[id] };
  const [about, setAbout] = useState(o.about);
  const [city, setCity] = useState(o.city);
  const [dates, setDates] = useState(o.dates);
  const [state, setState] = useState<'idle' | 'saving' | 'failed'>('idle');
  const material = [city !== o.city && 'location', dates !== o.dates && 'dates'].filter(Boolean) as string[];
  const dirty = material.length > 0 || about !== o.about;
  const told = interestsReceived.filter((i) => i.opportunityId === id).length;
  return (
    <div className="stack">
      <div className="group">
        <Row label="Role" value={o.role} chevron={false} />
        <Row label="Project" value={o.project} chevron={false} />
      </div>
      <p className="meta">Role and project can't change once people have seen it. Close this role and open a new one instead.</p>
      <div>
        <label className="field-label" htmlFor="er-city">Location</label>
        <input id="er-city" className="field" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div>
        <label className="field-label" htmlFor="er-dates">Dates</label>
        <input id="er-dates" className="field" value={dates} onChange={(e) => setDates(e.target.value)} />
      </div>
      <div>
        <label className="field-label" htmlFor="er-about">About the role</label>
        <textarea id="er-about" className="field field--area" rows={5} value={about} onChange={(e) => setAbout(e.target.value)} />
      </div>
      {material.length > 0 && told > 0 && (
        <p className="inline-note">
          {told} {told === 1 ? 'person' : 'people'} who showed interest will see that the {material.join(' and ')} changed.
        </p>
      )}
      {state === 'failed' && <p className="field-error">Couldn't save. Your edits are kept.</p>}
      <Button
        block
        size="l"
        disabled={!dirty}
        loading={state === 'saving'}
        onClick={() => {
          setState('saving');
          attempt(
            `edit-${id}`,
            () => {
              editRole(id, { about, city, dates }, material);
              closeSheet();
              showToast({ text: 'Role updated', tone: 'success' });
            },
            () => setState('failed'),
          );
        }}
      >
        {state === 'failed' ? 'Try again' : 'Save changes'}
      </Button>
    </div>
  );
}

const CLOSE_REASONS: { state: 'filled' | 'closed'; label: string; tells: string }[] = [
  { state: 'filled', label: 'Filled through Ana', tells: 'Filled' },
  { state: 'filled', label: 'Filled another way', tells: 'Filled' },
  { state: 'closed', label: 'No longer needed', tells: 'No longer needed' },
  { state: 'closed', label: 'Project paused', tells: 'Project paused' },
];

/** Closing keeps the role and its history. Everyone who showed interest learns the outcome instead of silence. */
function CloseRole({ id }: { id: string }) {
  const { closeRole, closeSheet, showToast, interestsReceived } = useStore();
  const [pick, setPick] = useState<number | null>(null);
  const waiting = interestsReceived.filter((i) => i.opportunityId === id).length;
  return (
    <div className="stack">
      <div className="group">
        {CLOSE_REASONS.map((r, i) => (
          <Row key={r.label} label={r.label} onPress={() => setPick(i)} chevron={false} value={pick === i ? <Check size={18} className="accent" /> : undefined} />
        ))}
      </div>
      <p className="meta">{waiting ? `${waiting} ${waiting === 1 ? 'person' : 'people'} who showed interest will be told the role is ${pick !== null ? CLOSE_REASONS[pick].tells.toLowerCase() : 'closed'}. ` : ''}The role stops appearing on Ana. You can reopen it.</p>
      <Button
        block
        size="l"
        disabled={pick === null}
        onClick={() => {
          const r = CLOSE_REASONS[pick!];
          closeRole(id, r.state, r.label);
          closeSheet();
          showToast({ text: r.state === 'filled' ? 'Role marked as filled' : 'Role closed' });
        }}
      >
        Close role
      </Button>
    </div>
  );
}
