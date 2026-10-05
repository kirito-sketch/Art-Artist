import { AnimatePresence, LayoutGroup, MotionConfig, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Media } from './data/types';
import { TabBar } from './nav/TabBar';
import { CollabComposer } from './screens/create/CollabComposer';
import { PostComposer } from './screens/create/PostComposer';
import { DiscoverScreen, type Scope } from './screens/discover/DiscoverScreen';
import { HomeScreen } from './screens/home/HomeScreen';
import { HomeNext } from './screens/home/HomeNext';
import { DistrictHome } from './screens/home/DistrictHome';
import { FilmReviewsScreen, PersonReviewsScreen, ReviewsScreen } from './screens/reviews/ReviewsScreen';
import { useFeatures } from './ui/features';
import { NetworkRow } from './screens/home/NetworkActivity';
import { ConversationScreen, InboxScreen } from './screens/inbox/InboxScreen';
import { OpportunityScreen } from './screens/opportunity/OpportunityScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { EditProfile } from './screens/profile/EditProfile';
import { ProductionHome } from './screens/production/Production';
import { WorkScreen } from './screens/org/WorkScreen';
import { OrgScreen } from './screens/org/OrgScreen';
import { SettingsScreen } from './screens/settings/Settings';
import { AssociationScreen, HouseProjectScreen } from './screens/production/Create';
import { HouseSetup } from './screens/production/HouseSetup';
import { LegalScreen } from './legal/docs';
import { YourData } from './screens/settings/YourData';
import { SheetHost } from './screens/sheets/Sheets';
import { networkFor } from './state/selectors';
import { StoreProvider, useStore, type Route } from './state/store';
import { StatusBar, ToastHost } from './ui/chrome';
import { dur, ease, spring } from './ui/motion';
import { IdentityShift } from './ui/IdentityShift';
import { IconButton, Photo } from './ui/primitives';
import { ModalContext, activation, applySystemTextSize, currentScreen, focusEl, focusInto, inertProps, mediaName, trackInputModality, type ModalLayer } from './ui/a11y';
import { BackToStudio, DeepLink, EMBED, StageNotice } from './dev/deepLink';
import { Studio } from './studio/Studio';
import { RESEARCH, exitResearch } from './research';
import { ResearchObserver } from './research-data/ResearchObserver';
import { research } from './research-data/client';
import { RESEARCH_DASHBOARD, STUDIO, STUDIO_COMPARE, TEST_MODE } from './research-data/surface';
import { Compare } from './studio/Compare';
import { TestMode } from './research-data/TestMode';
import { FloatingViewSwitch, initialViewMode, installAppHead, isStandalone, saveViewMode, type ViewMode } from './dev/viewMode';
import { LaunchSplash, type LaunchPhase } from './ui/LaunchSplash';
import { launchSplashPending } from './ui/launchSession';
import { enableTheme } from './ui/theme';

// The researcher dashboard loads only on /research, so its code (and the Supabase browser client)
// never ship to the prototype or to participants.
const ResearchDashboard = lazy(() => import('./research-dashboard/Dashboard'));
import { EntryFlow } from './entry/Entry';
import { PolicyUpdate } from './legal/PolicyUpdate';
import { ADMIN } from './admin/adminMode';
import { AdminConsole } from './admin/Admin';
import { LAB, MOTION_REVIEW, SCENARIO, SPECIMEN } from './qa/boot';
import { MotionReview } from './qa/MotionReview';
import { Specimen } from './qa/Specimen';
import { PostStream } from './screens/discover/PostStream';
import { SavedScreen } from './screens/profile/SavedScreen';
import { EventScreen } from './screens/event/EventScreen';
import { EventComposer } from './screens/event/EventComposer';
import { EdgeCaseLab } from './qa/Lab';
import { ScenarioBar } from './qa/ScenarioBar';

/*
 * Transition per route type: composers rise like sheets, media zooms, detail pushes from the right.
 * When a card's artwork carries into the detail (shared element), the layer only fades so the
 * artwork is the thing that moves (docs/MOTION_MICROINTERACTION_SYSTEM.md).
 */
function transitionFor(r: Route) {
  if (r.name === 'posts' || ((r.name === 'opportunity' || r.name === 'work') && r.from === 'card')) return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  if (r.name === 'composePost' || r.name === 'composeCollab' || r.name === 'composeEvent') return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
  if (r.name === 'media') return { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } };
  if (r.name === 'opportunity') return { initial: { opacity: 0, scale: 0.94, y: 24 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, x: 60 } };
  return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
}

