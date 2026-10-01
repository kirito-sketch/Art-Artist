import { motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import * as seed from '../../data/seed';
import { craftDef } from '../../data/crafts';
import type { Craft } from '../../data/types';
import { blockedBy, discoverableProjects, recommendedRoles, searchableHouses } from '../../domain/discovery';
import { useStore } from '../../state/store';
import { forYou, person } from '../../state/selectors';
import { CraftObject, type CraftObjectKind } from '../../ui/craft';
import { PortraitCard } from '../../ui/compose';
import { spring, stagger } from '../../ui/motion';
import { Button, FollowButton, SectionHeader } from '../../ui/primitives';
import { FeaturedCard } from './OpportunityCard';

/*
 * First-run Home: the first screen after onboarding. It is built only from what onboarding captured
 * (craft, other crafts, city, languages, availability, work) and from real, discoverable content.
 * No network events, no invented activity: a new person has none, so none is shown. As their
 * network grows, the returning Home's modules take over (see HomeScreen).
 *
 * Every block carries data-world so the Phase 2 onboarding → Home transition can resolve the
 * sections around the craft object without another layout.
 */

const OBJECT_FOR: Partial<Record<Craft, CraftObjectKind>> = {
  cinematographer: 'lens',
  camera: 'lens',
  lighting: 'lens',
  editor: 'timeline',
  colourist: 'timeline',
  vfx: 'timeline',
  sound: 'microphone',
  music: 'microphone',
  'production-design': 'swatches',
  costume: 'swatches',
  makeup: 'swatches',
};

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

const jump = (id: string) => document.querySelector(`[data-world="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/*
 * The intro is static-first and compact: context, title, one line, then the real counts. The craft
 * object is a small supporting mark at the upper right; it never reserves space of its own. Counts
 * that are zero are left out, and the module shrinks with them. Motion (forming) only nudges
 * things into place; nothing is ever hidden waiting for an animation.
 */
export function WorldIntro({ goDiscover, forming = false }: { goDiscover: (scope?: string) => void; forming?: boolean }) {
  const { viewer } = useStore();
  const me = person(viewer.id);
  const craft = craftDef(me.craft);
  const blocked = blockedBy(viewer.id);
  const kind = OBJECT_FOR[me.craft];
  const counts = (
    [
      ['roles', recommendedRoles(viewer.id, me.craft, blocked).length, 'role', 'roles'],
      ['people', (seed.suggestedFor[viewer.id] ?? []).filter((id) => !blocked.includes(id)).length, 'person', 'people'],
      ['projects', discoverableProjects(blocked).length, 'project', 'projects'],
      ['houses', searchableHouses(blocked).length, 'production house', 'production houses'],
    ] as const
  ).filter(([, n]) => n > 0);

  return (
    <section className="world-intro" data-world="intro" aria-labelledby="world-title">
      {kind && (
        <motion.span className="world-object" data-world-anchor aria-hidden initial={forming ? { scale: 1.35, y: 12, rotate: 4 } : false} animate={{ scale: 1, y: 0, rotate: -6 }} transition={{ ...spring.settle, delay: 0.05 }}>
          <span className="object-tile-shadow" />
          <span className="object-tile-asset">
            <CraftObject kind={kind} size={76} />
          </span>
        </motion.span>
      )}
      <motion.p className="world-kicker" {...rise(forming, 0)}>
        {craft?.label ?? me.role}
        {me.city ? ` · ${me.city}` : ''}
      </motion.p>
      <motion.h1 className="world-title" id="world-title" {...rise(forming, 1)}>
        Your world on Ana
      </motion.h1>
      <motion.p className="world-line" {...rise(forming, 2)}>
        A personalised view of roles, people and projects relevant to your craft.
      </motion.p>
      {counts.length > 0 && (
        <motion.div className="world-counts" {...rise(forming, 3)}>
          {counts.map(([id, n, one, many]) => (
            <button key={id} className="world-count" onClick={() => (id === 'roles' ? goDiscover('roles') : jump(id))} aria-label={id === 'roles' ? `${n} open roles in your craft, open in Discover` : `${n} ${n === 1 ? one : many}, jump to section`}>
              <b>{n}</b> {n === 1 ? one : many}
            </button>
          ))}
        </motion.div>
      )}
    </section>
  );
}

export function FirstRoles({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const { viewer, scenario, push } = useStore();
  const me = person(viewer.id);
  const opps = forYou(viewer, scenario);
  // Say only what matching actually used: the craft, and the city where the role is in it.
  const why = opps.some((o) => o.city.includes(me.city)) ? 'your craft and your city' : 'your craft';
  return (
    <section className="cards-roles v-section" data-world="roles">
      <SectionHeader title="Roles for you" action="See all" onAction={() => goDiscover('roles')} />
      <p className="world-why">Matched on {why}. Every open role is in Discover.</p>
      {opps.length ? (
        <div className="carousel carousel--roles">
          {opps.map((o, i) => (
            <motion.div key={o.id} className="carousel-item" {...stagger(i, 0.05)}>
              <FeaturedCard o={o} onOpen={() => push({ name: 'opportunity', id: o.id, from: 'card' })} />
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="meta">No roles match your craft yet. More appear as productions post; every open role is in Discover.</p>
      )}
    </section>
  );
}

/** People in your craft, each shown on their own credited work, with the reason they are here. */
export function FirstPeople() {
  const { viewer, following, toggleFollow, push } = useStore();
  const me = person(viewer.id);
  const blocked = blockedBy(viewer.id);
  const ids = (seed.suggestedFor[viewer.id] ?? []).filter((id) => !blocked.includes(id));
  if (!ids.length) return null;
  return (
    <section className="v-section" data-world="people">
      <SectionHeader title="People in your craft" />
      <div className="portrait-rail">
        {ids.map((id) => {
          const p = person(id);
          const sameCraft = p.craft === me.craft || (me.crafts ?? []).includes(p.craft);
          const reason = sameCraft && p.city === me.city ? `Your craft, in ${me.city}` : sameCraft ? `Your craft · ${p.city}` : `In ${p.city}`;
          return (
            <PortraitCard
              key={id}
              person={p}
              context={reason}
              onPress={() => push({ name: 'profile', id })}
              action={<FollowButton on={following.includes(id)} onToggle={() => toggleFollow(id)} name={p.name} block />}
            />
          );
        })}
      </div>
    </section>
  );
}

/** One quiet next step, only while something useful is missing. Never a checklist. */
export function FirstStep() {
  const { viewer, push, userPortfolio, availability, openSheet } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const hasWork = (seed.portfolio[viewer.id]?.length ?? 0) + userPortfolio.length > 0;
  const step = !hasWork
    ? { t: 'Add your work', b: 'Stills or a reel let productions see what you do before they message you.', a: 'Add work', go: () => push({ name: 'editProfile' }) }
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

function rise(forming: boolean, i: number) {
  return forming ? { initial: { y: 8 }, animate: { y: 0 }, transition: { ...spring.settle, delay: 0.12 + i * 0.05 } } : {};
}
