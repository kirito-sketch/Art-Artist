import { Ban, Bookmark, CalendarDays, Check, CircleCheck, Flag, Link2, PenLine, Plus, Send, UserSearch } from 'lucide-react';
import { useFeatures } from '../../ui/features';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { currentScreen, focusInto, restoreFocus, trapTab } from '../../ui/a11y';
import { dur, shared, spring } from '../../ui/motion';
import * as seed from '../../data/seed';
import { useStore, type Sheet as SheetRoute } from '../../state/store';
import { useTheme } from '../../ui/theme';

/** Create surface colours (framer-motion interpolates hex, not tokens): the action green and the raised surface. */
const CREATE_COLOURS = { light: { from: '#f0b24a', to: '#f8f8f9' }, dark: { from: '#f0b24a', to: '#11212d' } } as const;
import { findOpportunity, firstName, networkFor, org, party, person } from '../../state/selectors';
import { NetworkRow } from '../home/NetworkActivity';
import { Avatar, Button, EmptyState, HowItWorks, PressCard, Pressable, Row, Toggle } from '../../ui/primitives';
import { useLearned } from '../../ui/learned';
import { Sheet } from '../../ui/Sheet';
import { RoleRow } from '../discover/RoleRow';
import { AddPerson, NewProjectForm, PickProject } from '../production/Create';
import { world, project as wproject, work } from '../../state/world';
import { ReviewSheet } from '../reviews/reviewUnits';
import { INTENTS } from '../../domain/relevance';
import { reportLevel, sentReports } from '../../state/reports';
import type { IndustryEvent } from '../../data/types';
import { stubLabel, whenLabel } from '../../domain/events';
import { DateField, fmtDay, fmtRange, parseDays, todayIso } from '../../ui/fields';

