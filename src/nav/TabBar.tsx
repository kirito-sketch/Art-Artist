import { motion } from 'framer-motion';
import { Compass, House, MessageCircle, Plus } from 'lucide-react';
import { useStore, type Tab } from '../state/store';
import { org, person } from '../state/selectors';
import { Avatar } from '../ui/primitives';
import { spring } from '../ui/motion';

const ITEMS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'profile', label: 'Profile' },
];

/** Light floating pill. Icons only; the active tab is black, the rest grey. Create is the one filled control. */
export function TabBar() {
  const { tab, setTab, openSheet, sheet, closeSheet, conversations, interestsReceived, viewer, acting } = useStore();
  const unread = conversations.some((c) => c.unread) || interestsReceived.length > 0;
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
        {it.id === 'home' && <House size={24} strokeWidth={active ? 2.4 : 1.9} />}
        {it.id === 'discover' && <Compass size={24} strokeWidth={active ? 2.4 : 1.9} />}
        {it.id === 'inbox' && <MessageCircle size={24} strokeWidth={active ? 2.4 : 1.9} />}
        {it.id === 'profile' && (
          <span className={`tab-avatar ${active ? 'is-on' : ''} ${acting !== 'self' ? 'tab-avatar--org' : ''}`}>
            <Avatar party={acting !== 'self' ? org(acting) : person(viewer.id)} size={26} />
          </span>
        )}
        {it.id === 'inbox' && unread && <span className="tab-dot" />}
        {active && <motion.span layoutId="tab-mark" className="tab-mark" transition={spring.snappy} />}
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
          whileTap={{ scale: 0.88 }}
          transition={spring.press}
          onClick={() => (createOpen ? closeSheet() : openSheet({ name: 'create' }))}
        >
          <motion.span animate={{ rotate: createOpen ? 45 : 0 }} transition={spring.snappy} style={{ display: 'inline-flex' }}>
            <Plus size={24} strokeWidth={2.4} />
          </motion.span>
        </motion.button>
        {ITEMS.slice(2).map(item)}
      </div>
    </nav>
  );
}
