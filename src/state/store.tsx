import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as seed from '../data/seed';
import { RESEARCH } from '../research';
import { TEST_MODE } from '../research-data/surface';
import { BOOT } from '../qa/boot';
import * as act from '../domain/actions';
import { notificationsFor } from '../domain/discovery';
import { defaultIntent, type Intent } from '../domain/relevance';

/** Research sessions start as Aditi acting for Konark; an edge-case scenario starts where it says; everything else starts as Kiran. */
// Participant Test Mode (/test) is the Individual Creative study: always Kiran, always the seed state.
const START = TEST_MODE ? 'kiran' : RESEARCH ? 'aditi' : BOOT?.persona ?? 'kiran';
const START_ACTING = TEST_MODE ? 'self' : RESEARCH ? 'konark' : BOOT?.acting ?? 'self';
// A scenario's blocks belong to the person it starts as. Blocks live with the shared records, so both sides see their effect.
BOOT?.blocked?.forEach((target) => world.blocks.push({ by: START, target }));
import { party } from './selectors';
import { world, publicName, project as wproject, type Association, type Format, type HouseProject, type Thread } from './world';
import type { Craft, Person } from '../data/types';
import type { Conversation, IndustryEvent, Interest, Media, Notification, Opportunity, Post, Viewer } from '../data/types';

/* ------------------------------------------------------------ navigation */

export type Tab = 'home' | 'discover' | 'inbox' | 'profile';

export type Route =
  | { name: 'opportunity'; id: string; from?: 'card' }
  | { name: 'profile'; id: string }
  | { name: 'conversation'; id: string }
  | { name: 'network' }
  | { name: 'editProfile' }
  | { name: 'project'; id: string }
  | { name: 'work'; id: string; from?: 'card' }
  | { name: 'settings'; page?: import('../screens/settings/Settings').SettingsPage }
  | { name: 'houseSetup' }
  | { name: 'legal'; doc: 'terms' | 'privacy' | 'conduct' | 'reporting' | 'blocking' | 'authority' }
  | { name: 'yourData'; step?: 'delete' }
  | { name: 'hproject'; id: string }
  | { name: 'association'; id: string }
  | { name: 'org'; id: string }
  | { name: 'composePost' }
  | { name: 'composeCollab'; intent?: 'looking' | 'available' }
  | { name: 'media'; items: Media[]; index: number; what?: string; from?: string }
  | { name: 'posts'; ids: string[]; index: number }
  | { name: 'saved' }
  | { name: 'browse'; scope: 'roles' | 'people' | 'projects' | 'events' }
  | { name: 'reviews' }
  | { name: 'event'; id: string }
  | { name: 'composeEvent'; projectId?: string; editId?: string };

/** V30: one Saved model for the four things people come back to. People are saved privately (a shortlist), never shown to them. */
export type SavedKind = 'person' | 'role' | 'project' | 'post' | 'event';
export interface SavedItem {
  kind: SavedKind;
  id: string;
  at: number;
}

export type Sheet =
  | { name: 'create' }
  | { name: 'notifications' }
  | { name: 'availability' }
  | { name: 'intent' }
  | { name: 'showInterest'; id: string }
  | { name: 'reviewInterest'; opportunityId?: string }
  | { name: 'reportCredit'; title: string; creditId?: string }
  | { name: 'activity' }
  | { name: 'identity' }
  | { name: 'share'; label: string }
  | { name: 'more'; id: string }
  | { name: 'report'; subject: string; partyId?: string; target?: { kind: 'Post' | 'Event'; id: string } }
  | { name: 'postMore'; id: string }
  | { name: 'block'; id: string }
  | { name: 'editRole'; id: string }
  | { name: 'closeRole'; id: string }
  | { name: 'newProject' }
  | { name: 'pickProject' };

export interface Scenario {
  newUser: boolean;
  loading: boolean;
  offline: boolean;
  failPublish: boolean;
  forYouError: boolean;
  /** Test state: the next attempt of each key action fails; retrying succeeds. */
  actionsFail: boolean;
}

export interface Availability {
  open: boolean;
  from: string;
  scope: string;
}

export interface Publishing {
  id: string;
  kind: 'post' | 'collab';
  label: string;
  progress: number;
  state: 'uploading' | 'failed' | 'done';
  thumb?: Media;
}

export interface Toast {
  id: number;
  text: string;
  tone?: 'default' | 'success' | 'error';
  action?: { label: string; run: () => void };
}

export type PostDraft = { text: string; media: Media[]; addToPortfolio: boolean };

const VIEWERS: Record<string, Viewer> = {
  kiran: { id: 'kiran', craft: 'cinematographer', firstName: 'Kiran' },
  tara: { id: 'tara', craft: 'actor', firstName: 'Tara' },
  aditi: { id: 'aditi', craft: 'production', firstName: 'Aditi' },
};