export function SheetHost() {
  const { sheet, closeSheet, acting } = useStore();
  const district = useFeatures().home === 'district';
  const districtHouse = district && acting !== 'self';
  const creditFlow = district && sheet?.name === 'reportCredit' && !!wproject(world.credits.find((c) => c.id === sheet.creditId)?.projectId ?? '')?.houseId;
  const is = (n: SheetRoute['name']) => sheet?.name === n;
  return (
    <>
      <CreateSurface open={is('create')} onClose={closeSheet} />
      <Sheet className={districtHouse ? 'dhouse-sheet' : undefined} open={is('notifications')} onClose={closeSheet} title="Notifications" size="tall">
        <Notifications />
      </Sheet>
      <Sheet open={is('availability')} onClose={closeSheet} title="Availability">
        <AvailabilityForm fromCreate={sheet?.name === 'availability' && sheet.from === 'create'} />
      </Sheet>
      <Sheet open={is('intent')} onClose={closeSheet} title="What are you looking to do right now?">
        <IntentForm />
      </Sheet>
      <Sheet open={is('showInterest')} onClose={closeSheet} title="Show interest">
        {sheet?.name === 'showInterest' && <InterestForm id={sheet.id} />}
      </Sheet>
      <Sheet className={districtHouse ? 'dhouse-sheet' : undefined} open={is('reviewInterest')} onClose={closeSheet} title="Interested" size="tall">
        <ReviewInterest opportunityId={sheet?.name === 'reviewInterest' ? sheet.opportunityId : undefined} />
      </Sheet>
      <Sheet className={creditFlow ? 'dhouse-sheet' : undefined} open={is('reportCredit')} onClose={closeSheet} title="Report credit">
        {sheet?.name === 'reportCredit' && <ReportCredit title={sheet.title} creditId={sheet.creditId} />}
      </Sheet>
      <Sheet open={is('activity')} onClose={closeSheet} title="Your activity" size="tall">
        <Activity />
      </Sheet>
      <Sheet className={districtHouse ? 'dhouse-sheet' : undefined} open={is('identity')} onClose={closeSheet} title="Acting as">
        <Identity />
      </Sheet>
      <Sheet open={is('share')} onClose={closeSheet} title="Share">
        {sheet?.name === 'share' && <ShareSheet label={sheet.label} url={sheet.url} />}
      </Sheet>
      <Sheet open={is('more')} onClose={closeSheet} title="" label="More options">
        {sheet?.name === 'more' && <MoreSheet id={sheet.id} />}
      </Sheet>
      <Sheet open={is('review')} onClose={closeSheet} title="Your review">
        {sheet?.name === 'review' && <ReviewSheet projectId={sheet.projectId} title={work(sheet.projectId)?.title ?? ''} />}
      </Sheet>
      <Sheet open={is('report')} onClose={closeSheet} title="Report">
        {sheet?.name === 'report' && <ReportSheet subject={sheet.subject} partyId={sheet.partyId} target={sheet.target} />}
      </Sheet>
      <Sheet open={is('postMore')} onClose={closeSheet} title="" label="Post options">
        {sheet?.name === 'postMore' && <PostMenu id={sheet.id} />}
      </Sheet>
      <Sheet className={districtHouse ? 'dhouse-sheet' : undefined} open={is('newProject')} onClose={closeSheet} title="New project" size="tall">
        <NewProjectForm />
      </Sheet>
      <Sheet className={districtHouse ? 'dhouse-sheet' : undefined} open={is('pickProject')} onClose={closeSheet} title="Open a role">
        <PickProject />
      </Sheet>
      <Sheet className={districtHouse ? 'dhouse-sheet' : undefined} open={is('editRole')} onClose={closeSheet} title="Edit role" size="tall">
        {sheet?.name === 'editRole' && <EditRole id={sheet.id} />}
      </Sheet>
      <Sheet className={districtHouse ? 'dhouse-sheet' : undefined} open={is('closeRole')} onClose={closeSheet} title="Close role">
        {sheet?.name === 'closeRole' && <CloseRole id={sheet.id} />}
      </Sheet>
      <Sheet open={is('block')} onClose={closeSheet} title="" label="Block">
        {sheet?.name === 'block' && <BlockSheet id={sheet.id} />}
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------ Create */

/*
 * Create (signature functional interaction). The red + disc grows into this surface (shared
 * layout), the actions arrive with a slight stagger, and closing returns the surface into the +.
 * It sits under the tab bar so the same control that opened it closes it.
 */
function CreateSurface({ open, onClose }: { open: boolean; onClose: () => void }) {
  // The + disc grows into the surface: brand green to the surface colour of the current appearance.
  const theme = useTheme();
  const layer = useRef<HTMLDivElement>(null);
  // A dialog that grows out of the + button: focus moves to its first action, Tab cycles between its
  // actions and the + (now the close control), and focus returns to the + when it closes.
  useEffect(() => {
    if (!open) return;
    const opener = document.querySelector<HTMLElement>('.phone .tab-create');
    const f = requestAnimationFrame(() => requestAnimationFrame(() => focusInto(layer.current)));
    return () => {
      cancelAnimationFrame(f);
      restoreFocus(opener, currentScreen);
    };
  }, [open]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    const plus = document.querySelector<HTMLElement>('.phone .tab-create');
    if (layer.current) trapTab(e, layer.current, plus ? [plus] : []);
  };
  return (
    <AnimatePresence>
      {open && (
        <div className="create-layer" role="dialog" aria-modal="true" aria-labelledby="create-title" ref={layer} onKeyDown={onKeyDown}>
          <motion.div className="create-backdrop" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.ui }} onClick={onClose} />
          <motion.div
            layoutId={shared.create}
            className="create-surface"
            style={{ borderRadius: 26 }}
            initial={{ backgroundColor: CREATE_COLOURS[theme].from }}
            animate={{ backgroundColor: CREATE_COLOURS[theme].to }}
            exit={{ backgroundColor: CREATE_COLOURS[theme].from }}
            transition={spring.sheet}
          >
            <motion.div className="create-content" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1, duration: dur.micro } }} exit={{ opacity: 0, transition: { duration: 0.08 } }}>
              <h2 className="create-title" id="create-title" data-autofocus tabIndex={-1}>
                Create
              </h2>
              <CreateMenu />
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CreateMenu() {
  const { push, acting, openSheet } = useStore();
  const events = useFeatures().events;
  const eventRow = events && <Row icon={<CalendarDays size={22} />} label={acting !== 'self' ? `Event by ${org(acting).name}` : 'Event'} onPress={() => push({ name: 'composeEvent' })} />;
  // Acting for a house: it posts updates and opens roles. It is never "available for work".
  if (acting !== 'self')
    return (
      <div className="group create-rows">
        <Row icon={<PenLine size={22} />} label={`Post as ${org(acting).name}`} onPress={() => push({ name: 'composePost' })} />
        <Row icon={<UserSearch size={22} />} label={`Open a role for ${org(acting).name}`} onPress={() => openSheet({ name: 'pickProject' })} />
        <Row icon={<Plus size={22} />} label="New project" onPress={() => openSheet({ name: 'newProject' })} />
        {eventRow}
      </div>
    );
  return (
    <div className="group create-rows">
      <Row icon={<PenLine size={22} />} label="Post" onPress={() => push({ name: 'composePost' })} />
      <Row icon={<UserSearch size={22} />} label="Looking for someone" onPress={() => push({ name: 'composeCollab', intent: 'looking' })} />
      <Row icon={<CircleCheck size={22} />} label="Open to work" onPress={() => openSheet({ name: 'availability', from: 'create' })} />
      {eventRow}
      <Row icon={<Plus size={22} />} label="Start an independent project" onPress={() => openSheet({ name: 'newProject' })} />
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
/**
 * How a notification reads in the list, without changing what was stored: who (semibold), what, and the
 * detail after the first colon on its own line (the colon stays, so it still reads as one sentence). Instructions the row already implies ("Accept it to make
 * it official.") are dropped (docs/NOTIFICATIONS_SETTINGS_AUDIT.md N3).
 */
function notifCopy(n: { text: string; actorId: string }) {
  const text = n.text.replace(/\s*(Accept it to make it official|Thanks for your interest)\.?$/, '');
  const name = party(n.actorId)?.name;
  const who = name && text.startsWith(name) ? name : undefined;
  const rest = who ? text.slice(who.length) : text;
  const cut = who || text.startsWith('Your ') ? rest.indexOf(': ') : -1;
  return { who, what: cut > 0 ? rest.slice(0, cut) : rest, context: cut > 0 ? rest.slice(cut + 2) : undefined };
}

/** Today, Tomorrow, or Soon, by the calendar day in India. */
function dayWord(at: number, now: number) {
  const day = (ms: number) => Math.floor((ms + 5.5 * 36e5) / 864e5);
  const d = day(at) - day(now);
  return d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : 'Soon';
}

/** One upcoming reminder for a confirmed place; changes and cancellations are real notices. */
function comingUp(events: IndustryEvent[], now: number) {
  return events.filter(e => ['scheduled', 'closed'].includes(e.status) && e.start >= now && e.start - now <= 48 * 36e5)
    .sort((a, b) => a.start - b.start)
    .map(e => ({ e, line: `${dayWord(e.start, now)}: ${whenLabel(e.start)}.` }));
}

/** A new item that asks for a decision: a credit to accept, a correction to answer, interest to review (N4). */
const asksForDecision = (n: { kind: string; text: string; unread: boolean }) =>
  n.unread && ((n.kind === 'interest' && !/ (filled|closed) /.test(n.text)) || (n.kind === 'credit' && /Accept it|proposed a revised|asked to correct|asked to amend|isn't right/.test(n.text)));

/**
 * Notifications: what happened around your work. New, then earlier, then news from your network, which is
 * lighter so it never outweighs what happened to you. Things that need you also sit on Home (Waiting on
 * you); conversations live in Inbox.
 */
function Notifications() {
  const { notifications, markNotificationsReadWhere, markNotificationRead, push, openSheet, acting, memberships, viewer, scenario, events, eventRequest } = useStore();
  const [filter, setFilter] = useState<string>(acting);
  const features = useFeatures();
  const homeNext = features.home === 'next';
  // Only confirmed places receive upcoming reminders. A bookmark does not imply attendance.
  const reminders = features.events && (filter === 'self' || filter === 'all') ? comingUp(events.filter(e => eventRequest(e.id)?.status === 'confirmed'), Date.now()) : [];
  // News from your network (credits, new projects, availability) lives here, not on Home, which only
  // shows what needs you (docs/UX_HEURISTIC_AUDIT.md F2, F13). It belongs to the person, not a house.
  const network = filter === 'self' || filter === 'all' ? networkFor(viewer, scenario).filter((e) => e.kind !== 'portfolio' && e.kind !== 'reel') : [];
  const caughtUp = <EmptyState title="You're all caught up" body="New activity around your work and network will appear here." />;
  if (!notifications.length && !network.length && !reminders.length) return caughtUp;
  const owner = (n: (typeof notifications)[number]) => n.forId ?? 'self';
  const shown = filter === 'all' ? notifications : notifications.filter((n) => owner(n) === filter);
  // New Home (docs/HOME.md): Home no longer carries a "Waiting on you" queue, so anything that asks for a
  // decision is grouped first here, under "Needs you".
  const needs = homeNext ? shown.filter((n) => asksForDecision(n)) : [];
  const fresh = shown.filter((n) => n.unread && !needs.includes(n));
  const earlier = shown.filter((n) => !n.unread && !needs.includes(n));
  const identities = ['self', ...memberships.filter((m) => notifications.some((n) => n.forId === m))];
  const unreadFor = (id: string) => notifications.filter((n) => n.unread && (id === 'all' || owner(n) === id)).length;
  const label = (id: string) => (id === 'all' ? 'All' : id === 'self' ? 'You' : org(id).name);
  // Nothing here for this identity, but another one has news: say so once, with a way there.
  const elsewhere = identities.find((id) => id !== filter && unreadFor(id) > 0);
  const row = (n: (typeof notifications)[number]) => {
    const c = notifCopy(n);
    return (
      <Pressable
        key={n.id}
        className={`notif ${n.unread ? 'is-unread' : ''}`}
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
          <span className="notif-line">
            {c.who && <span className="notif-who">{c.who}</span>}
            <span>{c.context ? `${c.what}:` : c.what}</span>
          </span>
          {c.context && <span className="notif-context">{c.context}</span>}
          <span className="meta">
            {n.time}
            {asksForDecision(n) && (
              <>
                {' · '}
                <span className="notif-todo">To review</span>
              </>
            )}
          </span>
        </span>
        {n.unread && (
          <>
            <span className="dot dot--inline" aria-hidden />
            <span className="sr-only">New</span>
          </>
        )}
      </Pressable>
    );
  };
  return (
    <div className="stack notif-list">
      {identities.length > 1 && (
        <div className="chips chips--scroll">
          {[...identities, 'all'].map((id) => (
            <button key={id} className={`chip ${filter === id ? 'is-on' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label(id)}
              {unreadFor(id) > 0 && id !== filter ? ` · ${unreadFor(id)}` : ''}
            </button>
          ))}
        </div>
      )}
      {needs.length > 0 && (
        <section className="notif-group">
          <h3 className="notif-label">Needs you</h3>
          <div className="list list--flush">{needs.map(row)}</div>
        </section>
      )}
      {reminders.length > 0 && (
        <section className="notif-group">
          <h3 className="notif-label">Coming up</h3>
          <div className="list list--flush">
            {reminders.map(({ e, line }) => (
              <Pressable key={e.id} className="notif notif--event" scale={0.99} onClick={() => push({ name: 'event', id: e.id })}>
                <span className="ev-stub ev-stub--small" aria-hidden>
                  <span className="ev-stub-month">{stubLabel(e.start).month}</span>
                  <span className="ev-stub-day">{stubLabel(e.start).day}</span>
                </span>
                <span className="notif-text">
                  <span className="notif-line">
                    <span className="notif-who">{e.title}</span>
                  </span>
                  <span className="notif-context">{line}</span>
                  <span className="meta">{e.venue}, {e.city}</span>
                </span>
              </Pressable>
            ))}
          </div>
        </section>
      )}
      {fresh.length > 0 && (
        <section className="notif-group">
          <div className="notif-head">
            <h3 className="notif-label">New</h3>
            <button className="link link--small" onClick={() => markNotificationsReadWhere(fresh.map((n) => n.id))}>
              Mark all as read
            </button>
          </div>
          <div className="list list--flush">{fresh.map(row)}</div>
        </section>
      )}
      {earlier.length > 0 && (
        <section className="notif-group">
          <h3 className="notif-label">Earlier</h3>
          <div className="list list--flush notif-earlier">{earlier.map(row)}</div>
        </section>
      )}
      {!shown.length && (
        <EmptyState
          title="You're all caught up"
          body={network.length ? undefined : 'New activity around your work and network will appear here.'}
          action={
            elsewhere ? (
              <button className="link link--small notif-elsewhere" onClick={() => setFilter(elsewhere)}>
                {label(elsewhere)} has {unreadFor(elsewhere)} new
              </button>
            ) : undefined
          }
        />
      )}
      {network.length > 0 && (
        <section className="notif-group">
          <div className="notif-head">
            <h3 className="notif-label">From your network</h3>
            {network.length > 5 && (
              <button className="link link--small" onClick={() => push({ name: 'network' })}>
                See all
              </button>
            )}
          </div>
          <div className="list list--flush">
            {network.slice(0, 5).map((e, i) => (
              <NetworkRow key={e.id} e={e} index={i} quiet />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Availability */


/**
 * V30: what the person is trying to do right now. It reorders Home and re-ranks it; nothing is
 * hidden for good, and everything stays in Discover. Changing it is instant and reversible.
 */
function IntentForm() {
  const { intent, setIntent, closeSheet, showToast } = useStore();
  return (
    <div className="stack">
      <p className="meta">Home puts what matters for this first. Everything else is still in Discover.</p>
      <div className="intent-list" role="radiogroup" aria-label="What are you looking to do right now?">
        {INTENTS.map((it) => (
          <button
            key={it.id}
            role="radio"
            aria-checked={intent === it.id}
            className={`intent-option ${intent === it.id ? 'is-on' : ''}`}
            onClick={() => {
              setIntent(it.id);
              closeSheet();
              if (it.id !== intent) showToast({ text: `Home updated for: ${it.label}` });
            }}
          >
            <span className="intent-option-label">{it.label}</span>
            <span className="meta">{it.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Availability has one source (docs/ux-refinement/PLAN.md, Stage 6, C2): this sheet, opened from your profile, Edit
 * profile, the profile checklist or Create › Open to work. From Create, saving offers to tell people in a post.
 */
function AvailabilityForm({ fromCreate = false }: { fromCreate?: boolean }) {
  const { availability, setAvailability, closeSheet, scenario, setScenario, showToast, push } = useStore();
  const [open, setOpen] = useState(availability.open || scenario.newUser);
  const [later, setLater] = useState(availability.from !== 'Now');
  const [fromDay, setFromDay] = useState(() => parseDays(availability.from).start);
  const [scope, setScope] = useState(availability.scope);
  const from = later && fromDay ? fmtDay(fromDay) : 'Now';
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
            <button className={`chip ${!later ? 'is-on' : ''}`} aria-pressed={!later} onClick={() => setLater(false)}>
              From now
            </button>
            <button className={`chip ${later ? 'is-on' : ''}`} aria-pressed={later} onClick={() => setLater(true)}>
              From a date
            </button>
          </div>
          {later && <DateField className="field" value={fromDay} onChange={setFromDay} label="Open to work from" placeholder="Choose a start date" />}
          <label className="field-label" htmlFor="avail-scope">
            Where
          </label>
          <input id="avail-scope" className="field" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="City, and whether you travel" />
        </>
      )}
      <Button
        block
        size="l"
        onClick={() => {
          setAvailability({ open, from, scope });
          if (scenario.newUser) setScenario({ newUser: false });
          closeSheet();
          if (fromCreate && open) showToast({ text: "You're open to work", tone: 'success', action: { label: 'Share as a post', run: () => push({ name: 'composePost' }) } });
        }}
      >
        Save
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- Interest */

function InterestForm({ id }: { id: string }) {
  const { sendInterest, userCollabs, attempt, interestsSent, viewer } = useStore();
  const o = findOpportunity(id, userCollabs)!;
  const author = o.authorId ? person(o.authorId) : org(o.orgId!);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'failed'>('idle');
  // Model A: a role may ask up to three short questions. Answers are optional; this is not an application.
  const qs = (o.questions ?? []).slice(0, 3);
  const [answers, setAnswers] = useState<string[]>(() => qs.map(() => ''));
  // Learned once per account (kept across relaunches), or by having shown interest before in this session.
  const [learnedModel, markModelLearned] = useLearned(viewer.id, 'interest');
  const seenModel = learnedModel || Object.keys(interestsSent).some((k) => k !== id);
  const steps = (
    <ol className="next-steps" aria-label="What happens next">
      <li>
        <b>{firstName(author)} sees your profile</b>, your verified credits and your work.
      </li>
      <li>
        <b>If it's a fit, they message you.</b> You can't message them from here.
      </li>
      <li>
        <b>You can withdraw</b> any time before they message you.
      </li>
    </ol>
  );
  return (
    <div className="stack">
      {/* V30: the model in plain steps. Interest shares your profile; it does not open a chat. In full the
          first time; once someone has shown interest before, one line with the steps on request (F4). */}
      {seenModel ? (
        <div className="next-steps next-steps--short">
          <p>
            <b>{firstName(author)} sees your profile</b> and decides whether to message you.
          </p>
          <HowItWorks label="How interest works">{steps}</HowItWorks>
        </div>
      ) : (
        steps
      )}
      {/* Said once: everything below is optional (not once per field). */}
      <p className="meta">{qs.length > 0 ? 'Everything below is optional. Paste a link if you have one.' : 'Optional.'}</p>
      {qs.map((q, i) => (
        <div key={q}>
          <label className="field-label" htmlFor={`iq${i}`}>
            {q}
          </label>
          <input id={`iq${i}`} className="field" value={answers[i]} maxLength={120} onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))} />
        </div>
      ))}
      <label className="field-label" htmlFor="note">
        Note
      </label>
      <textarea id="note" className="field field--area" rows={3} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} placeholder="A line about why you're a fit" />
      {state === 'failed' && (
        <p className="field-error" role="alert">
          Couldn't send your interest. Nothing was shared. Try again.
        </p>
      )}
      <Button
        block
        size="l"
        variant="signature"
        loading={state === 'sending'}
        onClick={() => {
          setState('sending');
          attempt(
            `interest-${id}`,
            () => {
              sendInterest(id, note);
              markModelLearned();
            },
            () => setState('failed'),
          );
        }}
      >
        {state === 'sending' ? 'Sending…' : state === 'failed' ? 'Try again' : 'Send interest'}
      </Button>
    </div>
  );
}

/**
 * One Interest record per person and role, seen by the house. Reviewing never deletes it: messaged
 * people move to "In conversation", "Not now" sets someone aside (they aren't told), and a withdrawal
 * stays as "No longer interested", so nobody the house looked at silently vanishes.
 */
function ReviewInterest({ opportunityId }: { opportunityId?: string }) {
  const { interestsReceived, reviewInterest, startConversation, push, userCollabs, acting, blocked, conversations, cannotReach } = useStore();
  const all = (opportunityId ? interestsReceived.filter((i) => i.opportunityId === opportunityId) : interestsReceived).filter((i) => !blocked.includes(i.personId));

  const groups: { title?: string; items: typeof all }[] = [
    { title: 'New', items: all.filter((i) => !i.withdrawn && !i.review) },
    { title: 'In conversation', items: all.filter((i) => !i.withdrawn && i.review === 'messaged') },
    { title: 'Not now', items: all.filter((i) => !i.withdrawn && i.review === 'notNow') },
    { title: 'No longer interested', items: all.filter((i) => i.withdrawn) },
  ];
  const as = acting !== 'self' ? org(acting).name : null;
  const districtHouse = useFeatures().home === 'district' && !!as;
  if (!all.length) return <EmptyState title="No one yet" />;
  return (
    <div className="stack">
      {groups.map((g, gi) =>
        g.items.length ? (
          <section key={gi} className="stack">
            {g.title && (g.title !== 'New' || districtHouse) ? <p className="meta">{g.title}</p> : null}
            <div className="list list--flush">
              {g.items.map((it) => {
                const p = person(it.personId);
                const o = findOpportunity(it.opportunityId, userCollabs)!;
                const talk = conversations.find((c) => c.withId === p.id && c.context.refId === o.id);
                return (
                  <div key={it.id} className={`interest ${it.withdrawn || it.review === 'notNow' ? 'interest--withdrawn' : ''}`}>
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
                    {!opportunityId && <p className="meta">{o.role} · {o.project}</p>}
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
                    {!it.withdrawn && (
                      <div className="interest-actions">
                        {cannotReach(p.id) && !talk ? (
                          // A person who blocked this member can't be contacted by them, even as the house. Another member can.
                          <p className="meta">You can't message {p.name.split(' ')[0]}</p>
                        ) : it.review === 'messaged' && talk ? (
                          <Button size="s" variant="secondary" onClick={() => push({ name: 'conversation', id: talk.id })}>
                            Open chat
                          </Button>
                        ) : (
                          <Button
                            size="s"
                            onClick={() => {
                              const cid = startConversation(p.id, { kind: o.kind === 'casting' ? 'casting' : o.kind === 'collab' ? 'collab' : 'crew', label: o.kind === 'casting' ? 'Casting' : o.kind === 'collab' ? 'Collaboration' : 'Crew job', detail: `${o.role} · ${o.project}`, refId: o.id });
                              reviewInterest(it.id, 'messaged');
                              cid && push({ name: 'conversation', id: cid });
                            }}
                          >
                            {as ? `Message as ${as}` : 'Message'}
                          </Button>
                        )}
                        {!it.review && (
                          <Button size="s" variant="plain" onClick={() => reviewInterest(it.id, 'notNow')}>
                            Not now
                          </Button>
                        )}
                        {it.review === 'notNow' && (
                          <Button size="s" variant="plain" onClick={() => reviewInterest(it.id, undefined)}>
                            Move back
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null,
      )}
      <p className="meta">{p0(all)} People aren't told when you choose Not now.</p>
    </div>
  );
}

const p0 = (all: { withdrawn?: boolean }[]) => {
  const n = all.filter((i) => !i.withdrawn).length;
  return `${n} ${n === 1 ? 'person' : 'people'} interested.`;
};

/* ------------------------------------------------------------------ Report */

/**
 * "Something wrong?" on a credit. On a credit waiting for the person it sends the credit back for
 * correction. On an accepted credit it asks for an amendment instead: the accepted credit stays public
 * as it is while the production reviews, and only a revised version the person accepts can replace it.
 */
function ReportCredit({ title, creditId }: { title: string; creditId?: string }) {
  const { closeSheet, showToast, requestCorrection, attempt, openSheet } = useStore();
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'failed'>('idle');
  const c = creditId ? world.credits.find((x) => x.id === creditId) : undefined;
  const accepted = c?.status === 'accepted';
  const house = c ? wproject(c.projectId)?.houseId : undefined;
  const reasons = ['Wrong role', 'Wrong episodes or dates', "I didn't work on this", 'Name misspelled'];
  return (
    <div className="stack">
      <p className="meta">
        {accepted
          ? `The production that issued your credit on ${title} will review it. Your credit stays public as it is until you accept a revised version.`
          : `The production that issued ${title} will review it.`}
      </p>
      <div className="group">
        {reasons.map((r) => (
          <Row key={r} label={r} onPress={() => setReason(r)} chevron={false} pressed={reason === r} value={reason === r ? <Check size={18} className="accent" aria-hidden /> : undefined} />
        ))}
      </div>
      {state === 'failed' && <p className="field-error" role="alert">Couldn't send. Try again.</p>}
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
              if (creditId) requestCorrection(creditId, reason);
              closeSheet();
              showToast({ text: accepted ? 'Sent to the production. Your credit stays as it is until you accept a change.' : 'Sent to the production. Nothing is public until you accept.' });
            },
            () => setState('failed'),
          );
        }}
      >
        {state === 'failed' ? 'Try again' : accepted ? 'Ask to amend' : 'Send'}
      </Button>
      {house && (
        <p className="meta">
          Fraud, a fake credit or someone using your identity?{' '}
          <button className="link link--small" onClick={() => openSheet({ name: 'report', subject: `Credit on ${title}`, partyId: house })}>
            Report to Art and Artist
          </button>
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Activity */

/** Private to the account owner: what they saved, what they sent, what they posted. */
function Activity() {
  const { saved, interestsSent, userCollabs, viewer, push } = useStore();
  const pick = (ids: string[]) => ids.map((id) => findOpportunity(id, userCollabs)).filter(Boolean) as NonNullable<ReturnType<typeof findOpportunity>>[];
  const sections = [
    { title: 'Sent', items: pick(Object.keys(interestsSent)), empty: 'Roles you respond to appear here.' },
    { title: 'Your collaborations', items: [...userCollabs, ...seed.opportunities.filter((o) => o.authorId === viewer.id)], empty: 'Nothing posted yet.' },
  ];
  return (
    <div className="stack stack--loose">
      {/* Saved has one home, the private Saved screen; activity only points to it. */}
      <div className="group">
        <Row icon={<Bookmark size={20} />} label="Saved" value={saved.length ? String(saved.length) : undefined} onPress={() => push({ name: 'saved' })} />
      </div>
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
  const { viewer, acting, setActing, memberships, tab, canIssue } = useStore();
  const district = useFeatures().home === 'district';
  const me = person(viewer.id);
  const rows = [{ id: 'self', party: me, sub: 'Your personal profile' }, ...memberships.map((m) => ({ id: m, party: org(m), sub: district ? !org(m).verified ? 'Private projects · verification pending' : canIssue ? 'Roles, projects and credits' : 'Roles and projects' : 'You can open roles and issue credits' }))];
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
      {!district && <p className="meta">The house's owner decides who can act for it. Your own profile and credits always stay yours.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------- Share */

function ShareSheet({ label, url }: { label: string; url?: string }) {
  const { closeSheet, showToast, conversations } = useStore();
  const recent = conversations.slice(0, 3);
  return (
    <div className="stack">
      <p className="meta">{label}</p>
      {recent.length > 0 && !url && (
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
          onPress={async () => {
            if (url) {
              try { await navigator.clipboard.writeText(url); }
              catch { showToast({ text: 'Could not copy the link. Try sharing from your browser.' }); return; }
            }
            closeSheet();
            showToast({ text: 'Link copied' });
          }}
        />
        <Row
          icon={<Send size={22} />}
          label="Share outside Art and Artist"
          chevron={false}
          onPress={async () => {
            if (url) {
              if (!navigator.share) { showToast({ text: 'Use Copy link to share from this browser.' }); return; }
              try { await navigator.share({ title: label, url }); closeSheet(); }
              catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) showToast({ text: 'Could not open device sharing. Try Copy link.' }); }
              return;
            }
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
  const { openSheet, blocked, unblock, closeSheet, showToast, isSaved, toggleSave } = useStore();
  const p = party(id)!;
  const isBlocked = blocked.includes(id);
  return (
    <div className="group">
      {p.kind === 'person' && <Row icon={<Bookmark size={22} />} label={isSaved('person', id) ? 'Remove from saved' : `Save ${p.name}`} onPress={() => { toggleSave(id, 'person'); closeSheet(); }} />}
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

/** Events have their own reasons: money for a role, a fake or misleading event, and anything involving a child goes straight to Child Safety. */
const EVENT_REPORT_REASONS = ['Asks for money for a role or audition', 'Not a real event', 'Misleading price or details', 'Involves a child', 'Something else'];
const REVIEW_REPORT_REASONS = ['Personal attack or harassment', 'Spoilers not marked', 'Not about the film', 'Fake or paid review', 'Something else'];
const REPORT_REASONS = ['Fake profile or impersonation', 'Asking for money to apply or audition', 'Harassment or unsafe behaviour', 'Misleading role or project', 'Stolen or misused work', 'Something else'];

/**
 * A post's More menu: Report post, through the same trust flow as everything else. Share and Save
 * live in the post's action row and are never repeated here. Your own post has no menu (no owner
 * actions exist yet; documented in SAVE_MODEL.md).
 */
function PostMenu({ id }: { id: string }) {
  const { openSheet, viewer, userPosts } = useStore();
  const post = userPosts.find((p) => p.id === id) ?? seed.posts.find((p) => p.id === id);
  if (!post) return <EmptyState title="This post is no longer available" />;
  const author = party(post.authorId);
  const mine = post.authorId === viewer.id;
  if (mine) return <EmptyState title="Nothing to change here yet" body="Editing and deleting posts aren't available yet." />;
  return (
    <div className="group">
      <Row icon={<Flag size={20} />} label="Report post" onPress={() => openSheet({ name: 'report', subject: `this post by ${author?.name ?? 'this person'}`, partyId: post.authorId, target: { kind: 'Post', id: post.id } })} />
    </div>
  );
}

/** Report: reason, optional detail, a clear promise, and the offer to block. */
function ReportSheet({ subject, partyId, target }: { subject: string; partyId?: string; target?: { kind: 'Post' | 'Event' | 'Review'; id: string } }) {
  const { openSheet, closeSheet, acting, viewer } = useStore();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [step, setStep] = useState<'form' | 'sending' | 'done'>('form');
  if (step === 'done')
    return (
      <div className="stack">
        <p className="title-2">Thanks. We'll look at it.</p>
        <p className="body">Art and Artist reviews reports within 24 hours. {target ? 'The author' : subject} won't be told who reported. If we act, you'll get a notification.</p>
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
      {acting !== 'self' && <p className="meta">This is a personal action: the report comes from you, {person(viewer.id).name.split(' ')[0]}, not {org(acting).name}.</p>}
      <div className="group">
        {(target?.kind === 'Event' ? EVENT_REPORT_REASONS : target?.kind === 'Review' ? REVIEW_REPORT_REASONS : REPORT_REASONS).map((r) => (
          <Row key={r} label={r} onPress={() => setReason(r)} chevron={false} pressed={reason === r} value={reason === r ? <Check size={18} className="accent" aria-hidden /> : undefined} />
        ))}
      </div>
      {reason && (
        <>
          <label className="field-label" htmlFor="report-detail">
            Details <span className="meta">(optional)</span>
          </label>
          <textarea id="report-detail" className="field field--area" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Anything that helps us check" />
        </>
      )}
      <Button
        block
        size="l"
        disabled={!reason}
        loading={step === 'sending'}
        onClick={() => {
          setStep('sending');
          // The payload the trust queue receives: what was reported (type, id, author) and why. The
          // reporter travels with it for Art and Artist staff only; the author is never told who reported.
          sentReports.push({ kind: target?.kind ?? 'Other', objectId: target?.id, authorId: partyId, subject, reason, note: detail || undefined, reporterId: viewer.id, level: reportLevel(reason) });
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
  const { block, closeSheet, showToast, acting } = useStore();
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
      {acting !== 'self' && <p className="meta">This is a personal action. It blocks them for your account, not for {org(acting).name}.</p>}
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
  const [start, setStart] = useState(() => parseDays(o.dates).start);
  const [end, setEnd] = useState(() => parseDays(o.dates).end);
  const [touched, setTouched] = useState(false);
  // Dates written in a looser form ("Nov, 9 days") stay as they are until a day is picked.
  const dates = touched && start ? fmtRange(start, end) : o.dates;
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
        <span className="field-label">Dates</span>
        <div className="field-row">
          <DateField
            className="field"
            value={start}
            onChange={(v) => {
              setTouched(true);
              setStart(v);
              if (end && v && end < v) setEnd('');
            }}
            label="Starts"
            placeholder="Starts"
            min={start && start < todayIso() ? start : undefined}
          />
          <DateField
            className="field"
            value={end}
            onChange={(v) => {
              setTouched(true);
              setEnd(v);
            }}
            label="Ends"
            placeholder="Ends (optional)"
            min={start || undefined}
            clearable
          />
        </div>
        {!start && o.dates && <p className="meta field-hint">Shown now as "{o.dates}". Pick the days to replace it.</p>}
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
      {state === 'failed' && <p className="field-error" role="alert">Couldn't save. Your edits are kept.</p>}
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
  { state: 'filled', label: 'Filled through Art and Artist', tells: 'Filled' },
  { state: 'filled', label: 'Filled another way', tells: 'Filled' },
  { state: 'closed', label: 'No longer needed', tells: 'No longer needed' },
  { state: 'closed', label: 'Project paused', tells: 'Project paused' },
];

/** Closing keeps the role and its history. Everyone who showed interest learns the outcome instead of silence. */
function CloseRole({ id }: { id: string }) {
  const { closeRole, closeSheet, showToast, interestsReceived } = useStore();
  const [pick, setPick] = useState<number | null>(null);
  const [step, setStep] = useState<'reason' | 'who' | 'add'>('reason');
  const [who, setWho] = useState<string | null>(null);
  const waiting = interestsReceived.filter((i) => i.opportunityId === id && !i.withdrawn);
  const wr = world.roles.find((r) => r.id === id);
  if (step === 'who')
    return (
      <div className="stack">
        <p className="meta">Who did you choose? Everyone else who showed interest is told the role is filled.</p>
        <div className="list list--flush">
          {waiting.map((i) => (
            <PressCard key={i.id} className="prow" onPress={() => { closeRole(id, 'filled', 'Filled through Art and Artist', i.personId); setWho(i.personId); setStep('add'); }} scale={0.985}>
              <Avatar party={person(i.personId)} size={40} />
              <div className="prow-text">
                <p className="item-title">{person(i.personId).name}</p>
                <p className="meta">{person(i.personId).role}</p>
              </div>
            </PressCard>
          ))}
        </div>
        <button className="link" onClick={() => { closeRole(id, 'filled', 'Filled through Art and Artist'); closeSheet(); showToast({ text: 'Role marked as filled' }); }}>
          Skip
        </button>
      </div>
    );
  if (step === 'add' && who && wr) {
    return <AddPerson projectId={wr.projectId} preset={{ personId: who, role: wr.role, fromRoleId: id }} done={closeSheet} />;
  }
  return (
    <div className="stack">
      <div className="group">
        {CLOSE_REASONS.map((r, i) => (
          <Row key={r.label} label={r.label} onPress={() => setPick(i)} chevron={false} pressed={pick === i} value={pick === i ? <Check size={18} className="accent" /> : undefined} />
        ))}
      </div>
      <p className="meta">{waiting.length ? `${waiting.length} ${waiting.length === 1 ? 'person' : 'people'} who showed interest will be told the role is ${pick !== null ? CLOSE_REASONS[pick].tells.toLowerCase() : 'closed'}. ` : ''}The role stops appearing on Art and Artist.</p>
      <Button
        block
        size="l"
        disabled={pick === null}
        onClick={() => {
          const r = CLOSE_REASONS[pick!];
          // Filled through Art and Artist on a project role: choose the person, then offer to add them to the project.
          if (pick === 0 && wr && waiting.length) return setStep('who');
          closeRole(id, r.state, r.label);
          closeSheet();
          showToast({ text: r.state === 'filled' ? 'Role marked as filled' : 'Role closed' });
        }}
      >
        {pick === 0 && wr && waiting.length ? 'Continue' : 'Close role'}
      </Button>
    </div>
  );
}
