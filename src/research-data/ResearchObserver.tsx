/**
 * Observes the prototype for research. It reads the store and turns state changes into semantic events
 * (role_opened, post_saved, person_followed, interest_sent, identity_switched, ...). It never calls a
 * product action and never changes state, so it cannot alter how Art and Artist behaves. Without an active research
 * session every research.track call is a no-op.
 */
import { useEffect, useRef } from 'react';
import { useStore, type Route } from '../state/store';
import { party } from '../state/selectors';
import { research } from './client';
import type { ResearchEventName, ResearchObjectType } from './taxonomy';

/** The screen name events and feedback carry: the top route, else the tab. */
function screenOf(top: Route | undefined, tab: string, viewerId: string): string {
  if (!top) return tab === 'profile' ? 'own_profile' : tab;
  switch (top.name) {
    case 'opportunity':
      return 'role';
    case 'hproject':
    case 'project':
      return 'project';
    case 'org':
      return 'house';
    case 'posts':
      return 'post';
    case 'profile':
      return top.id === viewerId ? 'own_profile' : 'person_profile';
    default:
      return top.name;
  }
}

/** What opening a route means, in taxonomy terms. */
function openedEvent(r: Route, viewerId: string): { name: ResearchEventName; objectType?: ResearchObjectType; objectId?: string; metadata?: Record<string, unknown> } {
  switch (r.name) {
    case 'opportunity':
      return { name: 'role_opened', objectType: 'role', objectId: r.id };
    case 'project':
    case 'hproject':
      return { name: 'project_opened', objectType: 'project', objectId: r.id };
    case 'profile':
      return r.id === viewerId ? { name: 'own_profile_viewed', objectType: 'person', objectId: r.id } : { name: 'person_profile_opened', objectType: 'person', objectId: r.id };
    case 'org':
      return { name: 'house_profile_opened', objectType: 'house', objectId: r.id };
    case 'posts':
      return { name: 'post_opened', objectType: 'post', objectId: r.ids[r.index] };
    case 'conversation':
      return { name: 'conversation_opened', objectType: 'conversation', objectId: r.id };
    case 'event':
      return { name: 'event_opened', objectType: 'event', objectId: r.id };
    case 'saved':
      return { name: 'saved_opened' };
    case 'settings':
      return { name: 'settings_opened' };
    default:
      return { name: 'screen_opened', metadata: { route: r.name } };
  }
}

const TAB_EVENT: Record<string, ResearchEventName> = { home: 'home_viewed', discover: 'discover_opened', inbox: 'inbox_opened', profile: 'own_profile_viewed' };
const SAVE_EVENT: Record<string, [ResearchEventName, ResearchEventName]> = { person: ['person_saved', 'person_unsaved'], post: ['post_saved', 'post_unsaved'], role: ['role_saved', 'role_unsaved'], project: ['project_saved', 'project_unsaved'], event: ['event_saved', 'event_unsaved'] };

function diff(prev: Set<string>, next: Set<string>) {
  return { added: [...next].filter((x) => !prev.has(x)), removed: [...prev].filter((x) => !next.has(x)) };
}

