import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as seed from '../data/seed';
import { RESEARCH } from '../research';
import { BOOT } from '../qa/boot';
import * as act from '../domain/actions';
import { notificationsFor } from '../domain/discovery';

/** Research sessions start as Aditi acting for Konark; an edge-case scenario starts where it says; everything else starts as Kiran. */
const START = RESEARCH ? 'aditi' : BOOT?.persona ?? 'kiran';
const START_ACTING = RESEARCH ? 'konark' : BOOT?.acting ?? 'self';
import { party } from './selectors';
import { world, publicName, project as wproject, type Association, type Format, type HouseProject } from './world';
import type { Craft, Person } from '../data/types';
import type { Conversation, Credit, Interest, Media, Notification, Opportunity, Post, Viewer } from '../data/types';

/* ------------------------------------------------------------ navigation */

export type Look = 'minimal' | 'glass' | 'bold' | 'doodle';

export type Tab = 'home' | 'discover' | 'inbox' | 'profile';

export type Route =
  | { name: 'opportunity'; id: string }
  | { name: 'profile'; id: string }
  | { name: 'conversation'; id: string }
  | { name: 'network' }
  | { name: 'editProfile' }
  | { name: 'project'; id: string }
  | { name: 'work'; id: string }
  | { name: 'settings' }
  | { name: 'houseSetup' }
  | { name: 'legal'; doc: 'terms' | 'privacy' | 'conduct' | 'reporting' | 'blocking' | 'authority' }
  | { name: 'yourData' }
  | { name: 'hproject'; id: string }
  | { name: 'association'; id: string }
  | { name: 'org'; id: string }
  | { name: 'composePost' }
  | { name: 'composeCollab'; intent?: 'looking' | 'available' }
  | { name: 'media'; items: Media[]; index: number };

export type Sheet =
  | { name: 'create' }
  | { name: 'notifications' }
  | { name: 'availability' }
  | { name: 'respond'; id: string }
  | { name: 'showInterest'; id: string }
  | { name: 'reviewInterest'; opportunityId?: string }
  | { name: 'reportCredit'; title: string; creditId?: string }
  | { name: 'activity' }
  | { name: 'identity' }
  | { name: 'share'; label: string }
  | { name: 'more'; id: string }
  | { name: 'report'; subject: string; partyId?: string }
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

export interface ResponseRecord {
  sentAt: string;
  items: string[];
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

  const [saved, setSaved] = useState<string[]>([]);
  /** Credits issued by a production, waiting for the person to accept or correct. */
  const [pendingCredits, setPendingCredits] = useState<(Credit & { correction?: boolean })[]>(seed.pendingCredits[START]);
  const [acceptedCredits, setAcceptedCredits] = useState<Credit[]>([]);
  const [creditBusy, setCreditBusy] = useState<string | null>(null);
  /** Poster-side changes to published roles. Title and project stay fixed once published. */
  const [roleEdits, setRoleEdits] = useState<Record<string, Partial<Opportunity> & { changed?: string[] }>>({});
  const failedOnce = useRef(new Set<string>());
  /** Bumped whenever the shared world changes, so every screen re-reads it. */
  const [worldVersion, setWorldVersion] = useState(0);
  const bump = useCallback(() => setWorldVersion((v) => v + 1), []);
  /** Test state: the signed-in member holds credit authority for the house. */
  const [canIssue, setCanIssue] = useState(BOOT?.canIssue ?? true);
  const [following, setFollowing] = useState<string[]>(DEFAULT_FOLLOWING);
  const [responses, setResponses] = useState<Record<string, ResponseRecord>>({});
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
  /** Entry layer: splash → entry → auth → consent → onboarding (and a house invite). Null means the app. */
  const [entry, setEntry] = useState<null | { mode: 'new' | 'invite' | 'signin'; notice?: string }>(BOOT?.entry ? { mode: BOOT.entry } : null);
  /** Consent records: which document, which version, when. */
  const [consents, setConsents] = useState<{ doc: string; version: string; at: string; method: string }[]>([
    { doc: 'Terms of Service', version: 'Draft 0.3', at: '12 Mar 2026', method: 'Signup' },
    { doc: 'Privacy Policy', version: 'Draft 0.3', at: '12 Mar 2026', method: 'Signup' },
  ]);
  const [policyUpdate, setPolicyUpdate] = useState(BOOT?.policyUpdate ?? false);
  const [newPeople, setNewPeople] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>(BOOT?.blocked ?? []);
  const [houseHome, setHouseHome] = useState<'slate' | 'pulse' | 'queue'>('slate');
  const [houseProfile, setHouseProfile] = useState<'work' | 'hiring'>('work');
  /** VALIDATE: one Interest model everywhere (A) vs Interest for collaborations plus Respond for crew and casting (B). */
  const [roleModel, setRoleModel] = useState<'interest' | 'respond'>('interest');
  const [profileVersion, setProfileVersion] = useState(0);
  const [homeLayout, setHomeLayout] = useState<'slides' | 'cards'>('cards');
  /** Prototype comparison: visual direction applied across the whole app. */
  const [look, setLook] = useState<Look>('minimal');
  /** Screens currently showing a full-bleed photo under the status bar, keyed by screen. */
  const [heroUnderStatus, setHeroUnderStatus] = useState<Record<string, boolean>>({});
  const setHero = useCallback((key: string, on: boolean) => {
    setHeroUnderStatus((h) => (h[key] === on ? h : { ...h, [key]: on }));
  }, []);

