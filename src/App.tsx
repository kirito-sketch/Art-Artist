import { AnimatePresence, LayoutGroup, MotionConfig, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Media } from './data/types';
import { TabBar } from './nav/TabBar';
import { CollabComposer } from './screens/create/CollabComposer';
import { PostComposer } from './screens/create/PostComposer';
import { DiscoverScreen, type Scope } from './screens/discover/DiscoverScreen';
import { HomeScreen } from './screens/home/HomeScreen';
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
import { PrototypeControls, StageNotice } from './dev/PrototypeControls';
import { RESEARCH, exitResearch } from './research';
import { ResearchObserver } from './research-data/ResearchObserver';
import { research } from './research-data/client';
import { EntryFlow } from './entry/Entry';
import { PolicyUpdate } from './legal/PolicyUpdate';
import { ADMIN } from './admin/adminMode';
import { AdminConsole } from './admin/Admin';
import { LAB, MOTION_REVIEW, SCENARIO, SPECIMEN } from './qa/boot';
import { MotionReview } from './qa/MotionReview';
import { Specimen } from './qa/Specimen';
import { PostStream } from './screens/discover/PostStream';
import { SavedScreen } from './screens/profile/SavedScreen';
import { EdgeCaseLab } from './qa/Lab';
import { ScenarioBar } from './qa/ScenarioBar';

/*
 * Transition per route type: composers rise like sheets, media zooms, detail pushes from the right.
 * When a card's artwork carries into the detail (shared element), the layer only fades so the
 * artwork is the thing that moves (docs/MOTION_MICROINTERACTION_SYSTEM.md).
 */
function transitionFor(r: Route) {
  if (r.name === 'posts' || ((r.name === 'opportunity' || r.name === 'work') && r.from === 'card')) return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  if (r.name === 'composePost' || r.name === 'composeCollab') return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
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
      return <MediaViewer items={r.items} index={r.index} />;
    case 'posts':
      return <PostStream ids={r.ids} index={r.index} />;
    case 'saved':
      return <SavedScreen />;
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
      return <SettingsScreen />;
    case 'hproject':
      return <HouseProjectScreen id={r.id} />;
    case 'association':
      return <AssociationScreen id={r.id} />;
    case 'houseSetup':
      return <HouseSetup />;
    case 'legal':
      return <LegalScreen id={r.doc} />;
    case 'yourData':
      return <YourData />;
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

function MediaViewer({ items, index }: { items: Media[]; index: number }) {
  const { pop } = useStore();
  const [i, setI] = useState(index);
  const m = items[i];
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 120) return pop();
    if (info.offset.x < -60 && i < items.length - 1) setI(i + 1);
    if (info.offset.x > 60 && i > 0) setI(i - 1);
  };
  return (
    <div className="viewer">
      <div className="viewer-bar">
        <IconButton label="Close" className="icon-btn--on-dark" onClick={pop}>
          <X size={20} />
        </IconButton>
        {items.length > 1 && (
          <span className="viewer-count">
            {i + 1} / {items.length}
          </span>
        )}
      </div>
      <motion.div className="viewer-stage" drag dragSnapToOrigin dragElastic={0.5} onDragEnd={onDragEnd}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={m.id} className="viewer-media" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring.gentle}>
            <Photo media={m} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      {m.caption && <p className="viewer-caption">{m.caption}</p>}
      {items.length > 1 && (
        <div className="viewer-dots">
          {items.map((x, j) => (
            <button key={x.id + j} className={`viewer-dot ${j === i ? 'is-on' : ''}`} onClick={() => setI(j)} aria-label={`Item ${j + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function Phone() {
  const store = useStore();
  const { tab, setTab, stack, viewer } = store;
  const [discoverScope, setDiscoverScope] = useState<Scope>('roles');
  const goDiscover = (scope?: string) => {
    setDiscoverScope((scope as Scope) ?? 'roles');
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

  const top = stack[stack.length - 1];
  // The status bar turns light and transparent over full-bleed photos (media viewer, profile hero).
  const topKey = top ? (top.name === 'profile' ? `profile-${top.id}` : top.name) : tab === 'profile' ? `profile-${viewer.id}-tab` : tab;
  const statusTone = top?.name === 'media' || store.heroUnderStatus[topKey] ? 'light' : top?.name === 'posts' || top?.name === 'saved' || top?.name === 'opportunity' ? 'paper' : 'dark';

  return (
    <MotionConfig reducedMotion="user">
    <LayoutGroup>
    <div className="phone" data-viewer={viewer.id} data-look={store.look}>
      <div className="phone-screen">
        <StatusBar tone={statusTone} />
        {/* Tabs stay mounted so scroll position survives switching. */}
        {(['home', 'discover', 'inbox', 'profile'] as const).map((t) => (
          <motion.div
            key={t}
            className="tab-layer"
            initial={false}
            animate={{ opacity: tab === t ? 1 : 0, scale: tab === t ? 1 : 0.985 }}
            transition={{ duration: 0.2 }}
            style={{ pointerEvents: tab === t ? 'auto' : 'none', zIndex: tab === t ? 1 : 0 }}
            aria-hidden={tab !== t}
          >
            {t === 'home' && (
              // Identity switch: the home world fades up anew so the change of context is felt, not just read.
              // (Keyed remount, no exit layer: an exiting copy of the old home must never linger under the new one.)
              <motion.div key={store.acting} className="identity-layer" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: dur.ui, ease: ease.out }}>
                {store.acting !== 'self' ? <ProductionHome /> : <HomeScreen goDiscover={goDiscover} />}
              </motion.div>
            )}
            {t === 'discover' && <DiscoverScreen scope={discoverScope} setScope={setDiscoverScope} />}
            {t === 'inbox' && <InboxScreen />}
            {t === 'profile' && (store.acting !== 'self' ? <OrgScreen id={store.acting} isTab /> : <ProfileScreen id={viewer.id} isTab />)}
          </motion.div>
        ))}

        <TabBar />

        <AnimatePresence>
          {stack.map((r, i) => {
            const tr = transitionFor(r);
            return (
              <motion.div
                key={`${r.name}-${'id' in r ? r.id : ''}-${i}`}
                className={`route-layer route-layer--${r.name}`}
                style={{ zIndex: 20 + i }}
                initial={tr.initial}
                animate={tr.animate}
                exit={tr.exit}
                transition={spring.push}
              >
                <RouteView r={r} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        <SheetHost />
        {store.policyUpdate && !store.entry && <PolicyUpdate />}
        {store.entry && <EntryFlow key={store.entry.mode + (store.entry.notice ?? '')} />}
        <ToastHost />
        <IdentityShift />
        <div className="home-indicator" />
      </div>
    </div>
    </LayoutGroup>
    </MotionConfig>
  );
}

export default function App() {
  // Research mode: Shift+E leaves it (for the researcher; participants never see a control).
  useEffect(() => {
    if (!RESEARCH) return;
    const k = (e: KeyboardEvent) => e.shiftKey && e.key.toLowerCase() === 'e' && exitResearch();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
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
  return (
    <StoreProvider>
      <ResearchObserver />
      <div className="stage">
        <div className="stage-phone">
          {!RESEARCH && !SCENARIO && <StageNotice />}
          <Phone />
        </div>
        {RESEARCH ? null : SCENARIO ? <ScenarioBar /> : <PrototypeControls />}
      </div>
    </StoreProvider>
  );
}

// Development only: drive the research client from the console or a test script (no UI in this phase).
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __anaResearch: typeof research }).__anaResearch = research;
