import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as seed from '../data/seed';
import { RESEARCH } from '../research';

/** Research sessions start as Aditi acting for Konark; everything else starts as Kiran. */
const START = RESEARCH ? 'aditi' : 'kiran';
import { party, person } from './selectors';
import { world, wid, publicName, project as wproject, type Association, type Format, type HouseProject } from './world';
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

/** Roles on an unannounced project never borrow its private artwork. */
const GENERIC_ROLE_IMAGE: Media = { id: 'role-generic', kind: 'image', src: 'images/covers/coastline.jpg' };

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
  const [viewerId, setViewerId] = useState<'kiran' | 'tara' | 'aditi'>(START);
  const viewer = VIEWERS[viewerId];

  const [scenario, setScenarioState] = useState<Scenario>({
    newUser: false,
    loading: false,
    offline: false,
    failPublish: false,
    actionsFail: false,
    forYouError: false,
  });

  const [tab, setTabState] = useState<Tab>('home');
  const [stack, setStack] = useState<Route[]>([]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [saved, setSaved] = useState<string[]>([]);
  /** Credits issued by a production, waiting for the person to accept or correct. */
  const [pendingCredits, setPendingCredits] = useState<(Credit & { correction?: boolean })[]>(seed.pendingCredits[START]);
  const [acceptedCredits, setAcceptedCredits] = useState<Credit[]>([]);
  const [creditBusy, setCreditBusy] = useState<string | null>(null);
  /** Poster-side changes to published roles. Title and project stay fixed once published. */
  const [roleEdits, setRoleEdits] = useState<Record<string, Partial<Opportunity> & { changed?: string[] }>>({});
  const [roleStatus, setRoleStatus] = useState<Record<string, { state: 'filled' | 'closed'; reason: string }>>({});
  const failedOnce = useRef(new Set<string>());
  /** Bumped whenever the shared world changes, so every screen re-reads it. */
  const [worldVersion, setWorldVersion] = useState(0);
  const bump = useCallback(() => setWorldVersion((v) => v + 1), []);
  /** Test state: the signed-in member holds credit authority for the house. */
  const [canIssue, setCanIssue] = useState(true);
  const [following, setFollowing] = useState<string[]>(DEFAULT_FOLLOWING);
  const [responses, setResponses] = useState<Record<string, ResponseRecord>>({});
  const [interestsSent, setInterestsSent] = useState<Record<string, string>>({});
  const [availability, setAvailabilityState] = useState<Availability>(DEFAULT_AVAILABILITY[START]);
  const [conversations, setConversations] = useState<Conversation[]>(seed.conversations[START]);
  const [interestsReceived, setInterestsReceived] = useState<Interest[]>(RESEARCH ? [] : seed.interests.kiran);
  const [notifications, setNotifications] = useState<Notification[]>(seed.notifications[START]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userCollabs, setUserCollabs] = useState<Opportunity[]>([]);
  const [userPortfolio, setUserPortfolio] = useState<Media[]>([]);
  const [publishing, setPublishing] = useState<Publishing | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** Prototype comparison: Home opens on full-bleed slides or on a row of large cards. */
  /** Exploration: acting on behalf of a production house instead of as yourself. */
  const [acting, setActing] = useState<string>(RESEARCH ? 'konark' : 'self');
  /** Organisations the signed-in person may act for. Permission only; not a team product. */
  const memberships = viewer.id === 'aditi' ? ['konark', 'tidewater'] : [];
  const [blocked, setBlocked] = useState<string[]>([]);
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
  const switchViewer = useCallback((id: 'kiran' | 'tara' | 'aditi') => {
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
            wc.status = 'accepted';
            const p = wproject(wc.projectId)!;
            world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: viewer.id, text: `${person(viewer.id).name} accepted the credit on ${p.workingTitle}: ${wc.line}`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
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
    roleStatus,
    editRole: (id: string, patch: Partial<Opportunity>, changed: string[]) => setRoleEdits((r) => ({ ...r, [id]: { ...r[id], ...patch, changed: [...new Set([...(r[id]?.changed ?? []), ...changed])] } })),
    closeRole: (id: string, state: 'filled' | 'closed', reason: string) => setRoleStatus((r) => ({ ...r, [id]: { state, reason } })),
    reopenRole: (id: string) => setRoleStatus((r) => { const n = { ...r }; delete n[id]; return n; }),
    requestCorrection: (cid: string, reason?: string) => {
      const wc = world.credits.find((x) => x.id === cid);
      if (wc) {
        wc.status = 'correction';
        wc.note = reason;
        const p = wproject(wc.projectId)!;
        world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: viewer.id, text: `${person(viewer.id).name} asked to correct a credit on ${p.workingTitle}: ${reason ?? ''}`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
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
      const nid = `${id}-again-${Date.now()}`;
      setUserCollabs((cs) => [{ ...base, id: nid, postedAgo: 'now', closesInDays: 14 }, ...cs]);
      return nid;
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
      // Roles created in the prototype reach their house through the shared world.
      if (world.roles.some((r) => r.id === id)) {
        world.interests = world.interests.filter((i) => !(i.opportunityId === id && i.personId === viewer.id));
        world.interests.push({ id: wid('wi'), personId: viewer.id, opportunityId: id, note: note || undefined, answers: answers?.some(Boolean) ? answers : undefined, time: 'now' });
        const r = world.roles.find((x) => x.id === id)!;
        if (r.orgId) world.notifications.unshift({ id: wid('wn'), forId: r.orgId, kind: 'interest', actorId: viewer.id, text: `${person(viewer.id).name} is interested in ${r.role} on ${r.project}`, time: 'now', unread: true, route: { name: 'hproject', id: r.projectId } });
        bump();
      }
      sendInterest(id, note);
    },
    withdrawInterest: (id: string) => {
      world.interests.forEach((i) => i.opportunityId === id && i.personId === viewer.id && (i.withdrawn = true));
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
    notifications: [...world.notifications.filter((n) => n.toPersonId === viewer.id || (!!n.forId && memberships.includes(n.forId))), ...notifications],
    worldVersion,
    canIssue,
    setCanIssue,
    createProject: (d: { workingTitle: string; format: Format; languages: string[] }) => {
      const p: HouseProject = { id: wid('hp'), ...(acting !== 'self' ? { houseId: acting } : { ownerId: viewer.id }), workingTitle: d.workingTitle, format: d.format, languages: d.languages, stage: 'Development', shared: false };
      world.projects.unshift(p);
      bump();
      return p.id;
    },
    updateProject: (id: string, patch: Partial<HouseProject>) => {
      const p = wproject(id);
      if (!p) return;
      Object.assign(p, patch);
      // Artwork reaches public roles only once the project itself is shared.
      world.roles.forEach((r) => r.projectId === id && ((r.project = publicName(p)), (r.stage = p.stage), p.shared && p.artwork && (r.media = p.artwork)));
      bump();
    },
    addRole: (projectId: string, f: { role: string; about: string; dates: string; city: string; paid: boolean; compensation: string; questions: string[]; visibility: 'private' | 'open' }) => {
      const p = wproject(projectId)!;
      const r = {
        id: wid('wr'), projectId, visibility: f.visibility, kind: 'crew' as const, role: f.role, project: publicName(p), projectType: `${p.format} · ${p.languages.join(', ')}`,
        ...(p.houseId ? { orgId: p.houseId } : { authorId: p.ownerId }),
        city: f.city || 'To be confirmed', dates: f.dates || 'Dates to be confirmed', compensation: f.paid ? f.compensation || 'Paid' : 'Unpaid', paid: f.paid, closesInDays: 14, stage: p.stage, language: p.languages.join(', '),
        about: f.about, lookingFor: [], questions: f.questions.filter(Boolean).slice(0, 3), match: [], forCrafts: [], media: (p.shared && p.artwork) || GENERIC_ROLE_IMAGE, postedAgo: 'now',
      };
      world.roles.unshift(r);
      bump();
      return r.id;
    },
    setRoleVisibility: (id: string, v: 'private' | 'open') => {
      const r = world.roles.find((x) => x.id === id);
      if (r) (r.visibility = v), (r.postedAgo = 'now'), bump();
    },
    addToProject: (projectId: string, who: { personId?: string; pending?: { name: string; phone: string } }, workingRole: string, dept: string, fromRoleId?: string) => {
      const p = wproject(projectId)!;
      const a: Association = { id: wid('wa'), projectId, ...who, workingRole, dept, fromRoleId, status: 'added' };
      world.associations.push(a);
      const owner = p.houseId ? party(p.houseId)!.name : person(p.ownerId!).name;
      // Transparency, not permission: the person is told privately. There is nothing to accept.
      if (who.personId) world.notifications.unshift({ id: wid('wn'), toPersonId: who.personId, kind: 'credit', actorId: p.houseId ?? p.ownerId!, text: `${owner} added you to ${p.workingTitle} as ${workingRole}`, time: 'now', unread: true, route: { name: 'association', id: a.id } });
      bump();
      return a.id;
    },
    editAssociation: (id: string, patch: Partial<Association>) => {
      const a = world.associations.find((x) => x.id === id);
      if (!a) return;
      Object.assign(a, patch);
      if (a.status === 'flagged' && (patch.workingRole || patch.dept)) a.status = 'added';
      bump();
    },
    flagAssociation: (id: string) => {
      const a = world.associations.find((x) => x.id === id);
      if (!a) return;
      a.status = 'flagged';
      const p = wproject(a.projectId)!;
      if (p.houseId) world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: a.personId!, text: `${person(a.personId!).name} says being on ${p.workingTitle} as ${a.workingRole} isn't right`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
      bump();
    },
    issueCredit: (associationId: string, line: string, dept: string) => {
      const a = world.associations.find((x) => x.id === associationId)!;
      const p = wproject(a.projectId)!;
      const status = canIssue ? 'proposed' : 'prepared';
      world.credits = world.credits.filter((c) => c.associationId !== associationId || c.status === 'accepted');
      const c = { id: wid('wc'), projectId: a.projectId, associationId, personId: a.personId!, line, dept, status } as const;
      world.credits.push({ ...c });
      if (status === 'proposed') world.notifications.unshift({ id: wid('wn'), toPersonId: a.personId, kind: 'credit', actorId: p.houseId!, text: `${party(p.houseId!)!.name} issued you a credit on ${p.workingTitle}: ${line}. Accept it to make it official.`, time: 'now', unread: true, route: { name: 'profile', id: a.personId! } });
      bump();
      return status;
    },
    proposePrepared: (creditId: string) => {
      const c = world.credits.find((x) => x.id === creditId);
      if (!c) return;
      const p = wproject(c.projectId)!;
      c.status = 'proposed';
      world.notifications.unshift({ id: wid('wn'), toPersonId: c.personId, kind: 'credit', actorId: p.houseId!, text: `${party(p.houseId!)!.name} issued you a credit on ${p.workingTitle}: ${c.line}. Accept it to make it official.`, time: 'now', unread: true, route: { name: 'profile', id: c.personId } });
      bump();
    },
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
