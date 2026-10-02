import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import * as seed from '../../data/seed';
import { useStore } from '../../state/store';
import { spring } from '../../ui/motion';
import { Button } from '../../ui/primitives';

/*
 * First-run Home: the first screen after onboarding. It is built only from what onboarding captured
 * (craft, other crafts, city, languages, availability, work) and from real, discoverable content.
 * No network events, no invented activity: a new person has none, so none is shown. As their
 * network grows, the returning Home's modules take over (see HomeScreen).
 *
 * Every block carries data-world so the Phase 2 onboarding → Home transition can resolve the
 * sections around the craft object without another layout.
 */

/*
 * Onboarding → first Home (signature, Level 3). The first time a person's world is shown, the craft
 * object arrives slightly larger and settles into its corner; the intro's words, then its counts,
 * then the sections nudge into place. Nothing starts hidden: the static layout is complete from the
 * first frame, motion only settles it. Once per person per session; reduced motion: no travel.
 */
const formed = new Set<string>();

export function useWorldForming(active: boolean) {
  const { viewer } = useStore();
  const forming = active && !formed.has(viewer.id);
  // Marked after the first paint: the motion values above are read only when each element mounts.
  useEffect(() => {
    if (active) formed.add(viewer.id);
  }, [active, viewer.id]);
  return forming;
}

/** A first-run section resolving into place after the intro. */
export function Resolve({ forming, i, children }: { forming: boolean; i: number; children: ReactNode }) {
  return (
    <motion.div initial={forming ? { y: 18 } : false} animate={{ y: 0 }} transition={{ ...spring.settle, delay: 0.3 + i * 0.07 }}>
      {children}
    </motion.div>
  );
}

/** One quiet next step, only while something useful is missing. Never a checklist. */
export function FirstStep() {
  const { viewer, push, userPortfolio, availability, openSheet } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const hasWork = (seed.portfolio[viewer.id]?.length ?? 0) + userPortfolio.length > 0;
  const step = !hasWork
    ? { t: 'Add to your portfolio', b: 'Stills or a reel let productions see what you do before they message you.', a: 'Add stills', go: () => push({ name: 'editProfile' }) }
    : !availability.open
      ? { t: 'Set your availability', b: 'Productions filter by dates. Say when you can take work.', a: 'Set dates', go: () => openSheet({ name: 'availability' }) }
      : !seed.about[viewer.id]
        ? { t: 'Add a short bio', b: 'Two lines on the work you do and the work you want.', a: 'Add bio', go: () => push({ name: 'editProfile' }) }
        : null;
  if (!step || dismissed) return null;
  return (
    <aside className="first-step" aria-label="Next step">
      <div>
        <p className="item-title">{step.t}</p>
        <p className="meta">{step.b}</p>
      </div>
      <div className="first-step-actions">
        <Button size="s" variant="secondary" onClick={step.go}>
          {step.a}
        </Button>
        <button className="link link--small" onClick={() => setDismissed(true)}>
          Later
        </button>
      </div>
    </aside>
  );
}
