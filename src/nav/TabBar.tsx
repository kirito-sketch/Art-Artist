import { motion } from 'framer-motion';
import { Compass, House, MessageCircle, Plus } from 'lucide-react';
import { useStore, type Tab } from '../state/store';
import { org, person } from '../state/selectors';
import { Avatar } from '../ui/primitives';
import { shared, spring } from '../ui/motion';

const ITEMS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'profile', label: 'Profile' },
];

/**
 * Light floating pill. V30: every tab is labelled, and the active one is unmistakable (tinted well,
 * dark icon, bold label), so Home and Discover always say which environment you are in.
 * Create is the one filled control.
 */
export function TabBar() {
  const { tab, setTab, openSheet, sheet, closeSheet, conversations, interestsReceived, viewer, acting } = useStore();
  const unread = conversations.some((c) => c.unread) || interestsReceived.some((i) => !i.withdrawn && !i.review);
  const createOpen = sheet?.name === 'create';

  const item = (it: (typeof ITEMS)[number]) => {
    const active = tab === it.id;
    return (
      <motion.button
        key={it.id}
        className={`tab-item ${active ? 'is-on' : ''}`}
        whileTap={{ scale: 0.88 }}
        transition={spring.press}
        onClick={() => {
          if (active) document.querySelector(`[data-scroll="${it.id}"]`)?.scrollTo({ top: 0, behavior: 'smooth' });
          setTab(it.id);
        }}
        aria-label={it.id === 'profile' && acting !== 'self' ? `Profile, acting as ${org(acting).name}` : it.label}
        aria-current={active ? 'page' : undefined}
      >
        {/* The well slides to the active tab; the icon lifts 2px into it. Spatial, not decorative. */}
        {active && <motion.span layoutId="tab-well" className="tab-well" transition={spring.snappy} />}
        <motion.span className="tab-icon" animate={{ y: active ? -2 : 0 }} transition={spring.snappy}>
          {it.id === 'home' && <House size={24} strokeWidth={active ? 2.4 : 1.9} />}
          {it.id === 'discover' && <Compass size={24} strokeWidth={active ? 2.4 : 1.9} />}
          {it.id === 'inbox' && <MessageCircle size={24} strokeWidth={active ? 2.4 : 1.9} />}
          {it.id === 'profile' && (
            // The avatar is the identity: it morphs when you switch who you act as.
            <motion.span layout key={acting} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.settle} className={`tab-avatar ${active ? 'is-on' : ''} ${acting !== 'self' ? 'tab-avatar--org' : ''}`}>
              <Avatar party={acting !== 'self' ? org(acting) : person(viewer.id)} size={26} />
            </motion.span>
          )}
        </motion.span>
        <span className="tab-label">{it.label}</span>
        {it.id === 'inbox' && unread && <span className="tab-dot" />}
      </motion.button>
    );
  };

  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-pill">
        {ITEMS.slice(0, 2).map(item)}
        <motion.button
          className="tab-create"
          aria-label={createOpen ? 'Close' : 'Create'}
          aria-expanded={createOpen}
          aria-haspopup="dialog"
          whileTap={{ scale: 0.86 }}
          transition={spring.press}
          onClick={() => (createOpen ? closeSheet() : openSheet({ name: 'create' }))}
        >
          {/* The red disc is the origin of the Create surface: it grows into it and returns to it. */}
          {!createOpen && <motion.span layoutId={shared.create} className="tab-create-disc" style={{ borderRadius: 26 }} transition={spring.sheet} />}
          <motion.span className="tab-create-icon" animate={{ rotate: createOpen ? 45 : 0 }} transition={spring.snappy}>
            <Plus size={24} strokeWidth={2.4} />
          </motion.span>
        </motion.button>
        {ITEMS.slice(2).map(item)}
      </div>
    </nav>
  );
}
