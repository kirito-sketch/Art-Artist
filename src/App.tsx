import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
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
import { ProductionHome, ProjectScreen } from './screens/production/Production';
import { WorkScreen } from './screens/org/WorkScreen';
import { OrgScreen } from './screens/org/OrgScreen';
import { SettingsScreen } from './screens/settings/Settings';
import { AssociationScreen, HouseProjectScreen } from './screens/production/Create';
import { SheetHost } from './screens/sheets/Sheets';
import { networkFor } from './state/selectors';
import { StoreProvider, useStore, type Route } from './state/store';
import { StatusBar, ToastHost } from './ui/chrome';
import { spring } from './ui/motion';
import { IconButton, Photo } from './ui/primitives';
import { PrototypeControls } from './dev/PrototypeControls';

/* Transition per route type: composers rise like sheets, media zooms, detail pushes from the right. */
function transitionFor(r: Route) {
  if (r.name === 'composePost' || r.name === 'composeCollab') return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
  if (r.name === 'media') return { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } };
  if (r.name === 'opportunity') return { initial: { opacity: 0, scale: 0.94, y: 24 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, x: 60 } };
  return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
}

function RouteView({ r }: { r: Route }) {
  switch (r.name) {
    case 'opportunity':
      return <OpportunityScreen id={r.id} />;
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
    case 'network':
      return <NetworkScreen />;
    case 'editProfile':
      return <EditProfile />;
    case 'project':
      return <ProjectScreen id={r.id} />;
    case 'work':
      return <WorkScreen id={r.id} />;
    case 'org':
      return <OrgScreen id={r.id} />;
    case 'settings':
      return <SettingsScreen />;
    case 'hproject':
      return <HouseProjectScreen id={r.id} />;
    case 'association':
      return <AssociationScreen id={r.id} />;
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
  const statusTone = top?.name === 'media' || store.heroUnderStatus[topKey] ? 'light' : 'dark';

  return (
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
            {t === 'home' && (store.acting !== 'self' ? <ProductionHome /> : <HomeScreen goDiscover={goDiscover} />)}
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
        <ToastHost />
        <div className="home-indicator" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <div className="stage">
        <Phone />
        <PrototypeControls />
      </div>
    </StoreProvider>
  );
}