function RouteView({ r }: { r: Route }) {
  switch (r.name) {
    case 'opportunity':
      return <OpportunityScreen id={r.id} fromCard={r.from === 'card'} />;
    case 'profile':
      return <ProfileScreen id={r.id} />;
    case 'conversation':
      return <ConversationScreen id={r.id} />;
    case 'composePost':
      return <PostComposer />;
    case 'composeCollab':
      return <CollabComposer intent={r.intent} />;
    case 'media':
      return <MediaViewer items={r.items} index={r.index} what={r.what} from={r.from} />;
    case 'posts':
      return <PostStream ids={r.ids} index={r.index} />;
    case 'saved':
      return <SavedScreen />;
    case 'browse':
      return <BrowseScreen scope={r.scope} />;
    case 'reviews':
      return <ReviewsScreen />;
    case 'filmReviews':
      return <FilmReviewsScreen id={r.id} />;
    case 'personReviews':
      return <PersonReviewsScreen id={r.id} />;
    case 'network':
      return <NetworkScreen />;
    case 'editProfile':
      return <EditProfile />;
    case 'project':
      return <HouseProjectScreen id={r.id} />;
    case 'work':
      return <WorkScreen id={r.id} fromCard={r.from === 'card'} />;
    case 'org':
      return <OrgScreen id={r.id} />;
    case 'settings':
      return <SettingsScreen page={r.page} />;
    case 'hproject':
      return <HouseProjectScreen id={r.id} />;
    case 'association':
      return <AssociationScreen id={r.id} />;
    case 'houseSetup':
      return <HouseSetup />;
    case 'legal':
      return <LegalScreen id={r.doc} />;
    case 'yourData':
      return <YourData start={r.step} />;
    case 'event':
      return <EventScreen id={r.id} />;
    case 'composeEvent':
      return <EventComposer projectId={r.projectId} editId={r.editId} />;
  }
}

function NetworkScreen() {
  const { viewer, scenario, pop } = useStore();
  const events = networkFor(viewer, scenario);
  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
      </header>
      <div className="title-block">
        <h1 className="large-title">Your network</h1>
      </div>
      <div className="list">
        {events.map((e, i) => (
          <NetworkRow key={e.id} e={e} index={i} />
        ))}
      </div>
    </div>
  );
}

