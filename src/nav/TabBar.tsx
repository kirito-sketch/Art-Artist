import { motion } from 'framer-motion';
import { Compass, House, MessageSquareText, Plus } from 'lucide-react';
import { useStore, type Tab } from '../state/store';
import { person } from '../state/selectors';
import { Avatar } from '../ui/primitives';
import { spring } from '../ui/motion';

const ITEMS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'profile', label: 'Profile' },
];

export function TabBar() {
  const { tab, setTab, openSheet, sheet, closeSheet, conversations, interestsReceived, viewer } = useStore();
  const unread = conversations.reduce((n, c) => n + (c.unread ? 1 : 0), 0) + (interestsReceived.length ? 1 : 0);
  const createOpen = sheet?.name === 'create';

  const renderItem = (item: (typeof ITEMS)[number]) => {
    const active = tab === item.id;
    return (
      <button
        key={item.id}
        className={`tab-item ${active ? 'is-active' : ''}`}
        onClick={() => {
          if (active) document.querySelector(`[data-scroll="${item.id}"]`)?.scrollTo({ top: 0, behavior: 'smooth' });
          setTab(item.id);
        }}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
      >
        {active && <motion.span layoutId="tab-pill" className="tab-pill" transition={spring.snappy} />}
        <motion.span className="tab-icon" animate={{ scale: active ? 1 : 0.94, y: active ? -1 : 0 }} transition={spring.snappy}>
          {item.id === 'home' && <House size={21} strokeWidth={active ? 2.3 : 1.8} />}
          {item.id === 'discover' && <Compass size={21} strokeWidth={active ? 2.3 : 1.8} />}
          {item.id === 'inbox' && (
            <span className="tab-badge-wrap">
              <MessageSquareText size={21} strokeWidth={active ? 2.3 : 1.8} />
              {unread > 0 && <span className="tab-badge">{unread}</span>}
            </span>
          )}
          {item.id === 'profile' && (
            <span className={`tab-avatar ${active ? 'is-active' : ''}`}>
              <Avatar party={person(viewer.id)} size={22} />
            </span>
          )}
        </motion.span>
        <span className="tab-label">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-pill">
        {ITEMS.slice(0, 2).map(renderItem)}
        <div className="tab-create-slot">
          <motion.button
            className={`tab-create ${createOpen ? 'is-open' : ''}`}
            aria-label={createOpen ? 'Close create' : 'Create'}
            aria-expanded={createOpen}
            whileTap={{ scale: 0.88 }}
            transition={spring.press}
            onClick={() => (createOpen ? closeSheet() : openSheet({ name: 'create' }))}
          >
            <motion.span animate={{ rotate: createOpen ? 45 : 0 }} transition={spring.snappy} className="tab-create-icon">
              <Plus size={24} strokeWidth={2.4} />
            </motion.span>
          </motion.button>
        </div>
        {ITEMS.slice(2).map(renderItem)}
      </div>
    </nav>
  );
}