/** What each seeded persona is trying to do at the start. Anyone can change it from Home at any time. */
const DEFAULT_INTENT: Record<string, Intent> = { kiran: 'work', tara: 'work', aditi: 'hire' };

const DEFAULT_FOLLOWING = ['meera', 'arjun', 'rhea', 'vikram', 'devika', 'sameer', 'ishaan', 'nandini'];

const DEFAULT_AVAILABILITY: Record<string, Availability> = {
  kiran: { open: true, from: '3 Oct', scope: 'Hyderabad · will travel' },
  tara: { open: true, from: 'Now', scope: 'Mumbai · self-tapes anywhere' },
  aditi: { open: false, from: 'Now', scope: 'Hyderabad' },
};

function useStoreValue() {
  const [viewerId, setViewerId] = useState<string>(START);
  const viewer = VIEWERS[viewerId];

  const [scenario, setScenarioState] = useState<Scenario>({
    newUser: false,
    loading: false,
    offline: false,
    failPublish: false,
    actionsFail: false,
    forYouError: false,
    ...BOOT?.flags,
  });

  const [tab, setTabState] = useState<Tab>(BOOT?.tab ?? 'home');
  const [stack, setStack] = useState<Route[]>(BOOT?.stack ?? []);
  const [sheet, setSheet] = useState<Sheet | null>(BOOT?.sheet ?? null);
  const [toast, setToast] = useState<Toast | null>(null);

  /**
   * Saved (docs/SAVE_MODEL.md): one private list per person, for Posts, Roles and Projects only.
   * The single source of truth for every bookmark in the app. Acting as a house never changes whose
   * list it is.
   */
  const [saved, setSaved] = useState<SavedItem[]>([]);
  /** Industry events (docs/EVENTS.md): the curated seed plus anything hosted in this session. */
  const [events, setEvents] = useState<IndustryEvent[]>(() => seed.seedEvents(Date.now()));
  const [creditBusy, setCreditBusy] = useState<string | null>(null);
  /** UI only: the credit that was just accepted, so its record can be stamped once (motion). */
  const [justAccepted, setJustAccepted] = useState<string | null>(null);
  /** Poster-side changes to published roles. Title and project stay fixed once published. */
  const failedOnce = useRef(new Set<string>());
  /** Bumped whenever the shared world changes, so every screen re-reads it. */
  const [worldVersion, setWorldVersion] = useState(0);
  const bump = useCallback(() => setWorldVersion((v) => v + 1), []);
  /** Test state: the signed-in member holds credit authority for the house. */
  const [canIssue, setCanIssue] = useState(BOOT?.canIssue ?? true);
  const [following, setFollowing] = useState<string[]>(BOOT?.flags?.newUser ? [] : DEFAULT_FOLLOWING);
  const [interestsSent, setInterestsSent] = useState<Record<string, string>>({});
  const [availability, setAvailabilityState] = useState<Availability>(DEFAULT_AVAILABILITY[START]);
  const [conversations, setConversations] = useState<Conversation[]>(seed.conversations[START]);
  const [interestsReceived, setInterestsReceived] = useState<Interest[]>(RESEARCH ? [] : seed.interests[START_ACTING === 'self' ? START : START_ACTING] ?? []);
  const [notifications, setNotifications] = useState<Notification[]>(seed.notifications[START]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userCollabs, setUserCollabs] = useState<Opportunity[]>([]);
  const [userPortfolio, setUserPortfolio] = useState<Media[]>([]);
  const [publishing, setPublishing] = useState<Publishing | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** Prototype comparison: Home opens on full-bleed slides or on a row of large cards. */
  /** Exploration: acting on behalf of a production house instead of as yourself. */
  const [acting, setActing] = useState<string>(START_ACTING);
  /** Organisations the signed-in person may act for. Permission only; not a team product. */
  /** Organisations each person may act for. Permission only; not a team product. */
  const [memberMap, setMemberMap] = useState<Record<string, string[]>>(BOOT?.memberships ?? { aditi: ['konark', 'tidewater'] });
  const memberships = memberMap[viewer.id] ?? [];
  /** Who is doing things right now. Every change to shared records goes through the domain actions with this. */
  const actor: act.Actor = { viewerId: viewer.id, acting, memberships, canIssue };
  const actorRef = useRef(actor);
  actorRef.current = actor;
  /** Entry layer: splash → entry → auth → consent → onboarding (and a house invite). Null means the app. */
  const [entry, setEntry] = useState<null | { mode: 'new' | 'invite' | 'signin'; notice?: string }>(BOOT?.entry ? { mode: BOOT.entry } : null);
  /** Consent records: which document, which version, when. */
  const [consents, setConsents] = useState<{ doc: string; version: string; at: string; method: string }[]>([
    { doc: 'Terms of Service', version: 'Draft 0.3', at: '12 Mar 2026', method: 'Signup' },
    { doc: 'Privacy Policy', version: 'Draft 0.3', at: '12 Mar 2026', method: 'Signup' },
  ]);
  const [policyUpdate, setPolicyUpdate] = useState(BOOT?.policyUpdate ?? false);
  const [newPeople, setNewPeople] = useState<string[]>([]);
  /** V30: professional intent per person ("what are you trying to do right now?"). Drives Home's order and ranking. */
  const [intents, setIntents] = useState<Record<string, Intent>>({});
  const intent: Intent = intents[viewer.id] ?? DEFAULT_INTENT[viewer.id] ?? defaultIntent(viewer.craft);
  const [profileVersion, setProfileVersion] = useState(0);
  /** Screens currently showing a full-bleed photo under the status bar, keyed by screen. */
  const [heroUnderStatus, setHeroUnderStatus] = useState<Record<string, boolean>>({});
  const setHero = useCallback((key: string, on: boolean) => {
    setHeroUnderStatus((h) => (h[key] === on ? h : { ...h, [key]: on }));
  }, []);

  const toastTimer = useRef<number>();
  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    window.clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    // A toast with an action (Undo) stays long enough to reach by keyboard, and pauses while hovered
    // or focused (holdToast): WCAG 2.2.1. Information-only toasts are also in a live region.
    toastTimer.current = window.setTimeout(() => setToast(null), t.action ? 10000 : 3500);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  const holdToast = useCallback((hold: boolean) => {
    window.clearTimeout(toastTimer.current);
    if (!hold) toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  /* Switching persona resets per-account state, like signing into another account. */
  const switchViewer = useCallback((id: string) => {
    setViewerId(id);
    setToast(null);
    // A person created in onboarding follows nobody yet; seeded personas keep their demo network.
    setFollowing(id.startsWith('you-') ? [] : DEFAULT_FOLLOWING);
    setAvailabilityState(DEFAULT_AVAILABILITY[id]);
    setConversations(seed.conversations[id]);
    setInterestsReceived(seed.interests[id]);
    setNotifications(seed.notifications[id]);
    setSaved([]);
    setInterestsSent({});
    setUserPosts([]);
    setUserCollabs([]);
    setUserPortfolio([]);
    setStack([]);
    setSheet(null);
    setTabState('home');
  }, []);

  const setScenario = useCallback((patch: Partial<Scenario>) => {
    setScenarioState((s) => ({ ...s, ...patch }));
    // A new account follows nobody yet.
    if (patch.newUser === true) setFollowing([]);
    if (patch.newUser === false) setFollowing(DEFAULT_FOLLOWING);
    if ('loading' in patch || 'newUser' in patch || 'forYouError' in patch) setReloadKey((k) => k + 1);
  }, []);

  /* Loading scenario resolves on its own so skeletons are seen, then content arrives. */
  useEffect(() => {
    if (!scenario.loading) return;
    const t = window.setTimeout(() => setScenarioState((s) => ({ ...s, loading: false })), 2200);
    return () => window.clearTimeout(t);
  }, [scenario.loading, reloadKey]);

  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    setStack([]);
  }, []);
  const push = useCallback((r: Route) => {
    setSheet(null);
    setStack((s) => [...s, r]);
  }, []);
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  /** Swap the top screen for another (a composer becomes the thing it made). */
  const replace = useCallback((r: Route) => setStack((s) => [...s.slice(0, -1), r]), []);
  const openSheet = useCallback((s: Sheet) => setSheet(s), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const isSaved = useCallback((kind: SavedKind, id: string) => saved.some((x) => x.kind === kind && x.id === id), [saved]);
  const toggleSave = useCallback(
    (id: string, kind: SavedKind = 'role') => {
      const on = !saved.some((x) => x.kind === kind && x.id === id);
      setSaved((s) => (on ? [{ kind, id, at: Date.now() }, ...s] : s.filter((x) => !(x.kind === kind && x.id === id))));
      // The bookmark confirms itself. While acting for a house we say whose list it went to; the very
      // first save says once where Saved lives, with a way straight there.
      if (on && acting !== 'self') showToast({ text: 'Saved to your account', action: { label: 'View', run: () => push({ name: 'saved' }) } });
      else if (on && kind === 'event' && !saved.some((x) => x.kind === 'event')) showToast({ text: "Interested. It's in Saved, and we'll remind you before it starts.", action: { label: 'View', run: () => push({ name: 'saved' }) } });
      else if (on && saved.length === 0) showToast({ text: 'Saved. Find it in Saved, on your profile.', action: { label: 'View', run: () => push({ name: 'saved' }) } });
      // Removing is a loss (and from the Saved list the item disappears), so it always says so, with Undo.
      else if (!on) {
        const was = saved.find((x) => x.kind === kind && x.id === id);
        showToast({ text: kind === 'event' ? 'No longer interested' : 'Removed from Saved', action: { label: 'Undo', run: () => was && setSaved((s) => (s.some((x) => x.kind === kind && x.id === id) ? s : [was, ...s])) } });
      }
    },
    [saved, showToast, acting, push],
  );

  const toggleFollow = useCallback(
    (id: string) => {
      const on = !following.includes(id);
      setFollowing((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
      // Following is personal even while acting for a house; say so only then.
      if (on && acting !== 'self') showToast({ text: 'Following from your personal account' });
    },
    [following, acting, showToast],
  );

  const sendInterest = useCallback(
    (id: string, note: string) => {
      setInterestsSent((s) => ({ ...s, [id]: note }));
      setSheet(null);
      // No toast: the role's action bar itself turns into "Interest sent" (see the motion system).
    },
    [showToast],
  );

  const withdrawInterest = useCallback(
    (id: string) => {
      setInterestsSent((s) => {
        const next = { ...s };
        delete next[id];
        return next;
      });
      // Quiet by design: the poster isn't notified, the person simply leaves their list. Undo covers a mis-tap.
      const note = interestsSent[id];
      showToast({ text: 'Interest withdrawn', action: { label: 'Undo', run: () => setInterestsSent((s) => ({ ...s, [id]: note ?? '' })) } });
    },
    [showToast, interestsSent],
  );

  const setAvailability = useCallback(
    (a: Availability, silent = false) => {
      setAvailabilityState(a);
      setReloadKey((k) => k + 1);
      if (!silent) showToast({ text: a.open ? 'Availability updated. For You is refreshing.' : 'Marked as not available', tone: 'success' });
    },
    [showToast],
  );

  /**
   * Opens an existing conversation with this party about this context, or starts one. New conversations
   * are shared records: the other side reads the same thread, addressed to the identity that started it.
   */
  const startConversation = useCallback(
    (withId: string, context: Conversation['context'], opener?: string) => {
      const existing = conversations.find((c) => c.withId === withId && c.context.refId === context.refId && (c.asId ?? 'self') === acting);
      if (existing) return existing.id;
      const media = context.refId ? findRole(context.refId)?.media : undefined;
      const id = act.startThread(actorRef.current, withId, context as Thread['context'], media);
      // A block (of this identity, or of the person behind it) means no new conversation. Existing ones stay readable.
      if (!id) return showToast({ text: "You can't message them.", tone: 'error' }), undefined;
      if (opener) act.sendThreadMessage(actorRef.current, id, opener, nowTime());
      bump();
      return id;
    },
    [conversations, acting, bump, showToast],
  );

  /** Runs a key action after a short delay. With "Actions fail" on, the first try of each key fails and a retry succeeds. */
  const attempt = useCallback(
    (key: string, onDone: () => void, onFail: () => void, ms = 700) => {
      window.setTimeout(() => {
        if (scenario.actionsFail && !failedOnce.current.has(key)) {
          failedOnce.current.add(key);
          onFail();
        } else {
          failedOnce.current.delete(key);
          onDone();
        }
      }, ms);
    },
    [scenario.actionsFail],
  );
  const setMessageStatus = useCallback((convId: string, msgId: string, status?: 'sending' | 'failed') => {
    setConversations((cs) => cs.map((c) => (c.id === convId ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, status } : m)) } : c)));
  }, []);
  const deliver = useCallback(
    (convId: string, msgId: string) => attempt(`msg-${msgId}`, () => setMessageStatus(convId, msgId, undefined), () => setMessageStatus(convId, msgId, 'failed'), 600),
    [attempt, setMessageStatus],
  );
  const sendMessage = useCallback(
    (convId: string, text: string) => {
      if (world.threads.some((t) => t.id === convId)) {
        if (!act.sendThreadMessage(actorRef.current, convId, text, nowTime())) showToast({ text: "Couldn't send. You can't message each other.", tone: 'error' });
        bump();
        return;
      }
      const msgId = `m${Date.now()}`;
      setConversations((cs) => {
        const c = cs.find((x) => x.id === convId);
        if (!c) return cs;
        const updated = { ...c, updated: 'now', messages: [...c.messages, { id: msgId, from: 'me' as const, text, time: nowTime(), status: 'sending' as const }] };
        return [updated, ...cs.filter((x) => x.id !== convId)];
      });
      deliver(convId, msgId);
    },
    [deliver, bump, showToast],
  );
  const retryMessage = useCallback(
    (convId: string, msgId: string) => {
      setMessageStatus(convId, msgId, 'sending');
      deliver(convId, msgId);
    },
    [deliver, setMessageStatus],
  );

  const markConversationRead = useCallback((convId: string) => {
    const t = world.threads.find((x) => x.id === convId);
    if (t) {
      const before = t.unreadFor.length;
      act.markThreadRead(actorRef.current, convId);
      if (t.unreadFor.length !== before) bump();
      return;
    }
    setConversations((cs) => cs.map((c) => (c.id === convId && c.unread ? { ...c, unread: 0 } : c)));
  }, []);

  const dismissInterest = useCallback((id: string) => {
    setInterestsReceived((is) => is.filter((i) => i.id !== id));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications((ns) => ns.map((n) => ({ ...n, unread: false })));
  }, []);

  /* ------------------------------------------------------------ publishing */

  const timer = useRef<number>();
  const lastDraft = useRef<{ kind: 'post'; draft: PostDraft } | { kind: 'collab'; collab: Opportunity } | null>(null);

  const runUpload = useCallback(
    (p: Publishing, onDone: () => void) => {
      window.clearInterval(timer.current);
      setPublishing(p);
      let progress = 0;
      const fail = scenario.failPublish || scenario.offline;
      timer.current = window.setInterval(() => {
        progress += 0.06 + Math.random() * 0.08;
        if (fail && progress > 0.62) {
          window.clearInterval(timer.current);
          setPublishing((x) => (x ? { ...x, progress: 0.62, state: 'failed' } : x));
          return;
        }
        if (progress >= 1) {
          window.clearInterval(timer.current);
          setPublishing((x) => (x ? { ...x, progress: 1, state: 'done' } : x));
          onDone();
          window.setTimeout(() => setPublishing(null), 1400);
          return;
        }
        setPublishing((x) => (x ? { ...x, progress } : x));
      }, 160);
    },
    [scenario.failPublish, scenario.offline],
  );

  const publishPost = useCallback(
    (draft: PostDraft) => {
      lastDraft.current = { kind: 'post', draft };
      setStack((s) => s.filter((r) => r.name !== 'composePost'));
      setTabState('home');
      const id = `up-${Date.now()}`;
      runUpload(
        { id, kind: 'post', label: draft.media.length ? `Posting ${draft.media.length} ${draft.media.length === 1 ? 'item' : 'items'}` : 'Posting', progress: 0, state: 'uploading', thumb: draft.media[0] },
        () => {
          setUserPosts((ps) => [{ id, authorId: acting !== 'self' ? acting : viewer.id, time: 'now', text: draft.text, media: draft.media, likes: 0, comments: 0 }, ...ps]);
          if (draft.addToPortfolio) setUserPortfolio((pf) => [...draft.media, ...pf]);
          showToast({ text: draft.addToPortfolio ? 'Posted and added to your portfolio' : 'Posted', tone: 'success' });
        },
      );
    },
    [runUpload, showToast, viewer.id],
  );

  const publishCollab = useCallback(
    (collab: Opportunity) => {
      lastDraft.current = { kind: 'collab', collab };
      setStack((s) => s.filter((r) => r.name !== 'composeCollab'));
      setTabState('home');
      runUpload({ id: collab.id, kind: 'collab', label: 'Publishing collaboration', progress: 0, state: 'uploading', thumb: collab.media }, () => {
        setUserCollabs((cs) => [collab, ...cs]);
        if (collab.collabIntent === 'available') {
          // Availability is one source of truth: the post updates the profile state.
          setAvailabilityState({ open: true, from: collab.dates.split(' – ')[0] || 'Now', scope: collab.city });
        }
        showToast({ text: collab.collabIntent === 'available' ? 'You are now shown as available' : 'Collaboration is live', tone: 'success' });
      });
    },
    [runUpload, showToast],
  );

  const retryPublish = useCallback(() => {
    const d = lastDraft.current;
    if (!d) return;
    if (d.kind === 'post') publishPost(d.draft);
    else publishCollab(d.collab);
  }, [publishPost, publishCollab]);

  const cancelPublish = useCallback(() => {
    window.clearInterval(timer.current);
    setPublishing(null);
    showToast({
      text: 'Draft kept',
      action: {
        label: 'Edit',
        run: () => {
          const d = lastDraft.current;
          if (d?.kind === 'post') setStack([{ name: 'composePost' }]);
          if (d?.kind === 'collab') setStack([{ name: 'composeCollab' }]);
        },
      },
    });
  }, [showToast]);

  return {
    viewer,
    switchViewer,
    heroUnderStatus,
    acting,
    memberships,
    entry,
    startEntry: (mode: 'new' | 'invite' | 'signin', notice?: string) => {
      setSheet(null);
      setStack([]);
      setEntry({ mode, notice });
    },
    endEntry: () => setEntry(null),
    consents,
    recordConsent: (docs: string[], method: string) =>
      setConsents((c) => [...docs.map((doc) => ({ doc, version: 'Draft 0.3', at: 'Today', method })), ...c]),
    policyUpdate,
    setPolicyUpdate,
    isNewPerson: newPeople.includes(viewer.id),
    intent,
    setIntent: (i: Intent) => setIntents((m) => ({ ...m, [viewer.id]: i })),
    /** Creates the signed-in person from onboarding. The person owns this identity; no employer anywhere. */
    createPerson: (d: { name: string; photo?: string; craft: Craft; crafts: Craft[]; specialisation: string; role: string; city: string; travel: boolean; languages: string[]; availability: Availability; work: Media[]; email: string; intent?: Intent }) => {
      const id = `you-${Date.now().toString(36)}`;
      const p: Person = { id, kind: 'person', name: d.name, role: d.role, craft: d.craft, crafts: d.crafts, specialisation: d.specialisation || undefined, city: d.city, openToTravel: d.travel, tone: 3, languages: d.languages, photo: d.photo, visibility: 'public', identityVerified: false };
      seed.people.push(p);
      seed.parties[id] = p;
      VIEWERS[id] = { id, craft: d.craft, firstName: d.name.split(' ')[0] };
      DEFAULT_AVAILABILITY[id] = d.availability;
      seed.conversations[id] = [];
      seed.interests[id] = [];
      seed.notifications[id] = [];
      seed.pendingCredits[id] = [];
      seed.portfolio[id] = d.work;
      seed.about[id] = '';
      // Generated, not curated: people in the same craft, nearest first.
      seed.suggestedFor[id] = seed.people
        .filter((x) => x.id !== id && x.visibility === 'public' && (x.craft === d.craft || d.crafts.includes(x.craft)))
        .sort((a, b) => Number(b.city === d.city) - Number(a.city === d.city))
        .slice(0, 5)
        .map((x) => x.id);
      setNewPeople((n) => [...n, id]);
      if (d.intent) setIntents((m) => ({ ...m, [id]: d.intent! }));
      return id;
    },
    addMembership: (personId: string, orgId: string) => setMemberMap((m) => ({ ...m, [personId]: [...new Set([...(m[personId] ?? []), orgId])] })),
    /** Self-serve setup: the house exists immediately but is unverified until the Art and Artist team checks it. */
    createHouse: (d: { name: string; city: string; about: string; work: string[]; website: string; logo?: string }) => {
      const id = `h-${Date.now().toString(36)}`;
      const o = { id, kind: 'org' as const, name: d.name, city: d.city, tone: 2, verified: false, logo: d.logo, about: d.about || `${d.work.join(', ')}.` };
      seed.orgs.push(o);
      seed.parties[id] = o;
      setMemberMap((m) => ({ ...m, [viewer.id]: [...(m[viewer.id] ?? []), id] }));
      return id;
    },
    verifyPendingHouses: () => {
      act.verifyPendingHouses();
      bump();
    },
    /** Credits waiting for the signed-in person. Read from the one shared Credit record, never a copy. */
    pendingCredits: world.credits
      .filter((c) => c.personId === viewer.id && (c.status === 'proposed' || c.status === 'correction'))
      .map((c) => {
        const p = wproject(c.projectId)!;
        return { id: c.id, associationId: c.associationId, title: p.workingTitle, year: '2026', role: c.line, department: c.dept, orgId: p.houseId ?? 'konark', format: p.format, status: 'Filming' as const, media: p.artwork ?? seed.cameraRoll[0], correction: c.status === 'correction', note: c.note, revision: !!c.supersedes };
      }),
    creditBusy,
    justAccepted,
    acceptCredit: function accept(cid: string) {
      if (!world.credits.some((x) => x.id === cid)) return;
      setCreditBusy(cid);
      attempt(
        `credit-${cid}`,
        () => {
          setCreditBusy(null);
          const p = act.acceptCredit(actor, cid)!;
          bump();
          setJustAccepted(cid);
          window.setTimeout(() => setJustAccepted((j) => (j === cid ? null : j)), 2400);
          showToast({ text: p.shared ? `Credit accepted. It now shows on your profile and on ${publicName(p)}.` : `Credit accepted. It becomes public when ${party(p.houseId!)!.name} shares the project.`, tone: 'success' });
        },
        () => {
          setCreditBusy(null);
          showToast({ text: "Couldn't accept the credit. Nothing changed.", tone: 'error', action: { label: 'Retry', run: () => accept(cid) } });
        },
      );
    },
    attempt,
    retryMessage,
    roleEdits: world.roleEdits,
    roleStatus: world.roleStatus,
    editRole: (id: string, patch: Partial<Opportunity>, changed: string[]) => (act.editRole(actor, id, patch, changed), bump()),
    closeRole: (id: string, state: 'filled' | 'closed', reason: string, chosenId?: string) => (act.closeRole(actor, id, state, reason, chosenId), bump()),
    reopenRole: (id: string) => (act.reopenRole(actor, id), bump()),
    requestCorrection: (cid: string, reason?: string) => {
      if (act.requestCorrection(actor, cid, reason)) bump();
    },
    /** Switching identity keeps you on the tab you were on, so the change is visible where you made it. */
    setActing: (a: string, keepTab = false, keepStack = false) => {
      setActing(a);
      setInterestsReceived(seed.interests[a === 'self' ? viewer.id : a] ?? []);
      if (!keepStack) setStack([]);
      setSheet(null);
      if (!keepTab) setTabState('home');
    },
    /** Who the signed-in person blocked. Personal, even while acting for a house. */
    blocked: world.blocks.filter((b) => b.by === viewer.id).map((b) => b.target),
    /** Whether the identity in use and this party can't reach each other, because either person blocked the other. */
    cannotReach: (id: string) => act.blockedBetween(viewer.id, id) || act.blockedBetween(act.speakingAs(actor), id),
    block: (id: string) => (act.block(actor, id), bump()),
    unblock: (id: string) => (act.unblock(actor, id), bump()),
    /** A filled role keeps its record. Hiring again for the same craft and project is a new role. */
    openAgain: (id: string) => {
      const base = userCollabs.find((x) => x.id === id) ?? seed.opportunities.find((x) => x.id === id) ?? world.roles.find((x) => x.id === id);
      if (!base) return id;
      const again = act.openAgainFrom(base);
      setUserCollabs((cs) => [again, ...cs]);
      return again.id;
    },
    profileVersion,
    bumpProfile: () => setProfileVersion((v) => v + 1),
    markNotificationsReadWhere: (ids: string[]) => {
      world.notifications.forEach((n) => ids.includes(n.id) && (n.unread = false));
      bump();
      setNotifications((ns) => ns.map((n) => (ids.includes(n.id) ? { ...n, unread: false } : n)));
    },
    markNotificationRead: (id: string) => {
      const w = world.notifications.find((n) => n.id === id);
      if (w) (w.unread = false), bump();
      setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    },
    setHero,
    scenario,
    setScenario,
    reloadKey,
    tab,
    setTab,
    stack,
    push,
    pop,
    sheet,
    openSheet,
    closeSheet,
    toast,
    showToast,
    dismissToast,
    holdToast,
    saved,
    isSaved,
    toggleSave,
    events,
    /** Publish an event hosted by the signed-in person or the house they act for. Paid events from individuals wait for review. */
    replace,
    createEvent: (e: Omit<IndustryEvent, 'id' | 'status'>, review: 'live' | 'under_review') => {
      const id = `ev-${Date.now().toString(36)}`;
      setEvents((list) => [{ ...e, id, status: review === 'live' ? 'scheduled' : 'under_review' }, ...list]);
      return id;
    },
    /** Edit an event. A change to when or where is flagged so people who are interested hear about it. */
    updateEvent: (id: string, patch: Partial<IndustryEvent>) =>
      setEvents((list) => list.map((e) => (e.id !== id ? e : { ...e, ...patch, changed: patch.start !== undefined && patch.start !== e.start ? 'Date or time changed' : patch.venue && patch.venue !== e.venue ? 'Venue changed' : e.changed }))),
    cancelEvent: (id: string) => setEvents((list) => list.map((e) => (e.id === id ? { ...e, status: 'cancelled' as const } : e))),
    following,
    toggleFollow,
    /** Roles this person showed interest in: the shared Interest records, plus plain listings kept locally. */
    interestsSent: {
      ...interestsSent,
      ...Object.fromEntries(world.interests.filter((i) => i.personId === viewer.id && !i.withdrawn).map((i) => [i.opportunityId, i.note ?? ''])),
    } as Record<string, string>,
    sendInterest: (id: string, note: string, answers?: string[]) => {
      if (act.sendInterest(actor, id, note, answers)) return bump(), sendInterest(id, note);
      // A project role refused the Interest (for example, a block between the two). Nothing was shared.
      if (world.roles.some((r) => r.id === id)) return setSheet(null), showToast({ text: "Couldn't send your interest. Nothing was shared.", tone: 'error' });
      sendInterest(id, note);
    },
    withdrawInterest: (id: string) => {
      if (world.interests.some((i) => i.opportunityId === id && i.personId === viewer.id)) {
        act.withdrawInterest(actor, id);
        bump();
        setInterestsSent((s) => { const n = { ...s }; delete n[id]; return n; });
        showToast({ text: 'Interest withdrawn', action: { label: 'Undo', run: () => (act.undoWithdrawInterest(actorRef.current, id), bump()) } });
        return;
      }
      withdrawInterest(id);
    },
    availability,
    setAvailability,
    /** Shared threads for every identity this person holds, then their own older conversations. The Inbox shows the ones for the identity in use. */
    conversations: [
      ...world.threads.flatMap((t) => {
        const own = [acting === 'self' ? viewer.id : acting, viewer.id, ...memberships].find((x) => t.sides.includes(x));
        // An empty thread exists only for the side that opened it, until the first message.
        if (!own || (!t.messages.length && t.sides[0] !== own)) return [];
        return [threadAs(t, own, viewer.id)];
      }),
      ...conversations,
    ],
    startConversation,
    sendMessage,
    markConversationRead,
    interestsReceived: [
      ...interestsReceived,
      ...(acting !== 'self' ? world.interests.filter((i) => world.roles.find((r) => r.id === i.opportunityId)?.orgId === acting) : []),
    ],
    /** The house's review of one Interest: messaged, set aside, or moved back. The record itself stays. */
    reviewInterest: (id: string, review: 'messaged' | 'notNow' | undefined) => {
      if (world.interests.some((i) => i.id === id)) return act.reviewInterest(actor, id, review), bump();
      if (review) dismissInterest(id);
    },
    notifications: notificationsFor(viewer.id, memberships, notifications),
    worldVersion,
    canIssue,
    setCanIssue,
    createProject: (d: { workingTitle: string; format: Format; languages: string[] }) => {
      const id = act.createProject(actor, d);
      bump();
      return id;
    },
    updateProject: (id: string, patch: Partial<HouseProject>) => (act.updateProject(actor, id, patch), bump()),
    addRole: (projectId: string, f: Parameters<typeof act.addRole>[2]) => {
      const id = act.addRole(actor, projectId, f);
      bump();
      return id;
    },
    setRoleVisibility: (id: string, v: 'private' | 'open') => (act.setRoleVisibility(actor, id, v), bump()),
    addToProject: (projectId: string, who: { personId?: string; pending?: { name: string; phone: string } }, workingRole: string, dept: string, fromRoleId?: string) => {
      const id = act.addToProject(actor, projectId, who, workingRole, dept, fromRoleId);
      bump();
      return id;
    },
    editAssociation: (id: string, patch: Partial<Association>) => (act.editAssociation(actor, id, patch), bump()),
    removeAssociation: (id: string) => (act.removeAssociation(actor, id), bump()),
    flagAssociation: (id: string) => (act.flagAssociation(actor, id), bump()),
    issueCredit: (associationId: string, line: string, dept: string) => {
      const status = act.issueCredit(actor, associationId, line, dept);
      bump();
      return status;
    },
    proposePrepared: (creditId: string) => (act.proposePrepared(actor, creditId), bump()),
    proposeRevision: (amendmentId: string, line: string, dept: string) => (act.proposeRevision(actor, amendmentId, line, dept), bump()),
    keepCredit: (amendmentId: string) => (act.keepCredit(actor, amendmentId), bump()),
    declineRevision: (revisionId: string) => (act.declineRevision(actor, revisionId), bump()),
    markNotificationsRead,
    userPosts,
    userCollabs,
    userPortfolio,
    /** Adds work straight to the signed-in person's portfolio (Edit profile → Showreel and portfolio). */
    addToPortfolio: (ms: Media[]) => setUserPortfolio((pf) => [...ms.filter((m) => !pf.some((x) => x.id === m.id)), ...pf]),
    publishing,
    publishPost,
    publishCollab,
    retryPublish,
    cancelPublish,
    lastDraft,
  };
}

const findRole = (id: string) => world.roles.find((r) => r.id === id) ?? seed.opportunities.find((o) => o.id === id);

/** One shared thread, as one identity sees it. "me" is whichever side this person speaks as in it. */
function threadAs(t: Thread, own: string, viewerId: string): Conversation {
  const other = t.sides.find((x) => x !== own)!;
  return {
    id: t.id,
    withId: other,
    asId: own === viewerId ? 'self' : own,
    orgOwned: seed.orgs.some((o) => o.id === other),
    context: t.context,
    media: t.media,
    action: t.action?.side === own ? { label: t.action.label, reply: t.action.reply } : undefined,
    unread: t.unreadFor.includes(own) ? 1 : 0,
    updated: t.updated,
    messages: t.messages.map((m) => ({ id: m.id, from: m.from === own ? ('me' as const) : ('them' as const), text: m.text, time: m.time })),
  };
}

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}