function MediaViewer({ items, index, what = 'Image', from = '' }: { items: Media[]; index: number; what?: string; from?: string }) {
  const { pop } = useStore();
  const [i, setI] = useState(index);
  const m = items[i];
  // Arrow keys move between items: swiping is never the only way (WCAG 2.5.7).
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' && i < items.length - 1) setI(i + 1);
    if (e.key === 'ArrowLeft' && i > 0) setI(i - 1);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 120) return pop();
    if (info.offset.x < -60 && i < items.length - 1) setI(i + 1);
    if (info.offset.x > 60 && i > 0) setI(i - 1);
  };
  return (
    <div className="viewer" onKeyDown={onKeyDown}>
      <h1 className="sr-only">{mediaName(m, i, items.length, what, from)}</h1>
      <div className="viewer-bar">
        <IconButton label="Close" className="icon-btn--on-dark" onClick={pop}>
          <X size={20} />
        </IconButton>
        {items.length > 1 && (
          <span className="viewer-count" aria-hidden>
            {i + 1} / {items.length}
          </span>
        )}
      </div>
      <motion.div className="viewer-stage" drag dragSnapToOrigin dragElastic={0.5} onDragEnd={onDragEnd}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={m.id} className="viewer-media" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring.gentle}>
            <Photo media={m} alt={m.caption ? '' : mediaName(m, i, items.length, what, from)} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      {m.caption && <p className="viewer-caption">{m.caption}</p>}
      {items.length > 1 && (
        <div className="viewer-dots" role="group" aria-label="Choose an item (or use the arrow keys)">
          {items.map((x, j) => (
            <button key={x.id + j} className={`viewer-dot ${j === i ? 'is-on' : ''}`} onClick={() => setI(j)} aria-label={`${j + 1} of ${items.length}`} aria-current={j === i ? 'true' : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

// Discover opens on Posts: a grid of work first, People, Opportunities, Projects and Events beside it.
// On /test it stays on People, so the Home comparison changes one thing only (like Events).
const DISCOVER_DEFAULT: Scope = TEST_MODE ? 'people' : 'posts';

/** One Discover category on its own page (District Home's tiles): today's list, with a back button and no tabs. */
function BrowseScreen({ scope }: { scope: Exclude<Scope, 'posts'> }) {
  const [s, setS] = useState<Scope>(scope);
  return <DiscoverScreen scope={s} setScope={setS} variant="browse" />;
}

const TAB_TITLE: Record<string, string> = { home: 'Home', discover: 'Discover', inbox: 'Inbox', profile: 'Profile' };

function Phone({ app = false }: { app?: boolean }) {
  const store = useStore();
  const { tab, setTab, stack, viewer } = store;
  const [discoverScope, setDiscoverScope] = useState<Scope>(DISCOVER_DEFAULT);
  // A craft to open Discover › Posts in (Home's posts tray), with a counter so the same craft re-applies.
  const [postFocus, setPostFocus] = useState<{ craft: string | null; n: number }>({ craft: null, n: 0 });
  const features = useFeatures();
  const goDiscover = (scope?: string, craft?: string) => {
    setDiscoverScope((scope as Scope) ?? DISCOVER_DEFAULT);
    if (scope === 'posts') setPostFocus((f) => ({ craft: craft ?? null, n: f.n + 1 }));
    setTab('discover');
  };

  // Hardware-back style: Escape pops the stack on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (store.sheet) store.closeSheet();
        else if (store.stack.length) store.pop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  /* --- Accessibility: one operable layer at a time (docs/ACCESSIBILITY_AUDIT.md A1-A3) --- */
  useEffect(() => trackInputModality(), []);
  const screen = useRef<HTMLDivElement>(null);
  const [modalRoot, setModalRoot] = useState<HTMLDivElement | null>(null);
  const [modals, setModals] = useState(0);
  const register = useCallback(() => {
    setModals((n) => n + 1);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      setModals((n) => n - 1);
    };
  }, []);
  const modalLayer = useMemo<ModalLayer>(() => ({ root: modalRoot, register }), [modalRoot, register]);
  const createOpen = store.sheet?.name === 'create';
  const overlay = !!store.entry || !!store.policyUpdate;
  const covered = modals > 0 || createOpen || overlay;

  // Remember what the user activated, so focus can go back to it when the thing it opened closes.
  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    const note = (e: Event) => {
      const t = e.target as HTMLElement | null;
      const card = t?.closest('.press-card') as HTMLElement | null;
      const hit = card?.querySelector<HTMLElement>(':scope > .pc-hit');
      const control = t?.closest<HTMLElement>('button, a[href], input, select, textarea, [tabindex]');
      activation.el = control && (!card || card.contains(control)) && control !== card ? control : hit ?? control ?? null;
    };
    el.addEventListener('click', note, true);
    el.addEventListener('focusin', note, true);
    return () => {
      el.removeEventListener('click', note, true);
      el.removeEventListener('focusin', note, true);
    };
  }, []);

  // Opening a screen moves focus into it; going back returns focus to what opened it.
  const openers = useRef<(HTMLElement | null)[]>([]);
  const prevDepth = useRef(stack.length);
  useEffect(() => {
    const depth = stack.length;
    const prev = prevDepth.current;
    prevDepth.current = depth;
    if (depth === prev) return;
    let f2 = 0;
    const f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => {
        if (depth > prev) {
          openers.current[depth - 1] = activation.el;
          focusInto(currentScreen());
        } else {
          const back = openers.current[depth];
          openers.current.length = depth;
          if (!(back && back.isConnected && !back.closest('[inert]') && focusEl(back))) focusInto(currentScreen());
        }
      });
    });
    return () => {
      cancelAnimationFrame(f1);
      cancelAnimationFrame(f2);
    };
  }, [stack.length]);

  // Switching tab from inside a screen (a "see all" link): focus would be stranded in the old tab.
  useEffect(() => {
    const f = requestAnimationFrame(() => {
      const a = document.activeElement;
      if (!a || a === document.body || a.closest('[inert]')) focusInto(currentScreen());
    });
    return () => cancelAnimationFrame(f);
  }, [tab]);

  // Each screen names the page, so the browser tab and screen readers say where the user is.
  useEffect(() => {
    if (TEST_MODE) return;
    const f = requestAnimationFrame(() => {
      const h = currentScreen()?.querySelector('h1');
      const name = h?.textContent?.trim() || TAB_TITLE[tab] || '';
      document.title = name ? `${name} · Art and Artist` : 'Art and Artist';
    });
    return () => cancelAnimationFrame(f);
  });

  const top = stack[stack.length - 1];
  // The status bar turns light and transparent over full-bleed photos (media viewer, profile hero).
  const topKey = top ? (top.name === 'profile' ? `profile-${top.id}` : top.name) : tab === 'profile' ? `profile-${viewer.id}-tab` : tab;
  const statusTone = top?.name === 'media' || store.heroUnderStatus[topKey] ? 'light' : top?.name === 'posts' || top?.name === 'saved' || top?.name === 'opportunity' ? 'paper' : 'dark';

  return (
    <MotionConfig reducedMotion="user">
    <LayoutGroup>
    <ModalContext.Provider value={modalLayer}>
    <div className={`phone ${app ? 'phone--app' : ''}`} data-viewer={viewer.id} data-look="minimal">
      <div className="phone-screen" ref={screen}>
        {/* App mode runs on the real device: it supplies the status bar and home indicator. */}
        {!app && <StatusBar tone={statusTone} />}
        {/* Tabs stay mounted so scroll position survives switching; only the active one is operable. */}
        {(['home', 'discover', 'inbox', 'profile'] as const).map((t) => (
          <motion.section
            key={t}
            className="tab-layer"
            initial={false}
            animate={{ opacity: tab === t ? 1 : 0, scale: tab === t ? 1 : 0.985 }}
            transition={{ duration: 0.2 }}
            style={{ pointerEvents: tab === t ? 'auto' : 'none', zIndex: tab === t ? 1 : 0 }}
            aria-hidden={tab !== t}
            role={tab === t && !stack.length ? 'main' : undefined}
            {...inertProps(tab !== t || stack.length > 0 || covered)}
          >
            {t === 'home' && (
              // Identity switch: the home world fades up anew so the change of context is felt, not just read.
              // (Keyed remount, no exit layer: an exiting copy of the old home must never linger under the new one.)
              <motion.div key={store.acting} className="identity-layer" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: dur.ui, ease: ease.out }}>
                {store.acting !== 'self' ? <ProductionHome /> : features.home === 'district' ? <DistrictHome go={{ discover: () => setTab('discover') }} /> : features.home === 'next' ? <HomeNext goDiscover={goDiscover} /> : <HomeScreen goDiscover={goDiscover} />}
              </motion.div>
            )}
            {t === 'discover' && (features.home === 'district' && store.acting === 'self' ? <DiscoverScreen scope="posts" setScope={() => undefined} variant="district" /> : <DiscoverScreen scope={discoverScope} setScope={setDiscoverScope} postFocus={postFocus} />)}
            {t === 'inbox' && <InboxScreen />}
            {t === 'profile' && (store.acting !== 'self' ? <OrgScreen id={store.acting} isTab /> : <ProfileScreen id={viewer.id} isTab active={tab === 'profile'} />)}
          </motion.section>
        ))}

        <div className="tabbar-layer" {...inertProps(stack.length > 0 || overlay || modals > 0)}>
          <TabBar />
        </div>

        <AnimatePresence>
          {stack.map((r, i) => {
            const tr = transitionFor(r);
            const isTop = i === stack.length - 1;
            return (
              <motion.section
                key={`${r.name}-${'id' in r ? r.id : ''}-${i}`}
                className={`route-layer route-layer--${r.name}`}
                style={{ zIndex: 20 + i }}
                initial={tr.initial}
                animate={tr.animate}
                exit={tr.exit}
                transition={spring.push}
                role={isTop ? 'main' : undefined}
                {...inertProps(!isTop || covered)}
              >
                <RouteView r={r} />
              </motion.section>
            );
          })}
        </AnimatePresence>

        <SheetHost />
        {store.policyUpdate && !store.entry && (
          <div className="overlay-layer" {...inertProps(modals > 0)}>
            <PolicyUpdate />
          </div>
        )}
        {store.entry && (
          <div className="overlay-layer" {...inertProps(modals > 0)}>
            <EntryFlow key={store.entry.mode + (store.entry.notice ?? '')} />
          </div>
        )}
        {/* Sheets render here, above every screen, so the screens can be inert while one is open. */}
        <div className={`modal-root ${overlay ? 'modal-root--top' : ''}`} ref={setModalRoot} />
        <ToastHost />
        <IdentityShift />
        {!app && <div className="home-indicator" />}
      </div>
    </div>
    </ModalContext.Provider>
    </LayoutGroup>
    </MotionConfig>
  );
}