  const toastTimer = useRef<number>();
  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    window.clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), t.action ? 4200 : 2600);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  /* Switching persona resets per-account state, like signing into another account. */
  const switchViewer = useCallback((id: string) => {
    setViewerId(id);
    setToast(null);
    setAvailabilityState(DEFAULT_AVAILABILITY[id]);
    setConversations(seed.conversations[id]);
    setInterestsReceived(seed.interests[id]);
    setNotifications(seed.notifications[id]);
    setPendingCredits(seed.pendingCredits[id]);
    setAcceptedCredits([]);
    setSaved([]);
    setResponses({});
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
  const openSheet = useCallback((s: Sheet) => setSheet(s), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const toggleSave = useCallback(
    (id: string) => {
      const on = !saved.includes(id);
      setSaved((s) => (on ? [id, ...s.filter((i) => i !== id)] : s.filter((i) => i !== id)));
      showToast(
        on
          ? { text: acting !== 'self' ? 'Saved to your account' : 'Saved to your list', action: { label: 'Undo', run: () => setSaved((x) => x.filter((i) => i !== id)) } }
          : { text: 'Removed from saved' },
      );
    },
    [saved, showToast, acting],
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

  const respond = useCallback(
    (id: string, items: string[]) => {
      setResponses((r) => ({ ...r, [id]: { sentAt: 'Today, ' + nowTime(), items } }));
      setSheet(null);
      showToast({ text: 'Response sent', tone: 'success' });
    },
    [showToast],
  );

  const sendInterest = useCallback(
    (id: string, note: string) => {
      setInterestsSent((s) => ({ ...s, [id]: note }));
      setSheet(null);
      showToast({ text: 'Interest sent', tone: 'success' });
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

  /** Opens an existing conversation with this party about this context, or starts one. */
  const startConversation = useCallback(
    (withId: string, context: Conversation['context'], opener?: string) => {
      const existing = conversations.find((c) => c.withId === withId && c.context.refId === context.refId);
      if (existing) return existing.id;
      const id = `c-${withId}-${Date.now()}`;
      const convo: Conversation = {
        id,
        withId,
        context,
        asId: acting,
        unread: 0,
        updated: 'now',
        messages: opener ? [{ id: 'm0', from: 'me', text: opener, time: 'now' }] : [],
      };
      setConversations((cs) => [convo, ...cs]);
      return id;
    },
    [conversations, acting],
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
      const msgId = `m${Date.now()}`;
      setConversations((cs) => {
        const c = cs.find((x) => x.id === convId);
        if (!c) return cs;
        const updated = { ...c, updated: 'now', messages: [...c.messages, { id: msgId, from: 'me' as const, text, time: nowTime(), status: 'sending' as const }] };
        return [updated, ...cs.filter((x) => x.id !== convId)];
      });
      deliver(convId, msgId);
    },
    [deliver],
  );
  const retryMessage = useCallback(
    (convId: string, msgId: string) => {
      setMessageStatus(convId, msgId, 'sending');
      deliver(convId, msgId);
    },
    [deliver, setMessageStatus],
  );

  const markConversationRead = useCallback((convId: string) => {
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
    homeLayout,
    setHomeLayout,
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
    /** Creates the signed-in person from onboarding. The person owns this identity; no employer anywhere. */
    createPerson: (d: { name: string; photo?: string; craft: Craft; crafts: Craft[]; specialisation: string; role: string; city: string; travel: boolean; languages: string[]; availability: Availability; work: Media[]; email: string }) => {
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
      return id;
    },
    addMembership: (personId: string, orgId: string) => setMemberMap((m) => ({ ...m, [personId]: [...new Set([...(m[personId] ?? []), orgId])] })),
    /** Self-serve setup: the house exists immediately but is unverified until the Ana team checks it. */
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
    pendingCredits: [
      ...world.credits
        .filter((c) => c.personId === viewer.id && (c.status === 'proposed' || c.status === 'correction'))
        .map((c) => {
          const p = wproject(c.projectId)!;
          return { id: c.id, title: p.workingTitle, year: '2026', role: c.line, department: c.dept, orgId: p.houseId ?? 'konark', format: p.format, status: 'Filming' as const, media: p.artwork ?? seed.cameraRoll[0], correction: c.status === 'correction' };
        }),
      ...pendingCredits,
    ],
    acceptedCredits,
    creditBusy,
    acceptCredit: function accept(cid: string) {
      const wc = world.credits.find((x) => x.id === cid);
      if (wc) {
        setCreditBusy(cid);
        attempt(
          `credit-${cid}`,
          () => {
            setCreditBusy(null);
            const p = act.acceptCredit(actor, cid)!;
            bump();
            showToast({ text: p.shared ? `Credit accepted. It now shows on your profile and on ${publicName(p)}.` : `Credit accepted. It becomes public when ${party(p.houseId!)!.name} shares the project.`, tone: 'success' });
          },
          () => {
            setCreditBusy(null);
            showToast({ text: "Couldn't accept the credit. Nothing changed.", tone: 'error', action: { label: 'Retry', run: () => accept(cid) } });
          },
        );
        return;
      }
      const c = pendingCredits.find((x) => x.id === cid);
      if (!c) return;
      setCreditBusy(cid);
      attempt(
        `credit-${cid}`,
        () => {
          setCreditBusy(null);
          setPendingCredits((xs) => xs.filter((x) => x.id !== cid));
          setAcceptedCredits((xs) => [c, ...xs]);
          showToast({ text: `Credit accepted. It now shows on your profile and on ${c.title}.`, tone: 'success' });
        },
        () => {
          setCreditBusy(null);
          showToast({ text: "Couldn't accept the credit. Nothing changed.", tone: 'error', action: { label: 'Retry', run: () => accept(cid) } });
        },
      );
    },
    attempt,
    retryMessage,
    roleEdits,
    roleStatus: world.roleStatus,
    editRole: (id: string, patch: Partial<Opportunity>, changed: string[]) => setRoleEdits((r) => ({ ...r, [id]: { ...r[id], ...patch, changed: [...new Set([...(r[id]?.changed ?? []), ...changed])] } })),
    closeRole: (id: string, state: 'filled' | 'closed', reason: string) => (act.closeRole(actor, id, state, reason), bump()),
    reopenRole: (id: string) => (act.reopenRole(actor, id), bump()),
    requestCorrection: (cid: string, reason?: string) => {
      if (act.requestCorrection(actor, cid, reason)) {
        bump();
        return;
      }
      setPendingCredits((xs) => xs.map((x) => (x.id === cid ? { ...x, correction: true } : x)));
    },
    /** Switching identity keeps you on the tab you were on, so the change is visible where you made it. */
    setActing: (a: string, keepTab = false, keepStack = false) => {
      setActing(a);
      setInterestsReceived(seed.interests[a === 'self' ? viewer.id : a] ?? []);
      if (!keepStack) setStack([]);
      setSheet(null);
      if (!keepTab) setTabState('home');
    },
    blocked,
    block: (id: string) => setBlocked((b) => (b.includes(id) ? b : [...b, id])),
    unblock: (id: string) => setBlocked((b) => b.filter((x) => x !== id)),
    houseHome,
    setHouseHome,
    houseProfile,
    setHouseProfile,
    roleModel,
    setRoleModel,
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
    look,
    setLook,
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
    saved,
    toggleSave,
    following,
    toggleFollow,
    responses,
    respond,
    withdrawResponse: (id: string) => {
      const prev = responses[id];
      setResponses((r) => { const n = { ...r }; delete n[id]; return n; });
      showToast({ text: 'Response withdrawn', action: { label: 'Undo', run: () => setResponses((r) => ({ ...r, [id]: prev })) } });
    },
    interestsSent,
    sendInterest: (id: string, note: string, answers?: string[]) => {
      if (act.sendInterest(actor, id, note, answers)) bump();
      sendInterest(id, note);
    },
    withdrawInterest: (id: string) => {
      act.withdrawInterest(actor, id);
      bump();
      withdrawInterest(id);
    },
    availability,
    setAvailability,
    conversations,
    startConversation,
    sendMessage,
    markConversationRead,
    interestsReceived: [
      ...interestsReceived,
      ...(acting !== 'self' ? world.interests.filter((i) => !i.dismissed && world.roles.find((r) => r.id === i.opportunityId)?.orgId === acting) : []),
    ],
    dismissInterest: (id: string) => {
      const w = world.interests.find((i) => i.id === id);
      if (w) (w.dismissed = true), bump();
      else dismissInterest(id);
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
    markNotificationsRead,
    userPosts,
    userCollabs,
    userPortfolio,
    publishing,
    publishPost,
    publishCollab,
    retryPublish,
    cancelPublish,
    lastDraft,
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
