import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { org, person } from '../state/selectors';
import { dur, ease, spring } from './motion';
import { Avatar } from './primitives';

/*
 * Identity switch (signature, Level 3). When the acting identity changes, a small slate rises from the profile tab
 * naming who you are now acting as, with their mark, then settles away. The
 * home underneath fades up anew (App). It is short and never blocks input: the point is that the
 * person always knows whose voice they are using.
 */
export function IdentityShift() {
  const { acting, viewer } = useStore();
  const prev = useRef(acting);
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (prev.current === acting) return;
    prev.current = acting;
    setShown(acting);
    const t = window.setTimeout(() => setShown(null), 1600);
    return () => window.clearTimeout(t);
  }, [acting]);

  const party = shown === null ? null : shown === 'self' ? person(viewer.id) : org(shown);
  return (
    <AnimatePresence>
      {party && (
        <motion.div
          key={shown}
          className="identity-shift"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: spring.settle }}
          exit={{ opacity: 0, y: 8, transition: { duration: dur.ui, ease: ease.out } }}
        >
          <Avatar party={party} size={26} />
          <span>
            <span className="identity-shift-label">{shown === 'self' ? 'Acting as you' : 'Acting for the house'}</span>
            <span className="identity-shift-name">{party.name}</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
