import { motion, useReducedMotion } from 'framer-motion';
import { startTransition, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Plus } from 'lucide-react';
import { useStore, type Tab } from '../state/store';
import { org, person } from '../state/selectors';
import { Avatar } from '../ui/primitives';
import { shared, spring } from '../ui/motion';
import { focusables, inertProps } from '../ui/a11y';
import { TabIcon } from './TabIcon';
import { NAV_LENS } from '../ui/preview';
import { haptic } from '../ui/haptics';

const ITEMS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'profile', label: 'Profile' },
];

/**
 * Light floating pill. Every tab is labelled; the active one is green with its filled icon (the avatar
 * gains a green ring), lifted slightly, with a semibold label: clear without a capsule behind it, and
 * never by colour alone. The selected state is CSS (src/styles/refine.css), so it changes on the tap
 * itself. Create is the one solid control: an action, not a destination, so it never takes a tab state.
 */
export function TabBar() {
  const { tab, setTab, openSheet, sheet, closeSheet, conversations, interestsReceived, viewer, acting } = useStore();
  const unreadCount = conversations.filter((c) => c.unread).length + interestsReceived.filter((i) => !i.withdrawn && !i.review).length;
  const unread = unreadCount > 0;
  const createOpen = sheet?.name === 'create';

  // The selected state answers the tap at once: the bar re-renders on its own first, and the screen
  // change follows as a non-blocking transition, so the new tab never waits for the screen to render.
  const [shown, setShown] = useState(tab);
  useEffect(() => setShown(tab), [tab]);

  // Review navigation (?nav=glass, ?dir=a|b): one lens for the whole bar, placed from the selected tab's layout box.
  // offsetLeft and offsetWidth ignore transforms, so a tab pressed (scaled) at the moment of selection never skews it.
  const pill = useRef<HTMLDivElement>(null);
  const tabs = useRef<Partial<Record<Tab, HTMLElement | null>>>({});
  const [lens, setLens] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const still = useReducedMotion();
  useLayoutEffect(() => {
    if (!NAV_LENS || !pill.current) return;
    const place = () => {
      const el = tabs.current[shown];
      setLens((prev) => {
        if (!el) return null;
        // The lens is the tab's own box on both axes, so icon and label always sit at its centre (no overhang into the
        // gap beside it, no fixed insets that drift when the bar's padding or the item height changes).
        const next = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
        return prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height ? prev : next;
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(pill.current);
    return () => observer.disconnect();
  }, [shown, acting]);

  const item = (it: (typeof ITEMS)[number]) => {
    const active = shown === it.id;
    return (
      <motion.button
        key={it.id}
        ref={(el) => void (tabs.current[it.id] = el)}
        className={`tab-item ${active ? 'is-on' : ''}`}
        whileTap={{ scale: 0.94 }}
        transition={spring.press}
        onClick={() => {
          if (!active) haptic('select');
          if (active) document.querySelector(`[data-scroll="${it.id}"]`)?.scrollTo({ top: 0, behavior: 'smooth' });
          flushSync(() => setShown(it.id));
          startTransition(() => setTab(it.id));
        }}
        aria-label={it.id === 'profile' && acting !== 'self' ? `Profile, acting as ${org(acting).name}` : it.id === 'inbox' && unread ? `Inbox, ${unreadCount} new` : it.label}
        // While Create is open, only the + (its close control) stays operable in the bar.
        {...inertProps(createOpen)}
        aria-current={active ? 'page' : undefined}
      >
        <span className="tab-icon">
          {it.id === 'profile' ? (
            // The ring frame stays put; inside it the avatar morphs when you switch who you act as.
            <span className="tab-avatar-frame">
              <motion.span layout key={acting} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.settle} className={`tab-avatar ${acting !== 'self' ? 'tab-avatar--org' : ''}`}>
                <Avatar party={acting !== 'self' ? org(acting) : person(viewer.id)} size={26} />
              </motion.span>
            </span>
          ) : (
            <TabIcon tab={it.id} />
          )}
        </span>
        <span className="tab-label">{it.label}</span>
        {it.id === 'inbox' && unread && <span className="tab-dot" aria-hidden />}
      </motion.button>
    );
  };

  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-pill" ref={pill}>
        {/* The lens glides between destinations; critically damped, so it lands without overshoot. Create never takes it. */}
        {NAV_LENS && lens && (
          <motion.span className="tab-lens" aria-hidden initial={false} animate={lens} transition={still ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 46, mass: 0.9 }} />
        )}
        {ITEMS.slice(0, 2).map(item)}
        <motion.button
          className="tab-create"
          aria-label={createOpen ? 'Close Create' : 'Create'}
          aria-expanded={createOpen}
          aria-haspopup="dialog"
          whileTap={{ scale: 0.86 }}
          transition={spring.press}
          onClick={() => (createOpen ? closeSheet() : openSheet({ name: 'create' }))}
          // While Create is open the + is its close control: Tab from it wraps back into the surface.
          onKeyDown={(e) => {
            if (!createOpen || e.key !== 'Tab') return;
            const list = focusables(document.querySelector('.phone .create-layer') ?? document.body);
            if (!list.length) return;
            e.preventDefault();
            (e.shiftKey ? list[list.length - 1] : list[0]).focus();
          }}
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