export function ResearchObserver() {
  const s = useStore();
  const viewerId = s.viewer.id;
  const top = s.stack[s.stack.length - 1];
  const screen = screenOf(top, s.tab, viewerId);
  const persona = s.acting === 'self' ? viewerId : `${viewerId}@${s.acting}`;

  // Context first, so every event below carries the right screen and persona.
  research.setContext({ screen, persona, acting: s.acting, tab: s.tab, sheet: s.sheet?.name });

  // Baselines reset when the prototype switches persona: a persona switch is not a participant action.
  const base = useRef<{ viewer: string; saved: Set<string>; following: Set<string>; interests: Set<string>; mine: Set<string>; acting: string; open: boolean; stack: number; intent: string } | null>(null);
  const savedKeys = new Set(s.saved.map((x) => `${x.kind}:${x.id}`));
  const followKeys = new Set(s.following);
  const interestKeys = new Set(Object.keys(s.interestsSent));
  const myMessages = new Set(s.conversations.flatMap((c) => c.messages.filter((m) => m.from === 'me' && m.status !== 'failed').map((m) => `${c.id}:${m.id}`)));

  useEffect(() => {
    const b = base.current;
    const fresh = { viewer: viewerId, saved: savedKeys, following: followKeys, interests: interestKeys, mine: myMessages, acting: s.acting, open: s.availability.open, stack: s.stack.length, intent: s.intent };
    base.current = fresh;
    if (!b || b.viewer !== viewerId || !research.isActive()) return;

    const saves = diff(b.saved, savedKeys);
    for (const k of saves.added) {
      const [kind, id] = k.split(':');
      research.track(SAVE_EVENT[kind][0], { objectType: kind as ResearchObjectType, objectId: id });
    }
    for (const k of saves.removed) {
      const [kind, id] = k.split(':');
      research.track(SAVE_EVENT[kind][1], { objectType: kind as ResearchObjectType, objectId: id });
    }
    const follows = diff(b.following, followKeys);
    for (const id of follows.added) {
      const org = party(id)?.kind === 'org';
      research.track(org ? 'house_followed' : 'person_followed', { objectType: org ? 'house' : 'person', objectId: id });
    }
    for (const id of follows.removed) {
      const org = party(id)?.kind === 'org';
      research.track(org ? 'house_unfollowed' : 'person_unfollowed', { objectType: org ? 'house' : 'person', objectId: id });
    }
    const interests = diff(b.interests, interestKeys);
    for (const id of interests.added) research.track('interest_sent', { objectType: 'role', objectId: id });
    for (const id of interests.removed) research.track('interest_withdrawn', { objectType: 'role', objectId: id });
    // Count only: which conversation, never what was written.
    for (const k of diff(b.mine, myMessages).added) research.track('message_sent', { objectType: 'conversation', objectId: k.split(':')[0] });
    if (b.acting !== s.acting) research.track('identity_switched', { metadata: { from: b.acting === 'self' ? 'individual' : b.acting, to: s.acting === 'self' ? 'individual' : s.acting } });
    if (b.open !== s.availability.open) research.track('availability_changed', { metadata: { open: s.availability.open } });
    if (b.intent !== s.intent) research.track('intent_changed', { metadata: { from: b.intent, to: s.intent } });
  });

  // Navigation: tab changes, routes opened, and back.
  const prevStack = useRef<Route[]>(s.stack);
  useEffect(() => {
    if (!research.isActive()) return;
    if (!s.stack.length) research.track(TAB_EVENT[s.tab] ?? 'screen_opened', TAB_EVENT[s.tab] ? {} : { metadata: { route: s.tab } });
  }, [s.tab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const prev = prevStack.current;
    prevStack.current = s.stack;
    if (!research.isActive() || prev === s.stack) return;
    if (s.stack.length > prev.length || (s.stack.length === prev.length && top && prev[prev.length - 1] !== top)) {
      if (top) {
        const e = openedEvent(top, viewerId);
        research.track(e.name, e);
      }
    } else if (s.stack.length < prev.length) {
      research.track('navigated_back', { metadata: { from: screenOf(prev[prev.length - 1], s.tab, viewerId) } });
    }
  }, [s.stack]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sheets (share, notifications, activity, availability ...): name only.
  useEffect(() => {
    if (!research.isActive() || !s.sheet) return;
    if (s.sheet.name === 'notifications') research.track('notifications_opened');
    else research.track('sheet_opened', { metadata: { sheet: s.sheet.name } });
  }, [s.sheet?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // First run: the entry flow (splash, introduction, account, onboarding) has closed and the main
  // product is showing. "created" means a new account came out of onboarding; "signin" an existing one.
  const inEntry = useRef(!!s.entry);
  useEffect(() => {
    const was = inEntry.current;
    inEntry.current = !!s.entry;
    if (was && !s.entry && research.isActive()) research.track('first_home_reached', { metadata: { via: s.isNewPerson ? 'created' : 'signin', intent: s.intent } });
  }, [s.entry]); // eslint-disable-line react-hooks/exhaustive-deps

  // A credit stamped as accepted.
  useEffect(() => {
    if (research.isActive() && s.justAccepted) research.track('credit_accepted', { objectType: 'credit', objectId: s.justAccepted });
  }, [s.justAccepted]);

  return null;
}