export default function App() {
  // The index.html launch splash belongs to the normal app; any other surface releases it at once.
  useEffect(() => {
    if (!document.querySelector('.app-shell')) document.getElementById('aa-boot')?.remove();
  }, []);
  // Research mode: Shift+E leaves it (for the researcher; participants never see a control).
  useEffect(() => {
    if (!RESEARCH) return;
    const k = (e: KeyboardEvent) => e.shiftKey && e.key.toLowerCase() === 'e' && exitResearch();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  // Participant Test Mode: the unchanged prototype phone, with all research UI outside the device.
  // No console, notices or QA tools.
  if (TEST_MODE)
    return (
      <StoreProvider>
        <ResearchObserver />
        <TestMode phone={<Phone />} />
      </StoreProvider>
    );
  if (STUDIO_COMPARE) return <Compare />;
  if (STUDIO) return <Studio />;
  if (RESEARCH_DASHBOARD)
    return (
      <Suspense fallback={<p className="dash-loading">Loading…</p>}>
        <ResearchDashboard />
      </Suspense>
    );
  // The moderation console is a separate internal tool, never part of the app's identities.
  // The Edge Case Lab is an internal page; a scenario replaces the console with its own bar.
  if (LAB) return <EdgeCaseLab />;
  if (SPECIMEN) return <Specimen />;
  if (MOTION_REVIEW)
    return (
      <MotionConfig reducedMotion="user">
        <MotionReview />
      </MotionConfig>
    );
  if (SCENARIO?.fixture?.surface === 'admin')
    return (
      <>
        <AdminConsole start={{ report: SCENARIO.fixture.report }} />
        <ScenarioBar compact />
      </>
    );
  if (ADMIN && !SCENARIO) return <AdminConsole />;
  // Research sessions and Lab scenarios keep their own presentation; only the normal prototype switches.
  if (RESEARCH || SCENARIO)
    return (
      <StoreProvider>
        <ResearchObserver />
        <div className="stage">
          <div className="stage-phone">
            <Phone />
          </div>
          {SCENARIO ? <ScenarioBar /> : null}
        </div>
      </StoreProvider>
    );
  return <NormalApp />;
}

/** The normal prototype, in Prototype mode (the phone on a stage) or App mode (only the product). Studio links set it up. */
function NormalApp() {
  const [mode, setMode] = useState<ViewMode>(initialViewMode);
  const standalone = isStandalone();
  // Installed Home Screen app: the launch splash covers the app (inert, and unpainted while the mark
  // draws) until it finishes.
  const [launch, setLaunch] = useState<LaunchPhase>(launchSplashPending(standalone) ? 'covered' : 'off');
  useEffect(() => {
    installAppHead();
    applySystemTextSize();
    // Appearance (System / Light / Dark) follows the whole normal app; after installAppHead so the
    // theme-colour meta matches the resolved theme.
    enableTheme();
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('view-app', mode === 'app');
    return () => document.documentElement.classList.remove('view-app');
  }, [mode]);
  const choose = (m: ViewMode) => {
    saveViewMode(m);
    setMode(m);
  };
  return (
    <StoreProvider>
      <ResearchObserver />
      <DeepLink />
      {mode === 'app' ? (
        <div className={`app-shell${launch === 'covered' ? ' app-shell--covered' : ''}`} {...inertProps(launch !== 'off')}>
          <Phone app />
        </div>
      ) : (
        <div className="stage">
          <div className="stage-phone">
            <StageNotice />
            <Phone />
          </div>
        </div>
      )}
      <BackToStudio />
      <LaunchSplash enabled={standalone} onPhase={setLaunch} />
      {/* The installed Home Screen app is always App mode, with no development controls. */}
      {!standalone && !EMBED && <FloatingViewSwitch mode={mode} onChange={choose} className={mode === 'prototype' ? 'vm-float--narrow-only' : ''} />}
    </StoreProvider>
  );
}

// Development only: drive the research client from the console or a test script (no UI in this phase).
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __anaResearch: typeof research }).__anaResearch = research;
