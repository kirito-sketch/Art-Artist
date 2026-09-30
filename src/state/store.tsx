import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as seed from '../data/seed';
import type { Conversation, Interest, Media, Notification, Opportunity, Post, Viewer } from '../data/types';

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
  | { name: 'reportCredit'; title: string }
  | { name: 'activity' };

export interface Scenario {
  newUser: boolean;
  loading: boolean;
  offline: boolean;
  failPublish: boolean;
  forYouError: boolean;
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
};

const DEFAULT_FOLLOWING = ['meera', 'arjun', 'rhea', 'vikram', 'devika', 'sameer', 'ishaan', 'nandini'];

const DEFAULT_AVAILABILITY: Record<string, Availability> = {
  kiran: { open: true, from: '3 Oct', scope: 'Hyderabad · will travel' },
  tara: { open: true, from: 'Now', scope: 'Mumbai · self-tapes anywhere' },
};

function useStoreValue() {
  const [viewerId, setViewerId] = useState<'kiran' | 'tara'>('kiran');
  const viewer = VIEWERS[viewerId];

  const [scenario, setScenarioState] = useState<Scenario>({
    newUser: false,
    loading: false,
    offline: false,
    failPublish: false,
    forYouError: false,
  });

  const [tab, setTabState] = useState<Tab>('home');
  const [stack, setStack] = useState<Route[]>([]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [saved, setSaved] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>(DEFAULT_FOLLOWING);
  const [responses, setResponses] = useState<Record<string, ResponseRecord>>({});
  const [interestsSent, setInterestsSent] = useState<Record<string, string>>({});
  const [availability, setAvailabilityState] = useState<Availability>(DEFAULT_AVAILABILITY.kiran);
  const [conversations, setConversations] = useState<Conversation[]>(seed.conversations.kiran);
  const [interestsReceived, setInterestsReceived] = useState<Interest[]>(seed.interests.kiran);
  const [notifications, setNotifications] = useState<Notification[]>(seed.notifications.kiran);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userCollabs, setUserCollabs] = useState<Opportunity[]>([]);
  const [userPortfolio, setUserPortfolio] = useState<Media[]>([]);
  const [publishing, setPublishing] = useState<Publishing | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** Prototype comparison: Home opens on full-bleed slides or on a row of large cards. */
  /** Exploration: acting on behalf of a production house instead of as yourself. */
  const [acting, setActing] = useState<'self' | 'konark'>('self');
  const [profileVersion, setProfileVersion] = useState(0);
  const [homeLayout, setHomeLayout] = useState<'slides' | 'cards'>('slides');
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
  const switchViewer = useCallback((id: 'kiran' | 'tara') => {
    setViewerId(id);
    setToast(null);
    setAvailabilityState(DEFAULT_AVAILABILITY[id]);
    setConversations(seed.conversations[id]);
    setInterestsReceived(seed.interests[id]);
    setNotifications(seed.notifications[id]);
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
          ? { text: 'Saved to your list', action: { label: 'Undo', run: () => setSaved((x) => x.filter((i) => i !== id)) } }
          : { text: 'Removed from saved' },
      );
    },
    [saved, showToast],
  );

  const toggleFollow = useCallback((id: string) => {
    setFollowing((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, []);

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
      showToast({ text: 'Interest withdrawn' });
    },
    [showToast],
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
        unread: 0,
        updated: 'now',
        messages: opener ? [{ id: 'm0', from: 'me', text: opener, time: 'now' }] : [],
      };
      setConversations((cs) => [convo, ...cs]);
      return id;
    },
    [conversations],
  );

  const sendMessage = useCallback((convId: string, text: string) => {
    setConversations((cs) => {
      const c = cs.find((x) => x.id === convId);
      if (!c) return cs;
      const updated = { ...c, updated: 'now', messages: [...c.messages, { id: `m${Date.now()}`, from: 'me' as const, text, time: nowTime() }] };
      return [updated, ...cs.filter((x) => x.id !== convId)];
    });
  }, []);

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
          setUserPosts((ps) => [{ id, authorId: viewer.id, time: 'now', text: draft.text, media: draft.media, likes: 0, comments: 0 }, ...ps]);
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
    setActing: (a: 'self' | 'konark') => {
      setActing(a);
      setStack([]);
      setTabState('home');
    },
    profileVersion,
    bumpProfile: () => setProfileVersion((v) => v + 1),
    markNotificationRead: (id: string) => setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, unread: false } : n))),
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
    interestsSent,
    sendInterest,
    withdrawInterest,
    availability,
    setAvailability,
    conversations,
    startConversation,
    sendMessage,
    markConversationRead,
    interestsReceived,
    dismissInterest,
    notifications,
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
